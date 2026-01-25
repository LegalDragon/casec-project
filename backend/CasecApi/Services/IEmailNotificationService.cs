namespace CasecApi.Services;

/// <summary>
/// Service for creating and sending email/SMS notifications via stored procedures
/// </summary>
public interface IEmailNotificationService
{
    /// <summary>
    /// Create an email notification (not immediately sent)
    /// </summary>
    Task<int> CreateAsync(int? userId, string userEmail, string subject, string htmlBody);

    /// <summary>
    /// Create a notification with full control over parameters
    /// </summary>
    /// <param name="userId">Optional user ID</param>
    /// <param name="sendType">"email" or "phone"</param>
    /// <param name="instantSend">If true, notification is released immediately</param>
    /// <param name="userPhone">Phone number (for SMS)</param>
    /// <param name="userEmail">Email address (for email)</param>
    /// <param name="subject">Email subject (ignored for SMS)</param>
    /// <param name="body">HTML body for email, plain text for SMS</param>
    /// <returns>Notification ID (ENID)</returns>
    Task<int> CreateNotificationAsync(int? userId, string sendType, bool instantSend, string? userPhone, string? userEmail, string subject, string body);

    /// <summary>
    /// Send an SMS message immediately
    /// </summary>
    Task<int> SendSmsAsync(int? userId, string userPhone, string message);

    /// <summary>
    /// Attach a document to a notification
    /// </summary>
    Task AttachAsync(int enid, string documentName, string mimeType, string storageUrl);

    /// <summary>
    /// Release a notification for sending
    /// </summary>
    Task ReleaseAsync(int enid);

    /// <summary>
    /// Create and immediately send a simple email (no attachments)
    /// </summary>
    Task SendSimpleAsync(int? userId, string userEmail, string subject, string htmlBody);

    /// <summary>
    /// Create an email builder for fluent email construction with attachments
    /// </summary>
    IEmailBuilder CreateEmail(int? userId, string userEmail, string subject, string htmlBody);
}

/// <summary>
/// Fluent interface for building emails with attachments
/// </summary>
public interface IEmailBuilder
{
    /// <summary>
    /// Attach a PDF document
    /// </summary>
    IEmailBuilder AttachPdf(string documentName, string storageUrl);

    /// <summary>
    /// Attach an image
    /// </summary>
    IEmailBuilder AttachImage(string documentName, string storageUrl, string mimeType = "image/png");

    /// <summary>
    /// Attach any document with specified MIME type
    /// </summary>
    IEmailBuilder Attach(string documentName, string mimeType, string storageUrl);

    /// <summary>
    /// Conditionally attach a document if the URL is present
    /// </summary>
    IEmailBuilder AttachIfPresent(string documentName, string mimeType, string? storageUrl);

    /// <summary>
    /// Send the email (creates, attaches all documents, and releases)
    /// </summary>
    Task SendAsync();

    /// <summary>
    /// Get the notification ID after sending
    /// </summary>
    int GetEnid();
}
