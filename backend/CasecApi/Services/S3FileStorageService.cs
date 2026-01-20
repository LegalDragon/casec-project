using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Options;

namespace CasecApi.Services;

public class S3FileStorageService : IFileStorageService
{
    private readonly S3StorageSettings _settings;
    private readonly FileValidationSettings _validation;
    private readonly IAmazonS3 _s3Client;
    private readonly ILogger<S3FileStorageService> _logger;

    public S3FileStorageService(
        IOptions<FileStorageSettings> options,
        ILogger<S3FileStorageService> logger)
    {
        _settings = options.Value.S3 ?? throw new ArgumentNullException("S3 settings are required");
        _validation = options.Value.Validation ?? new FileValidationSettings();
        _logger = logger;

        // Initialize S3 client
        var config = new AmazonS3Config
        {
            RegionEndpoint = RegionEndpoint.GetBySystemName(_settings.Region)
        };

        _s3Client = new AmazonS3Client(_settings.AccessKey, _settings.SecretKey, config);
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

            // Create S3 key (path)
            var key = $"{folder}/{finalFileName}";

            // Upload to S3
            using var stream = file.OpenReadStream();
            var uploadRequest = new TransferUtilityUploadRequest
            {
                InputStream = stream,
                Key = key,
                BucketName = _settings.BucketName,
                ContentType = file.ContentType,
                CannedACL = S3CannedACL.PublicRead // Make file publicly readable
            };

            var transferUtility = new TransferUtility(_s3Client);
            await transferUtility.UploadAsync(uploadRequest);

            // Generate URL
            var url = GetFileUrl(key);

            _logger.LogInformation("File uploaded to S3 successfully: {Url}", url);

            return new FileUploadResult
            {
                Success = true,
                Url = url,
                FileSize = file.Length,
                ContentType = file.ContentType
            };
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(ex, "S3 error uploading file: {Message}", ex.Message);
            return new FileUploadResult
            {
                Success = false,
                Error = "An error occurred while uploading to S3"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file to S3");
            return new FileUploadResult
            {
                Success = false,
                Error = "An error occurred while uploading the file"
            };
        }
    }

    public async Task<bool> DeleteFileAsync(string fileUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(fileUrl))
                return false;

            // Extract key from URL
            var key = ExtractKeyFromUrl(fileUrl);
            if (string.IsNullOrEmpty(key))
            {
                _logger.LogWarning("Could not extract S3 key from URL: {Url}", fileUrl);
                return false;
            }

            var deleteRequest = new DeleteObjectRequest
            {
                BucketName = _settings.BucketName,
                Key = key
            };

            await _s3Client.DeleteObjectAsync(deleteRequest);
            _logger.LogInformation("File deleted from S3 successfully: {Key}", key);
            return true;
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(ex, "S3 error deleting file: {Message}", ex.Message);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file from S3: {Url}", fileUrl);
            return false;
        }
    }

    public async Task<bool> FileExistsAsync(string fileUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(fileUrl))
                return false;

            var key = ExtractKeyFromUrl(fileUrl);
            if (string.IsNullOrEmpty(key))
                return false;

            var request = new GetObjectMetadataRequest
            {
                BucketName = _settings.BucketName,
                Key = key
            };

            await _s3Client.GetObjectMetadataAsync(request);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking file existence in S3: {Url}", fileUrl);
            return false;
        }
    }

    private string GetFileUrl(string key)
    {
        // Use custom CDN URL if provided, otherwise use S3 URL
        if (!string.IsNullOrEmpty(_settings.BaseUrl))
        {
            return $"{_settings.BaseUrl.TrimEnd('/')}/{key}";
        }

        return $"https://{_settings.BucketName}.s3.{_settings.Region}.amazonaws.com/{key}";
    }

    private string? ExtractKeyFromUrl(string url)
    {
        try
        {
            // Handle CDN URL
            if (!string.IsNullOrEmpty(_settings.BaseUrl) && url.StartsWith(_settings.BaseUrl))
            {
                return url.Substring(_settings.BaseUrl.TrimEnd('/').Length + 1);
            }

            // Handle S3 URL
            var s3UrlPrefix = $"https://{_settings.BucketName}.s3.{_settings.Region}.amazonaws.com/";
            if (url.StartsWith(s3UrlPrefix))
            {
                return url.Substring(s3UrlPrefix.Length);
            }

            // Handle virtual-hosted style URL
            var virtualPrefix = $"https://{_settings.BucketName}.s3.amazonaws.com/";
            if (url.StartsWith(virtualPrefix))
            {
                return url.Substring(virtualPrefix.Length);
            }

            // Try to extract from path-style URL
            var uri = new Uri(url);
            var path = uri.AbsolutePath.TrimStart('/');
            if (path.StartsWith(_settings.BucketName + "/"))
            {
                return path.Substring(_settings.BucketName.Length + 1);
            }

            return path;
        }
        catch
        {
            return null;
        }
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
