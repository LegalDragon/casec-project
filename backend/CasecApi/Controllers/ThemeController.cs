using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using CasecApi.Data;
using UserEntity = CasecApi.Models.User;
using CasecApi.Models;
using CasecApi.Models.DTOs;
using CasecApi.Services;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
public class ThemeController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly IAssetService _assetService;
    private readonly ILogger<ThemeController> _logger;

    public ThemeController(CasecDbContext context, IAssetService assetService, ILogger<ThemeController> logger)
    {
        _context = context;
        _assetService = assetService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    // GET: api/Theme/active (Public - no auth required)
    [AllowAnonymous]
    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<ThemeSettingsDto>>> GetActiveTheme()
    {
        try
        {
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            if (theme == null)
            {
                // Return default theme if none exists
                return Ok(new ApiResponse<ThemeSettingsDto>
                {
                    Success = true,
                    Data = GetDefaultTheme()
                });
            }

            var themeDto = MapToDto(theme);

            return Ok(new ApiResponse<ThemeSettingsDto>
            {
                Success = true,
                Data = themeDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching active theme");
            return StatusCode(500, new ApiResponse<ThemeSettingsDto>
            {
                Success = false,
                Message = "An error occurred while fetching theme"
            });
        }
    }

    // GET: api/Theme (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<ThemeSettingsDto>>> GetTheme()
    {
        try
        {
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            if (theme == null)
            {
                // Create default theme if none exists
                theme = await CreateDefaultThemeAsync();
            }

            var themeDto = MapToDto(theme);

            return Ok(new ApiResponse<ThemeSettingsDto>
            {
                Success = true,
                Data = themeDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching theme");
            return StatusCode(500, new ApiResponse<ThemeSettingsDto>
            {
                Success = false,
                Message = "An error occurred while fetching theme"
            });
        }
    }

    // PUT: api/Theme (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPut]
    public async Task<ActionResult<ApiResponse<ThemeSettingsDto>>> UpdateTheme([FromBody] UpdateThemeRequest request)
    {
        try
        {
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            if (theme == null)
            {
                // Create default theme if none exists
                theme = await CreateDefaultThemeAsync();
            }

            var currentUserId = GetCurrentUserId();

            // Update fields
            if (!string.IsNullOrEmpty(request.OrganizationName))
                theme.OrganizationName = request.OrganizationName;
            
            if (request.LogoUrl != null)
                theme.LogoUrl = request.LogoUrl;
            
            if (request.FaviconUrl != null)
                theme.FaviconUrl = request.FaviconUrl;

            // Primary colors
            if (!string.IsNullOrEmpty(request.PrimaryColor))
                theme.PrimaryColor = request.PrimaryColor;
            if (!string.IsNullOrEmpty(request.PrimaryDarkColor))
                theme.PrimaryDarkColor = request.PrimaryDarkColor;
            if (!string.IsNullOrEmpty(request.PrimaryLightColor))
                theme.PrimaryLightColor = request.PrimaryLightColor;

            // Accent colors
            if (!string.IsNullOrEmpty(request.AccentColor))
                theme.AccentColor = request.AccentColor;
            if (!string.IsNullOrEmpty(request.AccentDarkColor))
                theme.AccentDarkColor = request.AccentDarkColor;
            if (!string.IsNullOrEmpty(request.AccentLightColor))
                theme.AccentLightColor = request.AccentLightColor;

            // Status colors
            if (!string.IsNullOrEmpty(request.SuccessColor))
                theme.SuccessColor = request.SuccessColor;
            if (!string.IsNullOrEmpty(request.ErrorColor))
                theme.ErrorColor = request.ErrorColor;
            if (!string.IsNullOrEmpty(request.WarningColor))
                theme.WarningColor = request.WarningColor;
            if (!string.IsNullOrEmpty(request.InfoColor))
                theme.InfoColor = request.InfoColor;

            // Text colors
            if (!string.IsNullOrEmpty(request.TextPrimaryColor))
                theme.TextPrimaryColor = request.TextPrimaryColor;
            if (!string.IsNullOrEmpty(request.TextSecondaryColor))
                theme.TextSecondaryColor = request.TextSecondaryColor;
            if (!string.IsNullOrEmpty(request.TextLightColor))
                theme.TextLightColor = request.TextLightColor;

            // Background colors
            if (!string.IsNullOrEmpty(request.BackgroundColor))
                theme.BackgroundColor = request.BackgroundColor;
            if (!string.IsNullOrEmpty(request.BackgroundSecondaryColor))
                theme.BackgroundSecondaryColor = request.BackgroundSecondaryColor;

            // Other colors
            if (!string.IsNullOrEmpty(request.BorderColor))
                theme.BorderColor = request.BorderColor;
            if (!string.IsNullOrEmpty(request.ShadowColor))
                theme.ShadowColor = request.ShadowColor;

            // Typography
            if (!string.IsNullOrEmpty(request.FontFamily))
                theme.FontFamily = request.FontFamily;
            if (!string.IsNullOrEmpty(request.HeadingFontFamily))
                theme.HeadingFontFamily = request.HeadingFontFamily;

            // Custom CSS
            if (request.CustomCss != null)
                theme.CustomCss = request.CustomCss;

            // Home Page Quote
            if (request.HomeQuote != null)
                theme.HomeQuote = request.HomeQuote;
            if (request.HomeQuoteSubtext != null)
                theme.HomeQuoteSubtext = request.HomeQuoteSubtext;

            // Hero video URLs
            if (request.HeroVideoUrls != null)
                theme.HeroVideoUrls = request.HeroVideoUrls;

            theme.UpdatedBy = currentUserId;
            theme.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "ThemeUpdated",
                Description = "Updated theme settings"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            var themeDto = MapToDto(theme);

            return Ok(new ApiResponse<ThemeSettingsDto>
            {
                Success = true,
                Message = "Theme updated successfully",
                Data = themeDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating theme");
            return StatusCode(500, new ApiResponse<ThemeSettingsDto>
            {
                Success = false,
                Message = "An error occurred while updating theme"
            });
        }
    }

    // POST: api/Theme/logo (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost("logo")]
    public async Task<ActionResult<ApiResponse<UploadResponse>>> UploadLogo(IFormFile file)
    {
        try
        {
            var currentUserId = GetCurrentUserId();

            // Get current theme
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            // Delete old logo asset if exists
            if (theme != null && !string.IsNullOrEmpty(theme.LogoUrl) && theme.LogoUrl.StartsWith("/asset/"))
            {
                var oldFileIdStr = theme.LogoUrl.Replace("/asset/", "");
                if (int.TryParse(oldFileIdStr, out var oldFileId))
                {
                    await _assetService.DeleteAssetAsync(oldFileId);
                }
            }

            // Upload new logo using asset service (saves to database)
            var uploadResult = await _assetService.UploadAssetAsync(
                file,
                "theme",
                objectType: "Theme",
                objectId: theme?.ThemeId,
                uploadedBy: currentUserId
            );

            if (!uploadResult.Success)
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = uploadResult.Error ?? "Failed to upload file"
                });
            }

            // Update theme if exists
            if (theme != null)
            {
                theme.LogoUrl = uploadResult.Url; // Now saves as /asset/{id}
                theme.UpdatedBy = currentUserId;
                theme.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "LogoUpdated",
                Description = "Updated organization logo"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<UploadResponse>
            {
                Success = true,
                Message = "Logo uploaded successfully",
                Data = new UploadResponse { Url = uploadResult.Url }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading logo");
            return StatusCode(500, new ApiResponse<UploadResponse>
            {
                Success = false,
                Message = "An error occurred while uploading logo"
            });
        }
    }

    // POST: api/Theme/favicon (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost("favicon")]
    public async Task<ActionResult<ApiResponse<UploadResponse>>> UploadFavicon(IFormFile file)
    {
        try
        {
            var currentUserId = GetCurrentUserId();

            // Get current theme
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            // Delete old favicon asset if exists
            if (theme != null && !string.IsNullOrEmpty(theme.FaviconUrl) && theme.FaviconUrl.StartsWith("/asset/"))
            {
                var oldFileIdStr = theme.FaviconUrl.Replace("/asset/", "");
                if (int.TryParse(oldFileIdStr, out var oldFileId))
                {
                    await _assetService.DeleteAssetAsync(oldFileId);
                }
            }

            // Upload new favicon using asset service (saves to database)
            var uploadResult = await _assetService.UploadAssetAsync(
                file,
                "theme",
                objectType: "Theme",
                objectId: theme?.ThemeId,
                uploadedBy: currentUserId
            );

            if (!uploadResult.Success)
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = uploadResult.Error ?? "Failed to upload file"
                });
            }

            // Update theme if exists
            if (theme != null)
            {
                theme.FaviconUrl = uploadResult.Url; // Now saves as /asset/{id}
                theme.UpdatedBy = currentUserId;
                theme.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "FaviconUpdated",
                Description = "Updated organization favicon"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<UploadResponse>
            {
                Success = true,
                Message = "Favicon uploaded successfully",
                Data = new UploadResponse { Url = uploadResult.Url }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading favicon");
            return StatusCode(500, new ApiResponse<UploadResponse>
            {
                Success = false,
                Message = "An error occurred while uploading favicon"
            });
        }
    }

    // POST: api/Theme/hero-video (Admin only)
    // Upload a hero video file and return the asset URL
    [Authorize(Roles = "Admin")]
    [HttpPost("hero-video")]
    public async Task<ActionResult<ApiResponse<UploadResponse>>> UploadHeroVideo(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = "No file provided"
                });
            }

            // Validate file type
            var allowedTypes = new[] { "video/mp4", "video/webm", "video/ogg", "video/quicktime" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = "Invalid file type. Allowed types: MP4, WebM, OGG, MOV"
                });
            }

            var currentUserId = GetCurrentUserId();

            // Get current theme
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            // Upload video using asset service
            var uploadResult = await _assetService.UploadAssetAsync(
                file,
                "theme/hero-videos",
                objectType: "ThemeHeroVideo",
                objectId: theme?.ThemeId,
                uploadedBy: currentUserId
            );

            if (!uploadResult.Success)
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = uploadResult.Error ?? "Failed to upload file"
                });
            }

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "HeroVideoUploaded",
                Description = $"Uploaded hero video: {file.FileName}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<UploadResponse>
            {
                Success = true,
                Message = "Hero video uploaded successfully",
                Data = new UploadResponse { Url = uploadResult.Url }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading hero video");
            return StatusCode(500, new ApiResponse<UploadResponse>
            {
                Success = false,
                Message = "An error occurred while uploading hero video"
            });
        }
    }

    // GET: api/Theme/presets (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpGet("presets")]
    public async Task<ActionResult<ApiResponse<List<ThemePresetDto>>>> GetThemePresets()
    {
        try
        {
            var presets = await _context.ThemePresets
                .Select(p => new ThemePresetDto
                {
                    PresetId = p.PresetId,
                    PresetName = p.PresetName,
                    Description = p.Description,
                    PrimaryColor = p.PrimaryColor,
                    PrimaryDarkColor = p.PrimaryDarkColor,
                    PrimaryLightColor = p.PrimaryLightColor,
                    AccentColor = p.AccentColor,
                    AccentDarkColor = p.AccentDarkColor,
                    AccentLightColor = p.AccentLightColor,
                    PreviewImage = p.PreviewImage,
                    IsDefault = p.IsDefault
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<ThemePresetDto>>
            {
                Success = true,
                Data = presets
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching theme presets");
            return StatusCode(500, new ApiResponse<List<ThemePresetDto>>
            {
                Success = false,
                Message = "An error occurred while fetching theme presets"
            });
        }
    }

    // POST: api/Theme/reset (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost("reset")]
    public async Task<ActionResult<ApiResponse<ThemeSettingsDto>>> ResetToDefault()
    {
        try
        {
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            if (theme == null)
            {
                // Create default theme if none exists
                theme = await CreateDefaultThemeAsync();
            }

            var currentUserId = GetCurrentUserId();

            // Reset to default values
            var defaultTheme = GetDefaultTheme();
            theme.PrimaryColor = defaultTheme.PrimaryColor;
            theme.PrimaryDarkColor = defaultTheme.PrimaryDarkColor;
            theme.PrimaryLightColor = defaultTheme.PrimaryLightColor;
            theme.AccentColor = defaultTheme.AccentColor;
            theme.AccentDarkColor = defaultTheme.AccentDarkColor;
            theme.AccentLightColor = defaultTheme.AccentLightColor;
            theme.SuccessColor = defaultTheme.SuccessColor;
            theme.ErrorColor = defaultTheme.ErrorColor;
            theme.WarningColor = defaultTheme.WarningColor;
            theme.InfoColor = defaultTheme.InfoColor;
            theme.TextPrimaryColor = defaultTheme.TextPrimaryColor;
            theme.TextSecondaryColor = defaultTheme.TextSecondaryColor;
            theme.TextLightColor = defaultTheme.TextLightColor;
            theme.BackgroundColor = defaultTheme.BackgroundColor;
            theme.BackgroundSecondaryColor = defaultTheme.BackgroundSecondaryColor;
            theme.BorderColor = defaultTheme.BorderColor;
            theme.ShadowColor = defaultTheme.ShadowColor;
            theme.FontFamily = defaultTheme.FontFamily;
            theme.HeadingFontFamily = defaultTheme.HeadingFontFamily;
            theme.CustomCss = null;

            theme.UpdatedBy = currentUserId;
            theme.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "ThemeReset",
                Description = "Reset theme to default"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            var themeDto = MapToDto(theme);

            return Ok(new ApiResponse<ThemeSettingsDto>
            {
                Success = true,
                Message = "Theme reset to default",
                Data = themeDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting theme");
            return StatusCode(500, new ApiResponse<ThemeSettingsDto>
            {
                Success = false,
                Message = "An error occurred while resetting theme"
            });
        }
    }

    // Helper methods
    private async Task<ThemeSettings> CreateDefaultThemeAsync()
    {
        var defaultTheme = new ThemeSettings
        {
            OrganizationName = "CASEC",
            PrimaryColor = "#047857",
            PrimaryDarkColor = "#065f46",
            PrimaryLightColor = "#d1fae5",
            AccentColor = "#f59e0b",
            AccentDarkColor = "#d97706",
            AccentLightColor = "#fef3c7",
            SuccessColor = "#10b981",
            ErrorColor = "#ef4444",
            WarningColor = "#f59e0b",
            InfoColor = "#3b82f6",
            TextPrimaryColor = "#111827",
            TextSecondaryColor = "#6b7280",
            TextLightColor = "#f9fafb",
            BackgroundColor = "#ffffff",
            BackgroundSecondaryColor = "#f3f4f6",
            BorderColor = "#e5e7eb",
            ShadowColor = "#00000026",
            FontFamily = "Inter, system-ui, sans-serif",
            HeadingFontFamily = "Playfair Display, serif",
            IsActive = true,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ThemeSettings.Add(defaultTheme);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created default theme settings");
        return defaultTheme;
    }

    private ThemeSettingsDto MapToDto(ThemeSettings theme)
    {
        return new ThemeSettingsDto
        {
            ThemeId = theme.ThemeId,
            OrganizationName = theme.OrganizationName,
            LogoUrl = theme.LogoUrl,
            FaviconUrl = theme.FaviconUrl,
            PrimaryColor = theme.PrimaryColor,
            PrimaryDarkColor = theme.PrimaryDarkColor,
            PrimaryLightColor = theme.PrimaryLightColor,
            AccentColor = theme.AccentColor,
            AccentDarkColor = theme.AccentDarkColor,
            AccentLightColor = theme.AccentLightColor,
            SuccessColor = theme.SuccessColor,
            ErrorColor = theme.ErrorColor,
            WarningColor = theme.WarningColor,
            InfoColor = theme.InfoColor,
            TextPrimaryColor = theme.TextPrimaryColor,
            TextSecondaryColor = theme.TextSecondaryColor,
            TextLightColor = theme.TextLightColor,
            BackgroundColor = theme.BackgroundColor,
            BackgroundSecondaryColor = theme.BackgroundSecondaryColor,
            BorderColor = theme.BorderColor,
            ShadowColor = theme.ShadowColor,
            FontFamily = theme.FontFamily,
            HeadingFontFamily = theme.HeadingFontFamily,
            CustomCss = theme.CustomCss,
            HomeQuote = theme.HomeQuote,
            HomeQuoteSubtext = theme.HomeQuoteSubtext,
            HeroVideoUrls = theme.HeroVideoUrls,
            UpdatedAt = theme.UpdatedAt
        };
    }

    private ThemeSettingsDto GetDefaultTheme()
    {
        return new ThemeSettingsDto
        {
            OrganizationName = "CASEC",
            PrimaryColor = "#047857",
            PrimaryDarkColor = "#065f46",
            PrimaryLightColor = "#d1fae5",
            AccentColor = "#f59e0b",
            AccentDarkColor = "#d97706",
            AccentLightColor = "#fef3c7",
            SuccessColor = "#10b981",
            ErrorColor = "#ef4444",
            WarningColor = "#f59e0b",
            InfoColor = "#3b82f6",
            TextPrimaryColor = "#111827",
            TextSecondaryColor = "#6b7280",
            TextLightColor = "#f9fafb",
            BackgroundColor = "#ffffff",
            BackgroundSecondaryColor = "#f3f4f6",
            BorderColor = "#e5e7eb",
            ShadowColor = "#00000026",
            FontFamily = "Inter, system-ui, sans-serif",
            HeadingFontFamily = "Playfair Display, serif"
        };
    }
}
