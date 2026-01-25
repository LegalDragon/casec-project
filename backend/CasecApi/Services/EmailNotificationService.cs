using System.Data;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using CasecApi.Data;

namespace CasecApi.Services;

/// <summary>
/// Implementation of email/SMS notification service using stored procedures
/// sp_EN_Create, sp_EN_Attach, sp_EN_Release
/// </summary>
public class EmailNotificationService : IEmailNotificationService
{
    private readonly CasecDbContext _context;
    private readonly ILogger<EmailNotificationService> _logger;

    public EmailNotificationService(CasecDbContext context, ILogger<EmailNotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<int> CreateAsync(int? userId, string userEmail, string subject, string htmlBody)
    {
        return await CreateNotificationAsync(userId, "email", false, null, userEmail, subject, htmlBody);
    }

    /// <inheritdoc/>
    public async Task<int> CreateNotificationAsync(int? userId, string sendType, bool instantSend, string? userPhone, string? userEmail, string subject, string body)
    {
        // Build the JSON body
        var bodyJson = JsonSerializer.Serialize(new
        {
            SUBJECT = subject,
            BODY = body
        });

        var userIdParam = new SqlParameter("@UserId", SqlDbType.Int) { Value = userId.HasValue ? userId.Value : DBNull.Value };
        var sendTypeParam = new SqlParameter("@SendType", SqlDbType.VarChar, 50) { Value = sendType };
        var instantSendParam = new SqlParameter("@InstantSend", SqlDbType.Bit) { Value = instantSend };
        var userPhoneParam = new SqlParameter("@UserPhone", SqlDbType.VarChar, 25) { Value = (object?)userPhone ?? DBNull.Value };
        var userEmailParam = new SqlParameter("@UserEmail", SqlDbType.VarChar, 100) { Value = (object?)userEmail ?? DBNull.Value };
        var bodyJsonParam = new SqlParameter("@BodyJSON", SqlDbType.NVarChar, -1) { Value = bodyJson };
        var enidParam = new SqlParameter("@ENID", SqlDbType.Int) { Direction = ParameterDirection.Output };

        await _context.Database.ExecuteSqlRawAsync(
            "EXEC sp_EN_Create @UserId, @SendType, @InstantSend, @UserPhone, @UserEmail, @BodyJSON, @ENID OUTPUT",
            userIdParam, sendTypeParam, instantSendParam, userPhoneParam, userEmailParam, bodyJsonParam, enidParam
        );

        var enid = (int)enidParam.Value;

        if (sendType == "phone")
        {
            _logger.LogInformation("Created SMS notification {ENID} for user {UserId} ({Phone}), instant: {Instant}",
                enid, userId, userPhone, instantSend);
        }
        else
        {
            _logger.LogInformation("Created email notification {ENID} for user {UserId} ({Email}), subject: {Subject}, instant: {Instant}",
                enid, userId, userEmail, subject, instantSend);
        }

        return enid;
    }

    /// <inheritdoc/>
    public async Task<int> SendSmsAsync(int? userId, string userPhone, string message)
    {
        // SMS is sent immediately with InstantSend=true
        return await CreateNotificationAsync(userId, "phone", true, userPhone, null, "", message);
    }

    /// <inheritdoc/>
    public async Task AttachAsync(int enid, string documentName, string mimeType, string storageUrl)
    {
        if (string.IsNullOrEmpty(storageUrl))
        {
            _logger.LogWarning("Attempted to attach empty URL to notification {ENID}, skipping", enid);
            return;
        }

        var enidParam = new SqlParameter("@ENID", SqlDbType.Int) { Value = enid };
        var docNameParam = new SqlParameter("@DocName", SqlDbType.NVarChar, 200) { Value = documentName };
        var mimeTypeParam = new SqlParameter("@MimeType", SqlDbType.VarChar, 100) { Value = mimeType };
        var storageUrlParam = new SqlParameter("@StorageUrl", SqlDbType.VarChar, 500) { Value = storageUrl };

        await _context.Database.ExecuteSqlRawAsync(
            "EXEC sp_EN_Attach @ENID, @DocName, @MimeType, @StorageUrl",
            enidParam, docNameParam, mimeTypeParam, storageUrlParam
        );

        _logger.LogInformation("Attached document '{DocName}' ({MimeType}) to notification {ENID}", documentName, mimeType, enid);
    }

    /// <inheritdoc/>
    public async Task ReleaseAsync(int enid)
    {
        var enidParam = new SqlParameter("@ENID", SqlDbType.Int) { Value = enid };

        await _context.Database.ExecuteSqlRawAsync(
            "EXEC sp_EN_Release @ENID",
            enidParam
        );

        _logger.LogInformation("Released notification {ENID} for sending", enid);
    }

    /// <inheritdoc/>
    public async Task SendSimpleAsync(int? userId, string userEmail, string subject, string htmlBody)
    {
        // Use InstantSend=true to avoid separate Release call
        await CreateNotificationAsync(userId, "email", true, null, userEmail, subject, htmlBody);
    }

    /// <inheritdoc/>
    public IEmailBuilder CreateEmail(int? userId, string userEmail, string subject, string htmlBody)
    {
        return new EmailBuilder(this, userId, userEmail, subject, htmlBody);
    }

    /// <summary>
    /// Fluent email builder implementation
    /// </summary>
    private class EmailBuilder : IEmailBuilder
    {
        private readonly EmailNotificationService _service;
        private readonly int? _userId;
        private readonly string _userEmail;
        private readonly string _subject;
        private readonly string _htmlBody;
        private readonly List<(string Name, string MimeType, string Url)> _attachments = new();
        private int _enid = 0;

        public EmailBuilder(EmailNotificationService service, int? userId, string userEmail, string subject, string htmlBody)
        {
            _service = service;
            _userId = userId;
            _userEmail = userEmail;
            _subject = subject;
            _htmlBody = htmlBody;
        }

        public IEmailBuilder AttachPdf(string documentName, string storageUrl)
        {
            return Attach(documentName, "application/pdf", storageUrl);
        }

        public IEmailBuilder AttachImage(string documentName, string storageUrl, string mimeType = "image/png")
        {
            return Attach(documentName, mimeType, storageUrl);
        }

        public IEmailBuilder Attach(string documentName, string mimeType, string storageUrl)
        {
            if (!string.IsNullOrEmpty(storageUrl))
            {
                _attachments.Add((documentName, mimeType, storageUrl));
            }
            return this;
        }

        public IEmailBuilder AttachIfPresent(string documentName, string mimeType, string? storageUrl)
        {
            if (!string.IsNullOrEmpty(storageUrl))
            {
                _attachments.Add((documentName, mimeType, storageUrl));
            }
            return this;
        }

        public async Task SendAsync()
        {
            // Create the email
            _enid = await _service.CreateAsync(_userId, _userEmail, _subject, _htmlBody);

            // Attach all documents
            foreach (var (name, mimeType, url) in _attachments)
            {
                await _service.AttachAsync(_enid, name, mimeType, url);
            }

            // Release for sending
            await _service.ReleaseAsync(_enid);
        }

        public int GetEnid() => _enid;
    }
}

/// <summary>
/// Email template helpers for common CASEC notification scenarios
/// </summary>
public static class CasecEmailTemplates
{
    /// <summary>
    /// Generate OTP verification email/SMS
    /// </summary>
    public static string OtpVerification(string recipientName, string otpCode, int expiryMinutes = 10)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, ""Helvetica Neue"", Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
    <div style='background: linear-gradient(135deg, #047857 0%, #065f46 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;'>
        <h1 style='color: white; margin: 0; font-size: 24px;'>Verification Code</h1>
    </div>

    <div style='background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;'>
        <p style='font-size: 16px;'>Hi {recipientName},</p>

        <p>Your verification code is:</p>

        <div style='background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;'>
            <h2 style='margin: 0; font-size: 36px; letter-spacing: 8px; color: #047857; font-family: monospace;'>{otpCode}</h2>
        </div>

        <p style='font-size: 14px; color: #6b7280;'>
            This code will expire in {expiryMinutes} minutes. If you didn't request this code, please ignore this message.
        </p>

        <p style='margin-top: 30px; font-size: 14px; color: #6b7280;'>
            <strong>CASEC</strong>
        </p>
    </div>
</body>
</html>";
    }

    /// <summary>
    /// Generate OTP SMS message
    /// </summary>
    public static string OtpSms(string otpCode, int expiryMinutes = 10)
    {
        return $"Your CASEC verification code is: {otpCode}. Valid for {expiryMinutes} minutes.";
    }

    /// <summary>
    /// Generate raffle ticket confirmation email
    /// </summary>
    public static string RaffleTicketConfirmation(
        string participantName,
        string raffleName,
        int ticketStart,
        int ticketEnd,
        int totalTickets,
        decimal amountPaid,
        int ticketDigits = 6)
    {
        var startStr = ticketStart.ToString().PadLeft(ticketDigits, '0');
        var endStr = ticketEnd.ToString().PadLeft(ticketDigits, '0');

        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, ""Helvetica Neue"", Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
    <div style='background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;'>
        <h1 style='color: white; margin: 0; font-size: 24px;'>🎟️ Raffle Tickets Confirmed!</h1>
    </div>

    <div style='background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;'>
        <p style='font-size: 16px;'>Hi {participantName},</p>

        <p>Great news! Your raffle tickets have been confirmed.</p>

        <div style='background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #a855f7;'>
            <h2 style='margin: 0 0 15px 0; color: #7c3aed;'>{raffleName}</h2>
            <p style='margin: 5px 0; font-size: 14px;'><strong>Your Ticket Numbers:</strong></p>
            <h3 style='margin: 10px 0; font-size: 28px; font-family: monospace; color: #7c3aed;'>{startStr} - {endStr}</h3>
            <p style='margin: 5px 0;'><strong>Total Tickets:</strong> {totalTickets}</p>
            <p style='margin: 5px 0;'><strong>Amount Paid:</strong> <span style='color: #16a34a;'>${amountPaid:F2}</span></p>
        </div>

        <div style='background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;'>
            <p style='margin: 0; font-size: 14px;'>
                <strong>📌 Save Your Ticket Numbers!</strong><br>
                Keep this email for your records. You'll need your ticket numbers for the drawing.
            </p>
        </div>

        <p style='font-size: 14px; color: #6b7280;'>
            Good luck! We'll notify you when the drawing takes place.
        </p>

        <p style='margin-top: 30px; font-size: 14px; color: #6b7280;'>
            <strong>CASEC</strong>
        </p>
    </div>
</body>
</html>";
    }

    /// <summary>
    /// Generate raffle ticket confirmation SMS
    /// </summary>
    public static string RaffleTicketSms(string raffleName, int ticketStart, int ticketEnd, int totalTickets, int ticketDigits = 6)
    {
        var startStr = ticketStart.ToString().PadLeft(ticketDigits, '0');
        var endStr = ticketEnd.ToString().PadLeft(ticketDigits, '0');
        return $"CASEC Raffle: Your tickets for {raffleName} are confirmed! Numbers: {startStr}-{endStr} ({totalTickets} tickets). Good luck!";
    }

    /// <summary>
    /// Generate raffle winner notification email
    /// </summary>
    public static string RaffleWinnerNotification(
        string winnerName,
        string raffleName,
        int winningNumber,
        string prizeName,
        int ticketDigits = 6)
    {
        var winningStr = winningNumber.ToString().PadLeft(ticketDigits, '0');

        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, ""Helvetica Neue"", Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
    <div style='background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;'>
        <h1 style='color: #7c2d12; margin: 0; font-size: 28px;'>🎉 CONGRATULATIONS! 🎉</h1>
        <p style='color: #7c2d12; margin: 10px 0 0 0; font-size: 18px;'>You're a Winner!</p>
    </div>

    <div style='background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;'>
        <p style='font-size: 18px;'>Dear {winnerName},</p>

        <p style='font-size: 16px;'>We are thrilled to inform you that you have won the <strong>{raffleName}</strong>!</p>

        <div style='background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 3px solid #f59e0b; text-align: center;'>
            <p style='margin: 0 0 10px 0; font-size: 14px; color: #92400e;'>WINNING NUMBER</p>
            <h2 style='margin: 0; font-size: 42px; font-family: monospace; color: #b45309;'>{winningStr}</h2>
            <p style='margin: 15px 0 0 0; font-size: 18px; color: #92400e;'><strong>Prize: {prizeName}</strong></p>
        </div>

        <p>Please contact us to claim your prize. We will need to verify your identity before releasing the prize.</p>

        <p style='margin-top: 30px; font-size: 14px; color: #6b7280;'>
            Congratulations again!<br>
            <strong>CASEC Team</strong>
        </p>
    </div>
</body>
</html>";
    }

    /// <summary>
    /// Generate raffle winner SMS
    /// </summary>
    public static string RaffleWinnerSms(string raffleName, string prizeName)
    {
        return $"🎉 CONGRATULATIONS! You've won the {raffleName}! Prize: {prizeName}. Please contact us to claim your prize. - CASEC";
    }
}
