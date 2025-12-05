using CasecApi.Models;

namespace CasecApi.Services;

public interface IAssetService
{
    /// <summary>
    /// Uploads a file and creates an asset record in the database
    /// </summary>
    /// <param name="file">The file to upload</param>
    /// <param name="folder">The folder/prefix to store the file in</param>
    /// <param name="objectType">Optional object type (e.g., "Club", "User", "Theme")</param>
    /// <param name="objectId">Optional object ID</param>
    /// <param name="uploadedBy">Optional user ID who uploaded the file</param>
    /// <returns>The result containing the asset URL and ID</returns>
    Task<AssetUploadResult> UploadAssetAsync(
        IFormFile file,
        string folder,
        string? objectType = null,
        int? objectId = null,
        int? uploadedBy = null);

    /// <summary>
    /// Deletes an asset by ID (soft delete)
    /// </summary>
    /// <param name="fileId">The asset file ID</param>
    /// <returns>True if deletion was successful</returns>
    Task<bool> DeleteAssetAsync(int fileId);

    /// <summary>
    /// Gets an asset by ID
    /// </summary>
    /// <param name="fileId">The asset file ID</param>
    /// <returns>The asset or null if not found</returns>
    Task<Asset?> GetAssetAsync(int fileId);

    /// <summary>
    /// Gets assets by object type and ID
    /// </summary>
    /// <param name="objectType">The object type</param>
    /// <param name="objectId">The object ID</param>
    /// <returns>List of assets</returns>
    Task<List<Asset>> GetAssetsByObjectAsync(string objectType, int objectId);
}

public class AssetUploadResult
{
    public bool Success { get; set; }
    public int? FileId { get; set; }
    public string? Url { get; set; }
    public string? Error { get; set; }
    public long FileSize { get; set; }
    public string? ContentType { get; set; }
    public string? OriginalFileName { get; set; }
}
