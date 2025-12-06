using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using CasecApi.Data;
using CasecApi.Models;
using CasecApi.Services;

namespace CasecApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssetController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly IFileStorageService _fileStorage;
    private readonly FileStorageSettings _storageSettings;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<AssetController> _logger;

    public AssetController(
        CasecDbContext context,
        IFileStorageService fileStorage,
        IOptions<FileStorageSettings> storageSettings,
        IWebHostEnvironment environment,
        ILogger<AssetController> logger)
    {
        _context = context;
        _fileStorage = fileStorage;
        _storageSettings = storageSettings.Value;
        _environment = environment;
        _logger = logger;
    }

    /// <summary>
    /// Get a file by its ID
    /// </summary>
    /// <param name="id">The file ID</param>
    /// <returns>The file stream</returns>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetAsset(int id)
    {
        try
        {
            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.FileId == id && !a.IsDeleted);

            if (asset == null)
            {
                return NotFound(new { message = "Asset not found" });
            }

            // Get the file based on storage provider
            if (asset.StorageProvider.Equals("S3", StringComparison.OrdinalIgnoreCase))
            {
                // For S3, redirect to the S3 URL or serve via proxy
                var s3Url = asset.StoragePath;
                return Redirect(s3Url);
            }
            else
            {
                // For local storage, serve the file directly
                var localSettings = _storageSettings.Local ?? new LocalStorageSettings();
                var basePath = localSettings.BasePath;

                if (!Path.IsPathRooted(basePath))
                {
                    basePath = Path.Combine(_environment.ContentRootPath, basePath);
                }

                // The StoragePath contains the relative path like "clubs/filename.jpg"
                var filePath = Path.Combine(basePath, asset.StoragePath);

                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("Asset file not found on disk: {FilePath}", filePath);
                    return NotFound(new { message = "File not found on disk" });
                }

                var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
                return File(fileStream, asset.ContentType, asset.OriginalFileName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving asset {AssetId}", id);
            return StatusCode(500, new { message = "Error retrieving file" });
        }
    }

    /// <summary>
    /// Get asset metadata by ID
    /// </summary>
    /// <param name="id">The file ID</param>
    /// <returns>Asset metadata</returns>
    [HttpGet("{id:int}/info")]
    public async Task<IActionResult> GetAssetInfo(int id)
    {
        try
        {
            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.FileId == id && !a.IsDeleted);

            if (asset == null)
            {
                return NotFound(new { message = "Asset not found" });
            }

            return Ok(new
            {
                asset.FileId,
                asset.FileName,
                asset.OriginalFileName,
                asset.ContentType,
                asset.FileSize,
                asset.Folder,
                asset.ObjectType,
                asset.ObjectId,
                asset.CreatedAt,
                Url = $"/api/asset/{asset.FileId}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving asset info {AssetId}", id);
            return StatusCode(500, new { message = "Error retrieving asset info" });
        }
    }
}
