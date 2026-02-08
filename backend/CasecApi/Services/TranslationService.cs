using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace CasecApi.Services;

public class OpenAITranslationService : Hubs.ITranslationService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpenAITranslationService> _logger;
    private readonly string _apiKey;

    public OpenAITranslationService(IConfiguration config, ILogger<OpenAITranslationService> logger)
    {
        _httpClient = new HttpClient();
        _logger = logger;
        _apiKey = config["OpenAI:ApiKey"] ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? "";
        
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
    }

    public async Task<string> TranslateAsync(string text, string sourceLanguage, string targetLanguage)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;
        if (sourceLanguage == targetLanguage) return text;

        var targetName = GetLanguageName(targetLanguage);
        
        var requestBody = new
        {
            model = "gpt-4o-mini", // Fast and cheap
            messages = new[]
            {
                new { role = "system", content = $"You are a translator. Translate the following text to {targetName}. Respond with ONLY the translation, nothing else. Keep the same tone and style." },
                new { role = "user", content = text }
            },
            max_tokens = 500,
            temperature = 0.3
        };

        try
        {
            var response = await _httpClient.PostAsync(
                "https://api.openai.com/v1/chat/completions",
                new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
            );

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            
            var translated = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? text;

            return translated.Trim();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Translation failed from {Source} to {Target}", sourceLanguage, targetLanguage);
            return $"[{targetLanguage}] {text}"; // Fallback: return original with language tag
        }
    }

    private static string GetLanguageName(string code) => code switch
    {
        "en" => "English",
        "es" => "Spanish",
        "zh" => "Chinese (Simplified)",
        "fr" => "French",
        _ => code
    };
}

// Alternative: Google Cloud Translation (faster, add if needed)
public class GoogleTranslationService : Hubs.ITranslationService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GoogleTranslationService> _logger;
    private readonly string _apiKey;

    public GoogleTranslationService(IConfiguration config, ILogger<GoogleTranslationService> logger)
    {
        _httpClient = new HttpClient();
        _logger = logger;
        _apiKey = config["Google:TranslateApiKey"] ?? Environment.GetEnvironmentVariable("GOOGLE_TRANSLATE_API_KEY") ?? "";
    }

    public async Task<string> TranslateAsync(string text, string sourceLanguage, string targetLanguage)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("Google Translate API key not configured");
            return text;
        }

        // Map language codes
        var targetCode = targetLanguage switch
        {
            "zh" => "zh-CN",
            _ => targetLanguage
        };

        try
        {
            var url = $"https://translation.googleapis.com/language/translate/v2?key={_apiKey}";
            var requestBody = new
            {
                q = text,
                source = sourceLanguage == "zh" ? "zh-CN" : sourceLanguage,
                target = targetCode,
                format = "text"
            };

            var response = await _httpClient.PostAsync(
                url,
                new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
            );

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var translated = doc.RootElement
                .GetProperty("data")
                .GetProperty("translations")[0]
                .GetProperty("translatedText")
                .GetString() ?? text;

            return translated;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google translation failed from {Source} to {Target}", sourceLanguage, targetLanguage);
            return text;
        }
    }
}
