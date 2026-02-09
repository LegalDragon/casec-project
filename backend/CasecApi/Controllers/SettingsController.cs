using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace CasecApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SettingsController> _logger;
    private static readonly string SettingsFilePath = Path.Combine(
        AppContext.BaseDirectory, "settings.json");

    public SettingsController(IConfiguration configuration, ILogger<SettingsController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    // In-memory settings storage (for simplicity - could use database)
    private static Dictionary<string, object> _settings = new();
    private static readonly object _lock = new();

    [HttpGet("{key}")]
    [AllowAnonymous]
    public IActionResult GetSetting(string key)
    {
        try
        {
            // Load from file if exists
            LoadSettingsFromFile();
            
            lock (_lock)
            {
                if (_settings.TryGetValue(key, out var value))
                {
                    return Ok(value);
                }
            }
            return NotFound(new { error = $"Setting '{key}' not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting setting {Key}", key);
            return StatusCode(500, new { error = "Failed to get setting" });
        }
    }

    [HttpPost("{key}")]
    [Authorize]
    public IActionResult SaveSetting(string key, [FromBody] JsonElement value)
    {
        try
        {
            lock (_lock)
            {
                _settings[key] = value;
                SaveSettingsToFile();
            }
            
            _logger.LogInformation("Setting '{Key}' saved", key);
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving setting {Key}", key);
            return StatusCode(500, new { error = "Failed to save setting" });
        }
    }

    private void LoadSettingsFromFile()
    {
        try
        {
            if (System.IO.File.Exists(SettingsFilePath))
            {
                var json = System.IO.File.ReadAllText(SettingsFilePath);
                var loaded = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
                if (loaded != null)
                {
                    lock (_lock)
                    {
                        foreach (var kvp in loaded)
                        {
                            _settings[kvp.Key] = kvp.Value;
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not load settings from file");
        }
    }

    private void SaveSettingsToFile()
    {
        try
        {
            var json = JsonSerializer.Serialize(_settings, new JsonSerializerOptions { WriteIndented = true });
            System.IO.File.WriteAllText(SettingsFilePath, json);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not save settings to file");
        }
    }
}
