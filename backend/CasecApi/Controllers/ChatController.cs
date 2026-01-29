using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using CasecApi.Data;
using CasecApi.Models;
using CasecApi.Models.DTOs;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
public class ChatController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ChatController> _logger;

    public ChatController(
        CasecDbContext context,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<ChatController> logger)
    {
        _context = context;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    private async Task<bool> IsCurrentUserAdmin()
    {
        if (User.IsInRole("Admin")) return true;
        var userId = GetCurrentUserId();
        if (userId == 0) return false;
        var user = await _context.Users.FindAsync(userId);
        return user?.IsAdmin == true;
    }

    // GET: /chat/availability
    // Check if chatbot is available for the current user
    [AllowAnonymous]
    [HttpGet("availability")]
    public async Task<ActionResult<ApiResponse<ChatAvailabilityDto>>> GetChatAvailability()
    {
        try
        {
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            var visibility = theme?.ChatbotVisibility ?? "off";

            // Check if gateway is configured
            var gatewayUrl = _configuration["Chatbot:GatewayUrl"];
            var gatewayToken = _configuration["Chatbot:GatewayToken"];
            var isConfigured = !string.IsNullOrEmpty(gatewayUrl) && !string.IsNullOrEmpty(gatewayToken);

            if (!isConfigured || visibility == "off")
            {
                return Ok(new ApiResponse<ChatAvailabilityDto>
                {
                    Success = true,
                    Data = new ChatAvailabilityDto { Available = false }
                });
            }

            if (visibility == "everyone")
            {
                return Ok(new ApiResponse<ChatAvailabilityDto>
                {
                    Success = true,
                    Data = new ChatAvailabilityDto { Available = true }
                });
            }

            // "admins-only" — check if user is admin
            if (visibility == "admins-only")
            {
                var isAdmin = await IsCurrentUserAdmin();
                return Ok(new ApiResponse<ChatAvailabilityDto>
                {
                    Success = true,
                    Data = new ChatAvailabilityDto { Available = isAdmin }
                });
            }

            return Ok(new ApiResponse<ChatAvailabilityDto>
            {
                Success = true,
                Data = new ChatAvailabilityDto { Available = false }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking chat availability");
            return StatusCode(500, new ApiResponse<ChatAvailabilityDto>
            {
                Success = false,
                Message = "An error occurred while checking chat availability"
            });
        }
    }

    // POST: /chat/completions
    // Proxy chat completions to Clawdbot gateway, streaming the response back
    [AllowAnonymous]
    [HttpPost("completions")]
    public async Task StreamChatCompletions()
    {
        try
        {
            // Verify chatbot is available
            var theme = await _context.ThemeSettings
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.ThemeId)
                .FirstOrDefaultAsync();

            var visibility = theme?.ChatbotVisibility ?? "off";

            if (visibility == "off")
            {
                Response.StatusCode = 403;
                await Response.WriteAsync("{\"error\":\"Chatbot is disabled\"}");
                return;
            }

            if (visibility == "admins-only")
            {
                var isAdmin = await IsCurrentUserAdmin();
                if (!isAdmin)
                {
                    Response.StatusCode = 403;
                    await Response.WriteAsync("{\"error\":\"Chatbot is only available to administrators\"}");
                    return;
                }
            }

            var gatewayUrl = _configuration["Chatbot:GatewayUrl"];
            var gatewayToken = _configuration["Chatbot:GatewayToken"];
            var model = _configuration["Chatbot:Model"] ?? "anthropic/claude-sonnet-4-20250514";

            if (string.IsNullOrEmpty(gatewayUrl) || string.IsNullOrEmpty(gatewayToken))
            {
                Response.StatusCode = 503;
                await Response.WriteAsync("{\"error\":\"Chatbot is not configured\"}");
                return;
            }

            // Read the request body
            using var reader = new StreamReader(Request.Body);
            var requestBody = await reader.ReadToEndAsync();

            // Parse and augment the request
            var requestJson = JsonSerializer.Deserialize<JsonElement>(requestBody);
            var messages = requestJson.GetProperty("messages");

            // Build the proxied request with streaming enabled
            var proxyRequest = new
            {
                model = model,
                messages = messages,
                stream = true
            };

            var proxyRequestJson = JsonSerializer.Serialize(proxyRequest);

            // Create HTTP client and forward to gateway
            var client = _httpClientFactory.CreateClient();
            var requestMessage = new HttpRequestMessage(HttpMethod.Post, $"{gatewayUrl.TrimEnd('/')}/v1/chat/completions");
            requestMessage.Content = new StringContent(proxyRequestJson, Encoding.UTF8, "application/json");
            requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", gatewayToken);

            var response = await client.SendAsync(requestMessage, HttpCompletionOption.ResponseHeadersRead);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Gateway error: {StatusCode} - {Content}", response.StatusCode, errorContent);
                Response.StatusCode = (int)response.StatusCode;
                await Response.WriteAsync(errorContent);
                return;
            }

            // Stream the response back to the client
            Response.StatusCode = 200;
            Response.ContentType = "text/event-stream";
            Response.Headers["Cache-Control"] = "no-cache";
            Response.Headers["Connection"] = "keep-alive";

            using var responseStream = await response.Content.ReadAsStreamAsync();
            using var streamReader = new StreamReader(responseStream);

            while (!streamReader.EndOfStream)
            {
                var line = await streamReader.ReadLineAsync();
                if (line != null)
                {
                    await Response.WriteAsync(line + "\n");
                    await Response.Body.FlushAsync();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in chat completions proxy");
            if (!Response.HasStarted)
            {
                Response.StatusCode = 500;
                await Response.WriteAsync("{\"error\":\"An error occurred while processing chat request\"}");
            }
        }
    }
}
