using Microsoft.Extensions.Options;
using CasecApi.Data;
using CasecApi.Models;

namespace CasecApi.Services;

public class AssetService : IAssetService
{
    private readonly CasecDbContext _context;
    private readonly IFileStorageService _fileStorage;
    private readonly FileStorageSettings _storageSettings;
    private readonly ILogger<AssetService> _logger;

    public AssetService(
        CasecDbContext context,
        IFileStorageService fileStorage,
        IOptions<FileStorageSettings> storageSettings,
        ILogger<AssetService> logger)
    {
        _context = context;
        _fileStorage = fileStorage;
        _storageSettings = storageSettings.Value;
        _logger = logger;
    }

    public async Task<AssetUploadResult> UploadAssetAsync(
        IFormFile file,
        string folder,
        string? objectType = null,
        int? objectId = null,
        int? uploadedBy = null)
    {
        try
        {
            // Upload file using the file storage service
            var uploadResult = await _fileStorage.UploadFileAsync(file, folder);

            if (!uploadResult.Success)
            {
                return new AssetUploadResult
                {
                    Success = false,
                    Error = uploadResult.Error
                };
            }

            // Extract storage path from URL
            var storagePath = GetStoragePathFromUrl(uploadResult.Url!, folder);

            // Create asset record in database
            var asset = new Asset
            {
                FileName = Path.GetFileName(uploadResult.Url!),
                OriginalFileName = file.FileName,
                ContentType = file.ContentType,
                FileSize = file.Length,
                StorageProvider = _storageSettings.Provider,
                StoragePath = storagePath,
                Folder = folder,
                ObjectType = objectType,
                ObjectId = objectId,
                UploadedBy = uploadedBy,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            _context.Assets.Add(asset);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Asset created successfully: FileId={FileId}, FileName={FileName}",
                asset.FileId, asset.FileName);

            // Return the asset URL as /api/asset/{id}
            return new AssetUploadResult
            {
                Success = true,
                FileId = asset.FileId,
                Url = $"/api/asset/{asset.FileId}",
                FileSize = asset.FileSize,
                ContentType = asset.ContentType,
                OriginalFileName = asset.OriginalFileName
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading asset");
            return new AssetUploadResult
            {
                Success = false,
                Error = "An error occurred while uploading the file"
            };
        }
    }

    public async Task<bool> DeleteAssetAsync(int fileId)
    {
        try
        {
            var asset = await _context.Assets.FindAsync(fileId);
            if (asset == null || asset.IsDeleted)
            {
                return false;
            }

            // Soft delete the asset record
            asset.IsDeleted = true;
            asset.DeletedAt = DateTime.UtcNow;

            // Optionally delete the physical file (uncomment if you want hard delete)
            // var fullUrl = GetFullUrlFromStoragePath(asset.StoragePath, asset.Folder);
            // await _fileStorage.DeleteFileAsync(fullUrl);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Asset soft deleted: FileId={FileId}", fileId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting asset {FileId}", fileId);
            return false;
        }
    }

    public async Task<Asset?> GetAssetAsync(int fileId)
    {
        return await _context.Assets.FindAsync(fileId);
    }

    public async Task<List<Asset>> GetAssetsByObjectAsync(string objectType, int objectId)
    {
        return await Task.FromResult(
            _context.Assets
                .Where(a => a.ObjectType == objectType && a.ObjectId == objectId && !a.IsDeleted)
                .OrderByDescending(a => a.CreatedAt)
                .ToList()
        );
    }

    private string GetStoragePathFromUrl(string url, string folder)
    {
        // For local storage: /uploads/clubs/filename.jpg -> clubs/filename.jpg
        // For S3: https://bucket.s3.amazonaws.com/clubs/filename.jpg -> full URL
        if (_storageSettings.Provider.Equals("S3", StringComparison.OrdinalIgnoreCase))
        {
            return url; // Store full S3 URL
        }
        else
        {
            // Extract relative path from URL
            var baseUrl = _storageSettings.Local?.BaseUrl ?? "/uploads";
            if (url.StartsWith(baseUrl))
            {
                return url.Substring(baseUrl.Length).TrimStart('/');
            }
            return $"{folder}/{Path.GetFileName(url)}";
        }
    }
}
