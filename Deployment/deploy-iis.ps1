<#
.SYNOPSIS
    Deploy CASEC project to IIS (frontend + backend virtual app).

.DESCRIPTION
    Stops the app pool, copies frontend dist + published backend,
    restarts the app pool, and runs a health check.

.PARAMETER SiteName
    IIS site name (e.g., "Asso_CASEC")

.PARAMETER AppPoolName
    IIS app pool name (defaults to SiteName)

.PARAMETER FrontendArtifact
    Path to the frontend build output (dist folder)

.PARAMETER BackendArtifact
    Path to the published backend output

.PARAMETER BackupRoot
    Root folder for deployment backups (default: F:\deploy-backups)

.PARAMETER HealthCheckUrl
    URL to check after deployment (optional)

.PARAMETER SkipBackup
    Skip creating a backup before deployment
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$SiteName,

    [string]$AppPoolName,

    [Parameter(Mandatory=$true)]
    [string]$FrontendArtifact,

    [Parameter(Mandatory=$true)]
    [string]$BackendArtifact,

    [string]$BackupRoot = "F:\deploy-backups",

    [string]$HealthCheckUrl = "",

    [switch]$SkipBackup
)

$ErrorActionPreference = "Stop"

# Default app pool to site name
if (-not $AppPoolName) { $AppPoolName = $SiteName }

# -- Import IIS module --
Import-Module WebAdministration -ErrorAction Stop

# -- Resolve paths from IIS --
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYING: $SiteName" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

$site = Get-Website -Name $SiteName -ErrorAction Stop
$frontendPath = $site.PhysicalPath -replace '%SystemDrive%', $env:SystemDrive
Write-Host "[INFO] Frontend path: $frontendPath"

# Backend is the /api virtual application under the site
$apiApp = Get-WebApplication -Site $SiteName -Name "api" -ErrorAction SilentlyContinue
if ($apiApp) {
    $backendPath = $apiApp.PhysicalPath -replace '%SystemDrive%', $env:SystemDrive
} else {
    # Fallback: assume backend is in an 'api' subfolder
    $backendPath = Join-Path $frontendPath "api"
}
Write-Host "[INFO] Backend path:  $backendPath"

# Verify artifacts exist
if (-not (Test-Path $FrontendArtifact)) {
    throw "Frontend artifact not found: $FrontendArtifact"
}
if (-not (Test-Path $BackendArtifact)) {
    throw "Backend artifact not found: $BackendArtifact"
}

# -- Backup current deployment --
if (-not $SkipBackup) {
    $timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
    $backupDir = Join-Path $BackupRoot "$SiteName\$timestamp"

    Write-Host "`n[BACKUP] Creating backup at $backupDir" -ForegroundColor Yellow

    New-Item -ItemType Directory -Path "$backupDir\frontend" -Force | Out-Null
    New-Item -ItemType Directory -Path "$backupDir\backend" -Force | Out-Null

    if (Test-Path $frontendPath) {
        # Backup frontend (exclude the api virtual app folder)
        Get-ChildItem $frontendPath -Exclude "api" | Copy-Item -Destination "$backupDir\frontend" -Recurse -Force
    }
    if (Test-Path $backendPath) {
        Copy-Item -Path "$backendPath\*" -Destination "$backupDir\backend" -Recurse -Force
    }

    Write-Host "[BACKUP] Done" -ForegroundColor Green

    # Keep only last 5 backups
    $allBackups = Get-ChildItem (Join-Path $BackupRoot $SiteName) -Directory | Sort-Object Name -Descending
    if ($allBackups.Count -gt 5) {
        $allBackups | Select-Object -Skip 5 | ForEach-Object {
            Write-Host "[BACKUP] Removing old backup: $($_.Name)" -ForegroundColor DarkGray
            Remove-Item $_.FullName -Recurse -Force
        }
    }
}

# -- Stop app pool --
Write-Host "`n[DEPLOY] Stopping app pool: $AppPoolName" -ForegroundColor Yellow
$pool = Get-WebAppPoolState -Name $AppPoolName -ErrorAction SilentlyContinue
if ($pool.Value -eq "Started") {
    Stop-WebAppPool -Name $AppPoolName
    # Wait for pool to fully stop
    $maxWait = 30
    $waited = 0
    while ((Get-WebAppPoolState -Name $AppPoolName).Value -ne "Stopped" -and $waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
    }
    if ($waited -ge $maxWait) {
        Write-Host "[WARN] App pool did not stop within ${maxWait}s, forcing..." -ForegroundColor Red
        Stop-WebAppPool -Name $AppPoolName -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}
Write-Host "[DEPLOY] App pool stopped" -ForegroundColor Green

# -- Deploy frontend --
Write-Host "`n[DEPLOY] Copying frontend..." -ForegroundColor Yellow

# Remove old frontend files (but preserve api folder and web.config)
Get-ChildItem $frontendPath -Exclude "api", "web.config", "uploads", "wwwroot" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Copy new frontend files
Copy-Item -Path "$FrontendArtifact\*" -Destination $frontendPath -Recurse -Force
Write-Host "[DEPLOY] Frontend deployed" -ForegroundColor Green

# -- Deploy backend --
Write-Host "`n[DEPLOY] Copying backend..." -ForegroundColor Yellow

# Remove old backend files (but preserve appsettings.Production.json and uploads)
$preserveFiles = @("appsettings.Production.json", "appsettings.production.json", "web.config", "uploads", "wwwroot", "logs")
Get-ChildItem $backendPath -Exclude $preserveFiles | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Copy new backend files
Copy-Item -Path "$BackendArtifact\*" -Destination $backendPath -Recurse -Force
Write-Host "[DEPLOY] Backend deployed" -ForegroundColor Green

# -- Start app pool --
Write-Host "`n[DEPLOY] Starting app pool: $AppPoolName" -ForegroundColor Yellow
Start-WebAppPool -Name $AppPoolName

$maxWait = 15
$waited = 0
while ((Get-WebAppPoolState -Name $AppPoolName).Value -ne "Started" -and $waited -lt $maxWait) {
    Start-Sleep -Seconds 1
    $waited++
}
Write-Host "[DEPLOY] App pool started" -ForegroundColor Green

# -- Health check --
if ($HealthCheckUrl) {
    Write-Host "`n[HEALTH] Checking $HealthCheckUrl..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3  # Give the app a moment to warm up

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $response = Invoke-WebRequest -Uri $HealthCheckUrl -UseBasicParsing -TimeoutSec 15
        if ($response.StatusCode -eq 200) {
            Write-Host "[HEALTH] OK - Health check passed (HTTP $($response.StatusCode))" -ForegroundColor Green
        } else {
            Write-Host "[HEALTH] FAIL - Unexpected status: $($response.StatusCode)" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "[HEALTH] FAIL - Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# -- Done --
Write-Host "`n===========================================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE: $SiteName" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
