using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;
using CasecApi.Models.DTOs;

namespace CasecApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UtilityController : ControllerBase
{
    private readonly ILogger<UtilityController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public UtilityController(ILogger<UtilityController> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Fetches metadata from a URL including multiple images, title, and description
    /// </summary>
    [HttpPost("fetch-url-metadata")]
    public async Task<ActionResult<ApiResponse<UrlMetadataDto>>> FetchUrlMetadata([FromBody] FetchUrlMetadataRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Url))
            {
                return BadRequest(new ApiResponse<UrlMetadataDto>
                {
                    Success = false,
                    Message = "URL is required"
                });
            }

            // Validate URL format
            if (!Uri.TryCreate(request.Url, UriKind.Absolute, out var uri) ||
                (uri.Scheme != "http" && uri.Scheme != "https"))
            {
                return BadRequest(new ApiResponse<UrlMetadataDto>
                {
                    Success = false,
                    Message = "Invalid URL format. Must be a valid HTTP or HTTPS URL."
                });
            }

            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(15);
            client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

            var response = await client.GetAsync(uri);

            if (!response.IsSuccessStatusCode)
            {
                return BadRequest(new ApiResponse<UrlMetadataDto>
                {
                    Success = false,
                    Message = $"Failed to fetch URL: {response.StatusCode}"
                });
            }

            var html = await response.Content.ReadAsStringAsync();
            var metadata = ParseHtmlMetadata(html, uri);

            return Ok(new ApiResponse<UrlMetadataDto>
            {
                Success = true,
                Data = metadata
            });
        }
        catch (TaskCanceledException)
        {
            return BadRequest(new ApiResponse<UrlMetadataDto>
            {
                Success = false,
                Message = "Request timed out. The URL may be slow or unreachable."
            });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Failed to fetch URL metadata for {Url}", request.Url);
            return BadRequest(new ApiResponse<UrlMetadataDto>
            {
                Success = false,
                Message = "Failed to fetch URL. The URL may be unreachable or blocked."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching URL metadata for {Url}", request.Url);
            return StatusCode(500, new ApiResponse<UrlMetadataDto>
            {
                Success = false,
                Message = "An error occurred while fetching URL metadata"
            });
        }
    }

    private UrlMetadataDto ParseHtmlMetadata(string html, Uri baseUri)
    {
        var metadata = new UrlMetadataDto
        {
            Url = baseUri.ToString()
        };

        // Extract title
        metadata.Title = ExtractMetaContent(html, "og:title") ??
                        ExtractMetaContent(html, "twitter:title") ??
                        ExtractHtmlTitle(html);

        // Extract description
        metadata.Description = ExtractMetaContent(html, "og:description") ??
                              ExtractMetaContent(html, "twitter:description") ??
                              ExtractMetaContent(html, "description");

        // Extract site name
        metadata.SiteName = ExtractMetaContent(html, "og:site_name") ??
                           ExtractMetaContent(html, "application-name");

        // Extract all available images
        metadata.Images = ExtractAllImages(html, baseUri);

        // Set primary image (OG image takes precedence)
        var ogImage = ExtractMetaContent(html, "og:image");
        var twitterImage = ExtractMetaContent(html, "twitter:image") ?? ExtractMetaContent(html, "twitter:image:src");

        if (!string.IsNullOrEmpty(ogImage))
        {
            metadata.ImageUrl = MakeAbsoluteUrl(ogImage, baseUri);
        }
        else if (!string.IsNullOrEmpty(twitterImage))
        {
            metadata.ImageUrl = MakeAbsoluteUrl(twitterImage, baseUri);
        }
        else if (metadata.Images.Count > 0)
        {
            metadata.ImageUrl = metadata.Images[0];
        }

        return metadata;
    }

    private List<string> ExtractAllImages(string html, Uri baseUri)
    {
        var images = new List<string>();
        var seenUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // Extract <img> tags first - these usually have the best content images
        var imgPattern = @"<img[^>]*src=[""']([^""']+)[""'][^>]*>";
        var matches = Regex.Matches(html, imgPattern, RegexOptions.IgnoreCase);

        foreach (Match match in matches)
        {
            var src = match.Groups[1].Value;

            // Skip common icon/tracking/placeholder patterns
            if (ShouldSkipImage(src))
            {
                continue;
            }

            var absoluteUrl = MakeAbsoluteUrl(src, baseUri);
            if (seenUrls.Add(absoluteUrl))
            {
                images.Add(absoluteUrl);
            }

            // Limit to 12 images max
            if (images.Count >= 12)
            {
                break;
            }
        }

        // Then add OG and Twitter images (may be duplicates of img tags, will be filtered)
        if (images.Count < 12)
        {
            var ogImage = ExtractMetaContent(html, "og:image");
            if (!string.IsNullOrEmpty(ogImage))
            {
                var absoluteUrl = MakeAbsoluteUrl(ogImage, baseUri);
                if (seenUrls.Add(absoluteUrl))
                {
                    images.Add(absoluteUrl);
                }
            }
        }

        if (images.Count < 12)
        {
            var twitterImage = ExtractMetaContent(html, "twitter:image") ?? ExtractMetaContent(html, "twitter:image:src");
            if (!string.IsNullOrEmpty(twitterImage))
            {
                var absoluteUrl = MakeAbsoluteUrl(twitterImage, baseUri);
                if (seenUrls.Add(absoluteUrl))
                {
                    images.Add(absoluteUrl);
                }
            }
        }

        // Check for srcset images (higher resolution alternatives)
        if (images.Count < 12)
        {
            var srcsetPattern = @"<img[^>]*srcset=[""']([^""']+)[""'][^>]*>";
            var srcsetMatches = Regex.Matches(html, srcsetPattern, RegexOptions.IgnoreCase);

            foreach (Match match in srcsetMatches)
            {
                var srcset = match.Groups[1].Value;
                // Parse srcset (format: "url 1x, url 2x" or "url 300w, url 600w")
                var srcsetParts = srcset.Split(',');
                foreach (var part in srcsetParts)
                {
                    var urlPart = part.Trim().Split(' ')[0];
                    if (!string.IsNullOrEmpty(urlPart) && !ShouldSkipImage(urlPart))
                    {
                        var absoluteUrl = MakeAbsoluteUrl(urlPart, baseUri);
                        if (seenUrls.Add(absoluteUrl))
                        {
                            images.Add(absoluteUrl);
                        }
                    }

                    if (images.Count >= 12)
                    {
                        break;
                    }
                }

                if (images.Count >= 12)
                {
                    break;
                }
            }
        }

        // Check for background images in style attributes
        if (images.Count < 12)
        {
            var bgPattern = @"background(?:-image)?:\s*url\([""']?([^""')]+)[""']?\)";
            var bgMatches = Regex.Matches(html, bgPattern, RegexOptions.IgnoreCase);

            foreach (Match match in bgMatches)
            {
                var src = match.Groups[1].Value;
                if (!ShouldSkipImage(src))
                {
                    var absoluteUrl = MakeAbsoluteUrl(src, baseUri);
                    if (seenUrls.Add(absoluteUrl))
                    {
                        images.Add(absoluteUrl);
                    }
                }

                if (images.Count >= 12)
                {
                    break;
                }
            }
        }

        return images;
    }

    private bool ShouldSkipImage(string src)
    {
        if (string.IsNullOrEmpty(src))
            return true;

        var lowerSrc = src.ToLowerInvariant();

        return lowerSrc.Contains("favicon") ||
               lowerSrc.Contains("icon") ||
               lowerSrc.Contains("logo") ||
               lowerSrc.Contains("tracking") ||
               lowerSrc.Contains("pixel") ||
               lowerSrc.Contains("1x1") ||
               lowerSrc.Contains("spacer") ||
               lowerSrc.Contains("blank") ||
               lowerSrc.Contains("spinner") ||
               lowerSrc.Contains("loading") ||
               lowerSrc.Contains("placeholder") ||
               lowerSrc.Contains("avatar") ||
               lowerSrc.Contains("profile") ||
               lowerSrc.EndsWith(".svg") ||
               lowerSrc.EndsWith(".gif") ||
               lowerSrc.StartsWith("data:image") ||
               lowerSrc.Contains("ad-") ||
               lowerSrc.Contains("ads/") ||
               lowerSrc.Contains("banner") ||
               lowerSrc.Contains("button");
    }

    private string MakeAbsoluteUrl(string url, Uri baseUri)
    {
        if (string.IsNullOrEmpty(url))
            return url;

        if (url.StartsWith("//"))
        {
            return baseUri.Scheme + ":" + url;
        }

        if (!url.StartsWith("http"))
        {
            try
            {
                return new Uri(baseUri, url).ToString();
            }
            catch
            {
                return url;
            }
        }

        return url;
    }

    private string? ExtractMetaContent(string html, string property)
    {
        // Try property attribute (Open Graph style)
        var propertyPattern = $@"<meta[^>]*property=[""']{Regex.Escape(property)}[""'][^>]*content=[""']([^""']+)[""'][^>]*/?>|<meta[^>]*content=[""']([^""']+)[""'][^>]*property=[""']{Regex.Escape(property)}[""'][^>]*/?>";
        var match = Regex.Match(html, propertyPattern, RegexOptions.IgnoreCase);
        if (match.Success)
        {
            return match.Groups[1].Success && !string.IsNullOrEmpty(match.Groups[1].Value)
                ? match.Groups[1].Value
                : match.Groups[2].Value;
        }

        // Try name attribute (standard meta style)
        var namePattern = $@"<meta[^>]*name=[""']{Regex.Escape(property)}[""'][^>]*content=[""']([^""']+)[""'][^>]*/?>|<meta[^>]*content=[""']([^""']+)[""'][^>]*name=[""']{Regex.Escape(property)}[""'][^>]*/?>";
        match = Regex.Match(html, namePattern, RegexOptions.IgnoreCase);
        if (match.Success)
        {
            return match.Groups[1].Success && !string.IsNullOrEmpty(match.Groups[1].Value)
                ? match.Groups[1].Value
                : match.Groups[2].Value;
        }

        return null;
    }

    private string? ExtractHtmlTitle(string html)
    {
        var match = Regex.Match(html, @"<title[^>]*>([^<]+)</title>", RegexOptions.IgnoreCase);
        return match.Success ? System.Net.WebUtility.HtmlDecode(match.Groups[1].Value.Trim()) : null;
    }
}

public class FetchUrlMetadataRequest
{
    public string Url { get; set; } = string.Empty;
}
