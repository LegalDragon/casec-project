using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CasecApi.Data;
using CasecApi.Models;
using CasecApi.Models.DTOs;
using CasecApi.Services;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
public class RaffleParticipantsController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<RaffleParticipantsController> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly IEmailNotificationService _notificationService;

    public RaffleParticipantsController(
        CasecDbContext context,
        ILogger<RaffleParticipantsController> logger,
        IWebHostEnvironment environment,
        IEmailNotificationService notificationService)
    {
        _context = context;
        _logger = logger;
        _environment = environment;
        _notificationService = notificationService;
    }

    // POST: /RaffleParticipants/{raffleId}/register - Register for a raffle
    [AllowAnonymous]
    [HttpPost("{raffleId}/register")]
    public async Task<ActionResult<ApiResponse<RaffleRegistrationResponse>>> Register(int raffleId, [FromBody] RaffleRegistrationRequest request)
    {
        try
        {
            var raffle = await _context.Raffles.FindAsync(raffleId);
            if (raffle == null)
            {
                return NotFound(new ApiResponse<RaffleRegistrationResponse>
                {
                    Success = false,
                    Message = "Raffle not found"
                });
            }

            if (raffle.Status != "Active")
            {
                return BadRequest(new ApiResponse<RaffleRegistrationResponse>
                {
                    Success = false,
                    Message = "This raffle is not currently accepting registrations"
                });
            }

            // Normalize phone number (remove non-digits)
            var phone = new string(request.PhoneNumber.Where(char.IsDigit).ToArray());
            if (phone.Length < 10)
            {
                return BadRequest(new ApiResponse<RaffleRegistrationResponse>
                {
                    Success = false,
                    Message = "Please enter a valid phone number"
                });
            }

            // Check if already registered
            var existingParticipant = await _context.RaffleParticipants
                .FirstOrDefaultAsync(p => p.RaffleId == raffleId && p.PhoneNumber == phone);

            if (existingParticipant != null)
            {
                // If already verified, return their session token
                if (existingParticipant.IsVerified)
                {
                    return Ok(new ApiResponse<RaffleRegistrationResponse>
                    {
                        Success = true,
                        Message = "You are already registered",
                        Data = new RaffleRegistrationResponse
                        {
                            ParticipantId = existingParticipant.ParticipantId,
                            Name = existingParticipant.Name,
                            PhoneNumber = existingParticipant.PhoneNumber,
                            IsVerified = true,
                            SessionToken = existingParticipant.SessionToken
                        }
                    });
                }

                // Resend OTP
                return await SendOtp(existingParticipant);
            }

            // Create new participant
            var participant = new RaffleParticipant
            {
                RaffleId = raffleId,
                Name = request.Name.Trim(),
                PhoneNumber = phone,
                SessionToken = Guid.NewGuid().ToString("N"),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.RaffleParticipants.Add(participant);
            await _context.SaveChangesAsync();

            // Send OTP
            return await SendOtp(participant);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering for raffle {RaffleId}", raffleId);
            return StatusCode(500, new ApiResponse<RaffleRegistrationResponse>
            {
                Success = false,
                Message = "An error occurred during registration"
            });
        }
    }

    // POST: /RaffleParticipants/{raffleId}/verify-otp - Verify OTP
    [AllowAnonymous]
    [HttpPost("{raffleId}/verify-otp")]
    public async Task<ActionResult<ApiResponse<RaffleRegistrationResponse>>> VerifyOtp(int raffleId, [FromBody] RaffleOtpVerifyRequest request)
    {
        try
        {
            var phone = new string(request.PhoneNumber.Where(char.IsDigit).ToArray());

            var participant = await _context.RaffleParticipants
                .FirstOrDefaultAsync(p => p.RaffleId == raffleId && p.PhoneNumber == phone);

            if (participant == null)
            {
                return NotFound(new ApiResponse<RaffleRegistrationResponse>
                {
                    Success = false,
                    Message = "Registration not found. Please register first."
                });
            }

            if (participant.IsVerified)
            {
                return Ok(new ApiResponse<RaffleRegistrationResponse>
                {
                    Success = true,
                    Message = "Already verified",
                    Data = new RaffleRegistrationResponse
                    {
                        ParticipantId = participant.ParticipantId,
                        Name = participant.Name,
                        PhoneNumber = participant.PhoneNumber,
                        IsVerified = true,
                        SessionToken = participant.SessionToken
                    }
                });
            }

            // Check OTP
            if (participant.OtpCode != request.OtpCode)
            {
                return BadRequest(new ApiResponse<RaffleRegistrationResponse>
                {
                    Success = false,
                    Message = "Invalid verification code"
                });
            }

            if (participant.OtpExpiresAt.HasValue && participant.OtpExpiresAt < DateTime.UtcNow)
            {
                return BadRequest(new ApiResponse<RaffleRegistrationResponse>
                {
                    Success = false,
                    Message = "Verification code has expired. Please request a new one."
                });
            }

            // Mark as verified
            participant.IsVerified = true;
            participant.VerifiedAt = DateTime.UtcNow;
            participant.OtpCode = null;
            participant.OtpExpiresAt = null;
            participant.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<RaffleRegistrationResponse>
            {
                Success = true,
                Message = "Phone number verified successfully",
                Data = new RaffleRegistrationResponse
                {
                    ParticipantId = participant.ParticipantId,
                    Name = participant.Name,
                    PhoneNumber = participant.PhoneNumber,
                    IsVerified = true,
                    SessionToken = participant.SessionToken
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying OTP for raffle {RaffleId}", raffleId);
            return StatusCode(500, new ApiResponse<RaffleRegistrationResponse>
            {
                Success = false,
                Message = "An error occurred during verification"
            });
        }
    }

    // POST: /RaffleParticipants/{raffleId}/resend-otp - Resend OTP
    [AllowAnonymous]
    [HttpPost("{raffleId}/resend-otp")]
    public async Task<ActionResult<ApiResponse<RaffleRegistrationResponse>>> ResendOtp(int raffleId, [FromBody] RaffleResendOtpRequest request)
    {
        try
        {
            var phone = new string(request.PhoneNumber.Where(char.IsDigit).ToArray());

            var participant = await _context.RaffleParticipants
                .FirstOrDefaultAsync(p => p.RaffleId == raffleId && p.PhoneNumber == phone);

            if (participant == null)
            {
                return NotFound(new ApiResponse<RaffleRegistrationResponse>
                {
                    Success = false,
                    Message = "Registration not found. Please register first."
                });
            }

            if (participant.IsVerified)
            {
                return Ok(new ApiResponse<RaffleRegistrationResponse>
                {
                    Success = true,
                    Message = "Already verified",
                    Data = new RaffleRegistrationResponse
                    {
                        ParticipantId = participant.ParticipantId,
                        Name = participant.Name,
                        PhoneNumber = participant.PhoneNumber,
                        IsVerified = true,
                        SessionToken = participant.SessionToken
                    }
                });
            }

            return await SendOtp(participant);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending OTP for raffle {RaffleId}", raffleId);
            return StatusCode(500, new ApiResponse<RaffleRegistrationResponse>
            {
                Success = false,
                Message = "An error occurred while resending verification code"
            });
        }
    }

    // GET: /RaffleParticipants/{raffleId}/me - Get current participant info (requires session token)
    [AllowAnonymous]
    [HttpGet("{raffleId}/me")]
    public async Task<ActionResult<ApiResponse<RaffleParticipantDto>>> GetMyInfo(int raffleId)
    {
        try
        {
            var sessionToken = GetSessionToken();
            if (string.IsNullOrEmpty(sessionToken))
            {
                return Unauthorized(new ApiResponse<RaffleParticipantDto>
                {
                    Success = false,
                    Message = "Session token required"
                });
            }

            var participant = await _context.RaffleParticipants
                .FirstOrDefaultAsync(p => p.RaffleId == raffleId && p.SessionToken == sessionToken);

            if (participant == null)
            {
                return NotFound(new ApiResponse<RaffleParticipantDto>
                {
                    Success = false,
                    Message = "Participant not found"
                });
            }

            return Ok(new ApiResponse<RaffleParticipantDto>
            {
                Success = true,
                Data = MapToParticipantDto(participant)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching participant info for raffle {RaffleId}", raffleId);
            return StatusCode(500, new ApiResponse<RaffleParticipantDto>
            {
                Success = false,
                Message = "An error occurred"
            });
        }
    }

    // POST: /RaffleParticipants/{raffleId}/purchase - Purchase tickets
    [AllowAnonymous]
    [HttpPost("{raffleId}/purchase")]
    public async Task<ActionResult<ApiResponse<RafflePurchaseResponse>>> PurchaseTickets(int raffleId, [FromBody] RafflePurchaseRequest request)
    {
        try
        {
            var sessionToken = GetSessionToken();
            if (string.IsNullOrEmpty(sessionToken))
            {
                return Unauthorized(new ApiResponse<RafflePurchaseResponse>
                {
                    Success = false,
                    Message = "Session token required"
                });
            }

            var participant = await _context.RaffleParticipants
                .Include(p => p.Raffle)
                .FirstOrDefaultAsync(p => p.RaffleId == raffleId && p.SessionToken == sessionToken);

            if (participant == null)
            {
                return NotFound(new ApiResponse<RafflePurchaseResponse>
                {
                    Success = false,
                    Message = "Participant not found"
                });
            }

            if (!participant.IsVerified)
            {
                return BadRequest(new ApiResponse<RafflePurchaseResponse>
                {
                    Success = false,
                    Message = "Please verify your phone number first"
                });
            }

            if (participant.Raffle?.Status != "Active")
            {
                return BadRequest(new ApiResponse<RafflePurchaseResponse>
                {
                    Success = false,
                    Message = "This raffle is not currently accepting ticket purchases"
                });
            }

            var tier = await _context.RaffleTicketTiers
                .FirstOrDefaultAsync(t => t.TierId == request.TierId && t.RaffleId == raffleId && t.IsActive);

            if (tier == null)
            {
                return NotFound(new ApiResponse<RafflePurchaseResponse>
                {
                    Success = false,
                    Message = "Ticket tier not found or not available"
                });
            }

            var raffle = participant.Raffle!;

            // Assign tickets
            var ticketStart = raffle.NextTicketNumber;
            var ticketEnd = ticketStart + tier.TicketCount - 1;

            // Update participant
            if (!participant.TicketStart.HasValue)
            {
                participant.TicketStart = ticketStart;
            }
            participant.TicketEnd = ticketEnd;
            participant.TotalTickets += tier.TicketCount;
            participant.TotalPaid += tier.Price;
            participant.PaymentMethod = request.PaymentMethod;
            participant.TransactionId = request.TransactionId;
            participant.PaymentStatus = "Pending"; // Admin will confirm
            participant.UpdatedAt = DateTime.UtcNow;

            // Update raffle
            raffle.NextTicketNumber = ticketEnd + 1;
            raffle.TotalTicketsSold += tier.TicketCount;
            raffle.TotalRevenue += tier.Price;
            raffle.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Participant {ParticipantId} purchased {TicketCount} tickets ({Start}-{End}) for raffle {RaffleId}",
                participant.ParticipantId, tier.TicketCount, ticketStart, ticketEnd, raffleId);

            // Send ticket confirmation SMS
            try
            {
                var smsMessage = CasecEmailTemplates.RaffleTicketSms(
                    raffle.Name,
                    ticketStart,
                    ticketEnd,
                    tier.TicketCount,
                    raffle.TicketDigits);
                await _notificationService.SendSmsAsync(null, participant.PhoneNumber, smsMessage);
                _logger.LogInformation("Ticket confirmation SMS sent to {Phone}", participant.PhoneNumber);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send ticket confirmation SMS to {Phone}", participant.PhoneNumber);
            }

            return Ok(new ApiResponse<RafflePurchaseResponse>
            {
                Success = true,
                Message = $"Successfully purchased {tier.TicketCount} tickets! Your ticket numbers: {ticketStart:D6} - {ticketEnd:D6}",
                Data = new RafflePurchaseResponse
                {
                    ParticipantId = participant.ParticipantId,
                    TicketStart = ticketStart,
                    TicketEnd = ticketEnd,
                    TicketsAdded = tier.TicketCount,
                    TotalTickets = participant.TotalTickets,
                    AmountPaid = tier.Price,
                    TotalPaid = participant.TotalPaid
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error purchasing tickets for raffle {RaffleId}", raffleId);
            return StatusCode(500, new ApiResponse<RafflePurchaseResponse>
            {
                Success = false,
                Message = "An error occurred while purchasing tickets"
            });
        }
    }

    // PUT: /RaffleParticipants/{raffleId}/avatar - Update avatar
    [AllowAnonymous]
    [HttpPut("{raffleId}/avatar")]
    public async Task<ActionResult<ApiResponse<RaffleParticipantDto>>> UpdateAvatar(int raffleId, [FromBody] RaffleUpdateAvatarRequest request)
    {
        try
        {
            var sessionToken = GetSessionToken();
            if (string.IsNullOrEmpty(sessionToken))
            {
                return Unauthorized(new ApiResponse<RaffleParticipantDto>
                {
                    Success = false,
                    Message = "Session token required"
                });
            }

            var participant = await _context.RaffleParticipants
                .FirstOrDefaultAsync(p => p.RaffleId == raffleId && p.SessionToken == sessionToken);

            if (participant == null)
            {
                return NotFound(new ApiResponse<RaffleParticipantDto>
                {
                    Success = false,
                    Message = "Participant not found"
                });
            }

            if (!participant.IsVerified)
            {
                return BadRequest(new ApiResponse<RaffleParticipantDto>
                {
                    Success = false,
                    Message = "Please verify your phone number first"
                });
            }

            participant.AvatarUrl = request.AvatarUrl;
            participant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<RaffleParticipantDto>
            {
                Success = true,
                Message = "Avatar updated successfully",
                Data = MapToParticipantDto(participant)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating avatar for raffle {RaffleId}", raffleId);
            return StatusCode(500, new ApiResponse<RaffleParticipantDto>
            {
                Success = false,
                Message = "An error occurred while updating avatar"
            });
        }
    }

    // POST: /RaffleParticipants/{raffleId}/avatar-upload - Upload avatar file
    [AllowAnonymous]
    [HttpPost("{raffleId}/avatar-upload")]
    public async Task<ActionResult<ApiResponse<string>>> UploadAvatar(int raffleId, IFormFile file, [FromServices] IAssetService assetService)
    {
        try
        {
            var sessionToken = GetSessionToken();
            if (string.IsNullOrEmpty(sessionToken))
            {
                return Unauthorized(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Session token required"
                });
            }

            var participant = await _context.RaffleParticipants
                .FirstOrDefaultAsync(p => p.RaffleId == raffleId && p.SessionToken == sessionToken);

            if (participant == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Participant not found"
                });
            }

            if (!participant.IsVerified)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Please verify your phone number first"
                });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Success = false,
                    Message = "No file uploaded"
                });
            }

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
            {
                return BadRequest(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)."
                });
            }

            // Upload file
            var uploadResult = await assetService.UploadFileAsync(
                file,
                $"raffle-avatars/{raffleId}",
                "RaffleParticipant",
                participant.ParticipantId,
                null);

            // Update participant avatar
            participant.AvatarUrl = uploadResult.Url;
            participant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string>
            {
                Success = true,
                Message = "Avatar uploaded successfully",
                Data = uploadResult.Url
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading avatar for raffle {RaffleId}", raffleId);
            return StatusCode(500, new ApiResponse<string>
            {
                Success = false,
                Message = "An error occurred while uploading avatar"
            });
        }
    }

    // ============ HELPER METHODS ============

    private string? GetSessionToken()
    {
        // Check header first
        if (Request.Headers.TryGetValue("X-Raffle-Session", out var headerToken))
        {
            return headerToken.ToString();
        }

        // Check query parameter
        if (Request.Query.TryGetValue("session", out var queryToken))
        {
            return queryToken.ToString();
        }

        return null;
    }

    private async Task<ActionResult<ApiResponse<RaffleRegistrationResponse>>> SendOtp(RaffleParticipant participant)
    {
        // Generate 6-digit OTP
        var random = new Random();
        var otp = random.Next(100000, 999999).ToString();

        participant.OtpCode = otp;
        participant.OtpExpiresAt = DateTime.UtcNow.AddMinutes(10);
        participant.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Send OTP via SMS using notification service
        try
        {
            var smsMessage = CasecEmailTemplates.OtpSms(otp, 10);
            await _notificationService.SendSmsAsync(null, participant.PhoneNumber, smsMessage);
            _logger.LogInformation("OTP SMS sent to {Phone}", participant.PhoneNumber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send OTP SMS to {Phone}, OTP: {OTP}", participant.PhoneNumber, otp);
        }

        var response = new RaffleRegistrationResponse
        {
            ParticipantId = participant.ParticipantId,
            Name = participant.Name,
            PhoneNumber = participant.PhoneNumber,
            IsVerified = false,
            SessionToken = participant.SessionToken
        };

        // In development, include OTP in response for testing
        if (_environment.IsDevelopment())
        {
            response.OtpMessage = $"[DEV MODE] Your verification code is: {otp}";
        }

        return Ok(new ApiResponse<RaffleRegistrationResponse>
        {
            Success = true,
            Message = "Verification code sent to your phone number",
            Data = response
        });
    }

    private RaffleParticipantDto MapToParticipantDto(RaffleParticipant participant)
    {
        return new RaffleParticipantDto
        {
            ParticipantId = participant.ParticipantId,
            RaffleId = participant.RaffleId,
            Name = participant.Name,
            PhoneNumber = participant.PhoneNumber,
            AvatarUrl = participant.AvatarUrl,
            IsVerified = participant.IsVerified,
            TicketStart = participant.TicketStart,
            TicketEnd = participant.TicketEnd,
            TotalTickets = participant.TotalTickets,
            TotalPaid = participant.TotalPaid,
            PaymentStatus = participant.PaymentStatus,
            PaymentMethod = participant.PaymentMethod,
            IsWinner = participant.IsWinner,
            CreatedAt = participant.CreatedAt
        };
    }
}
