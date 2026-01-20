using Microsoft.Extensions.Options;

namespace CasecApi.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly LocalStorageSettings _settings;
    private readonly FileValidationSettings _validation;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<LocalFileStorageService> _logger;

    public LocalFileStorageService(
        IOptions<FileStorageSettings> options,
        IWebHostEnvironment environment,
        ILogger<LocalFileStorageService> logger)
    {
        _settings = options.Value.Local ?? new LocalStorageSettings();
        _validation = options.Value.Validation ?? new FileValidationSettings();
        _environment = environment;
        _logger = logger;
    }

    public async Task<FileUploadResult> UploadFileAsync(IFormFile file, string folder, string? fileName = null)
    {
        try
        {
            // Validate file
            var validationError = ValidateFile(file);
            if (validationError != null)
            {
                return new FileUploadResult { Success = false, Error = validationError };
            }

            // Generate filename if not provided
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var finalFileName = fileName ?? $"{Guid.NewGuid()}{extension}";

            // Ensure the folder exists
            var uploadPath = GetPhysicalPath(folder);
            Directory.CreateDirectory(uploadPath);

            // Save the file
            var filePath = Path.Combine(uploadPath, finalFileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Generate URL
            var url = $"{_settings.BaseUrl}/{folder}/{finalFileName}";

            _logger.LogInformation("File uploaded successfully: {Url}", url);

            return new FileUploadResult
            {
                Success = true,
                Url = url,
                FileSize = file.Length,
                ContentType = file.ContentType
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file to local storage");
            return new FileUploadResult
            {
                Success = false,
                Error = "An error occurred while uploading the file"
            };
        }
    }

    public Task<bool> DeleteFileAsync(string fileUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(fileUrl))
                return Task.FromResult(false);

            // Convert URL to physical path
            var relativePath = fileUrl.TrimStart('/');
            if (relativePath.StartsWith("uploads/"))
            {
                relativePath = relativePath.Substring("uploads/".Length);
            }

            var physicalPath = Path.Combine(GetBasePath(), relativePath);

            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
                _logger.LogInformation("File deleted successfully: {Path}", physicalPath);
                return Task.FromResult(true);
            }

            _logger.LogWarning("File not found for deletion: {Path}", physicalPath);
            return Task.FromResult(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file: {Url}", fileUrl);
            return Task.FromResult(false);
        }
    }

    public Task<bool> FileExistsAsync(string fileUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(fileUrl))
                return Task.FromResult(false);

            var relativePath = fileUrl.TrimStart('/');
            if (relativePath.StartsWith("uploads/"))
            {
                relativePath = relativePath.Substring("uploads/".Length);
            }

            var physicalPath = Path.Combine(GetBasePath(), relativePath);
            return Task.FromResult(File.Exists(physicalPath));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking file existence: {Url}", fileUrl);
            return Task.FromResult(false);
        }
    }

    private string GetBasePath()
    {
        var basePath = _settings.BasePath;
        if (!Path.IsPathRooted(basePath))
        {
            basePath = Path.Combine(_environment.ContentRootPath, basePath);
        }
        return basePath;
    }

    private string GetPhysicalPath(string folder)
    {
        return Path.Combine(GetBasePath(), folder);
    }

    private string? ValidateFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return "No file provided";

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        // Check if it's a video file and apply video-specific size limit
        var isVideo = _validation.AllowedVideoExtensions.Contains(extension);
        var maxSize = isVideo ? _validation.MaxVideoFileSizeBytes : _validation.MaxFileSizeBytes;

        if (file.Length > maxSize)
            return $"File size must be less than {maxSize / (1024 * 1024)}MB";

        var allAllowed = _validation.AllowedImageExtensions
            .Concat(_validation.AllowedDocumentExtensions)
            .Concat(_validation.AllowedVideoExtensions)
            .ToArray();

        if (!allAllowed.Contains(extension))
            return $"File type '{extension}' is not allowed";

        return null;
    }
}
