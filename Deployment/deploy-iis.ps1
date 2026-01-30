<#
.SYNOPSIS
    Deploy CASEC project to IIS (frontend + backend).

.DESCRIPTION
    Stops the app pool, copies frontend dist + published backend,
    restarts the app pool, and runs a health check.

.PARAMETER SiteName
    IIS site name (e.g., "Asso_CASEC")

.PARAMETER AppPoolName
    IIS app pool name (defaults to SiteName)

.PARAMETER FrontendPath
    Physical path for the frontend site root

.PARAMETER BackendPath
    Physical path for the backend API application

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

    [string]$FrontendPath = "F:\New_WWW\CASEC\WWW",

    [string]$BackendPath = "F:\New_WWW\CASEC\API",

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

# -- Resolve paths --
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYING: $SiteName" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

$frontendPath = $FrontendPath
$backendPath = $BackendPath

Write-Host "[INFO] Frontend path: $frontendPath"
Write-Host "[INFO] Backend path:  $backendPath"

# Verify artifacts exist
if (-not (Test-Path $FrontendArtifact)) {
    throw "Frontend artifact not found: $FrontendArtifact"
}
if (-not (Test-Path $BackendArtifact)) {
    throw "Backend artifact not found: $BackendArtifact"
}

# Verify target paths exist
if (-not (Test-Path $frontendPath)) {
    throw "Frontend target path not found: $frontendPath"
}
if (-not (Test-Path $backendPath)) {
    throw "Backend target path not found: $backendPath"
}

# -- Backup current deployment --
if (-not $SkipBackup) {
    $timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
    $backupDir = Join-Path $BackupRoot "$SiteName\$timestamp"

    Write-Host "`n[BACKUP] Creating backup at $backupDir" -ForegroundColor Yellow

    New-Item -ItemType Directory -Path "$backupDir\frontend" -Force | Out-Null
    New-Item -ItemType Directory -Path "$backupDir\backend" -Force | Out-Null

    if (Test-Path $frontendPath) {
        Get-ChildItem $frontendPath -Exclude "api" | Copy-Item -Destination "$backupDir\frontend" -Recurse -Force
    }
    if (Test-Path $backendPath) {
        Copy-Item -Path "$backendPath\*" -Destination "$backupDir\backend" -Recurse -Force
    }

    Write-Host "[BACKUP] Done" -ForegroundColor Green

    # Keep only last 5 backups
    $backupSiteDir = Join-Path $BackupRoot $SiteName
    if (Test-Path $backupSiteDir) {
        $allBackups = Get-ChildItem $backupSiteDir -Directory | Sort-Object Name -Descending
        if ($allBackups.Count -gt 5) {
            $allBackups | Select-Object -Skip 5 | ForEach-Object {
                Write-Host "[BACKUP] Removing old backup: $($_.Name)" -ForegroundColor DarkGray
                Remove-Item $_.FullName -Recurse -Force
            }
        }
    }
}

# -- Stop app pool using appcmd --
Write-Host "`n[DEPLOY] Stopping app pool: $AppPoolName" -ForegroundColor Yellow
$appcmd = "$env:SystemRoot\System32\inetsrv\appcmd.exe"

try {
    $poolState = & $appcmd list apppool $AppPoolName /text:state 2>$null
    if ($poolState -eq "Started") {
        & $appcmd stop apppool $AppPoolName
        Start-Sleep -Seconds 3
    }
    Write-Host "[DEPLOY] App pool stopped" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Could not stop app pool: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "[WARN] Continuing with deployment..." -ForegroundColor Yellow
}

# -- Deploy frontend --
Write-Host "`n[DEPLOY] Copying frontend..." -ForegroundColor Yellow

# Remove old frontend files (but preserve api folder and web.config)
Get-ChildItem $frontendPath -Exclude "api", "web.config", "uploads", "wwwroot" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Copy new frontend files
Copy-Item -Path "$FrontendArtifact\*" -Destination $frontendPath -Recurse -Force
Write-Host "[DEPLOY] Frontend deployed" -ForegroundColor Green

# -- Deploy backend --
Write-Host "`n[DEPLOY] Copying backend..." -ForegroundColor Yellow

# Remove old backend files (but preserve config and data)
$preserveFiles = @("appsettings.Production.json", "appsettings.production.json", "web.config", "uploads", "wwwroot", "logs")
Get-ChildItem $backendPath -Exclude $preserveFiles | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Copy new backend files
Copy-Item -Path "$BackendArtifact\*" -Destination $backendPath -Recurse -Force
Write-Host "[DEPLOY] Backend deployed" -ForegroundColor Green

# -- Start app pool using appcmd --
Write-Host "`n[DEPLOY] Starting app pool: $AppPoolName" -ForegroundColor Yellow
try {
    & $appcmd start apppool $AppPoolName
    Start-Sleep -Seconds 2
    Write-Host "[DEPLOY] App pool started" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Could not start app pool: $($_.Exception.Message)" -ForegroundColor Yellow
}

# -- Health check --
if ($HealthCheckUrl) {
    Write-Host "`n[HEALTH] Checking $HealthCheckUrl..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3

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
