using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace CasecApi.Hubs;

public interface ITranscriptionClient
{
    Task ReceiveTranscription(TranscriptionMessage message);
    Task ReceiveTranslation(TranslationMessage message);
    Task ReceiveStatus(StatusMessage message);
}

public class TranscriptionMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Text { get; set; } = string.Empty;
    public string Language { get; set; } = "en"; // en, es, zh, fr
    public string LanguageName { get; set; } = "English";
    public bool IsFinal { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class TranslationMessage
{
    public string TranscriptionId { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string TargetLanguage { get; set; } = string.Empty;
    public string TargetLanguageName { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class StatusMessage
{
    public string Type { get; set; } = string.Empty; // connected, capturing, stopped, error
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class TranscriptionHub : Hub<ITranscriptionClient>
{
    private static readonly ConcurrentDictionary<string, string> CaptureClients = new();
    private static readonly ConcurrentDictionary<string, string> DisplayClients = new();
    private readonly ILogger<TranscriptionHub> _logger;
    private readonly ITranslationService _translationService;

    public TranscriptionHub(ILogger<TranscriptionHub> logger, ITranslationService translationService)
    {
        _logger = logger;
        _translationService = translationService;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        CaptureClients.TryRemove(Context.ConnectionId, out _);
        DisplayClients.TryRemove(Context.ConnectionId, out _);
        
        // Notify displays if capture client disconnected
        if (CaptureClients.IsEmpty)
        {
            await Clients.Group("display").ReceiveStatus(new StatusMessage
            {
                Type = "stopped",
                Message = "Capture session ended"
            });
        }
        
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    // Called by capture client to register
    public async Task RegisterCapture(string deviceName)
    {
        CaptureClients[Context.ConnectionId] = deviceName;
        await Groups.AddToGroupAsync(Context.ConnectionId, "capture");
        
        _logger.LogInformation("Capture client registered: {DeviceName}", deviceName);
        
        // Notify displays
        await Clients.Group("display").ReceiveStatus(new StatusMessage
        {
            Type = "capturing",
            Message = $"Capturing from: {deviceName}"
        });
    }

    // Called by display client to register
    public async Task RegisterDisplay(string displayName)
    {
        DisplayClients[Context.ConnectionId] = displayName;
        await Groups.AddToGroupAsync(Context.ConnectionId, "display");
        
        _logger.LogInformation("Display client registered: {DisplayName}", displayName);
        
        // Send current status
        var status = CaptureClients.Any()
            ? new StatusMessage { Type = "capturing", Message = $"Capturing active ({CaptureClients.Count} device(s))" }
            : new StatusMessage { Type = "waiting", Message = "Waiting for capture to start..." };
        
        await Clients.Caller.ReceiveStatus(status);
    }

    // Called by capture client when transcription is received from Deepgram
    public async Task SendTranscription(string text, string languageCode, bool isFinal)
    {
        var languageName = GetLanguageName(languageCode);
        
        var message = new TranscriptionMessage
        {
            Text = text,
            Language = languageCode,
            LanguageName = languageName,
            IsFinal = isFinal
        };

        _logger.LogInformation("Transcription received [{Language}]: {Text} (Final: {IsFinal})", 
            languageCode, text.Length > 50 ? text[..50] + "..." : text, isFinal);

        // Broadcast to all display clients immediately
        await Clients.Group("display").ReceiveTranscription(message);

        // Only translate final transcriptions to avoid spamming
        if (isFinal && !string.IsNullOrWhiteSpace(text))
        {
            // Fire translations in parallel (don't await - let them stream in)
            _ = TranslateAndBroadcastAsync(message);
        }
    }

    private async Task TranslateAndBroadcastAsync(TranscriptionMessage source)
    {
        var targetLanguages = new[] { "en", "es", "zh", "fr" }
            .Where(l => l != source.Language)
            .ToList();

        var tasks = targetLanguages.Select(async targetLang =>
        {
            try
            {
                var translated = await _translationService.TranslateAsync(
                    source.Text, 
                    source.Language, 
                    targetLang
                );

                var translationMessage = new TranslationMessage
                {
                    TranscriptionId = source.Id,
                    Text = translated,
                    TargetLanguage = targetLang,
                    TargetLanguageName = GetLanguageName(targetLang)
                };

                await Clients.Group("display").ReceiveTranslation(translationMessage);
                
                _logger.LogInformation("Translation sent [{Target}]: {Text}", 
                    targetLang, translated.Length > 50 ? translated[..50] + "..." : translated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Translation failed for {TargetLang}", targetLang);
            }
        });

        await Task.WhenAll(tasks);
    }

    private static string GetLanguageName(string code) => code switch
    {
        "en" => "English",
        "es" => "Español",
        "zh" => "中文",
        "fr" => "Français",
        _ => code.ToUpper()
    };
}

public interface ITranslationService
{
    Task<string> TranslateAsync(string text, string sourceLanguage, string targetLanguage);
}
