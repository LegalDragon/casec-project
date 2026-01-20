namespace CasecApi.Services;

public interface IFileStorageService
{
    /// <summary>
    /// Uploads a file and returns the URL/path to access it
    /// </summary>
    /// <param name="file">The file to upload</param>
    /// <param name="folder">The folder/prefix to store the file in (e.g., "clubs", "theme", "users")</param>
    /// <param name="fileName">Optional custom filename. If null, a unique name will be generated</param>
    /// <returns>The URL or path to access the uploaded file</returns>
    Task<FileUploadResult> UploadFileAsync(IFormFile file, string folder, string? fileName = null);

    /// <summary>
    /// Deletes a file by its URL/path
    /// </summary>
    /// <param name="fileUrl">The URL or path of the file to delete</param>
    /// <returns>True if deletion was successful</returns>
    Task<bool> DeleteFileAsync(string fileUrl);

    /// <summary>
    /// Checks if a file exists
    /// </summary>
    /// <param name="fileUrl">The URL or path of the file</param>
    /// <returns>True if file exists</returns>
    Task<bool> FileExistsAsync(string fileUrl);
}

public class FileUploadResult
{
    public bool Success { get; set; }
    public string? Url { get; set; }
    public string? Error { get; set; }
    public long FileSize { get; set; }
    public string? ContentType { get; set; }
}

public class FileStorageSettings
{
    public string Provider { get; set; } = "Local"; // "Local" or "S3"
    public LocalStorageSettings? Local { get; set; }
    public S3StorageSettings? S3 { get; set; }
    public FileValidationSettings? Validation { get; set; }
}

public class LocalStorageSettings
{
    public string BasePath { get; set; } = "wwwroot/uploads";
    public string BaseUrl { get; set; } = "/uploads";
}

public class S3StorageSettings
{
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public string Region { get; set; } = "us-east-1";
    public string? BaseUrl { get; set; } // Optional CDN URL, otherwise uses S3 URL
}

public class FileValidationSettings
{
    public long MaxFileSizeBytes { get; set; } = 20 * 1024 * 1024; // 20MB default for images/documents
    public long MaxVideoFileSizeBytes { get; set; } = 100 * 1024 * 1024; // 100MB default for videos
    public string[] AllowedImageExtensions { get; set; } = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg" };
    public string[] AllowedDocumentExtensions { get; set; } = new[] { ".pdf", ".doc", ".docx" };
    public string[] AllowedVideoExtensions { get; set; } = new[] { ".mp4", ".webm", ".ogg", ".mov" };
}
