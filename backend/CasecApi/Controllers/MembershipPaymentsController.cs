using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using CasecApi.Data;
using CasecApi.Models;
using CasecApi.Models.DTOs;
using CasecApi.Services;

namespace CasecApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MembershipPaymentsController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<MembershipPaymentsController> _logger;
    private readonly IAssetService _assetService;

    public MembershipPaymentsController(CasecDbContext context, ILogger<MembershipPaymentsController> logger, IAssetService assetService)
    {
        _context = context;
        _logger = logger;
        _assetService = assetService;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    // GET: api/MembershipPayments/status
    // Get current user's membership status and payment history
    [HttpGet("status")]
    public async Task<ActionResult<ApiResponse<MembershipStatusDto>>> GetMembershipStatus()
    {
        try
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users
                .Include(u => u.MembershipType)
                .Include(u => u.FamilyGroup)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return NotFound(new ApiResponse<MembershipStatusDto>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Get payment history
            var payments = await _context.MembershipPayments
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .Include(p => p.MembershipType)
                .Include(p => p.ConfirmedByUser)
                .ToListAsync();

            var paymentDtos = payments.Select(p => MapToPaymentDto(p)).ToList();

            // Get family members if user belongs to a family group
            var familyMembers = new List<FamilyMemberSummaryDto>();
            if (user.FamilyGroupId.HasValue)
            {
                familyMembers = await _context.Users
                    .Where(u => u.FamilyGroupId == user.FamilyGroupId && u.UserId != userId)
                    .Select(u => new FamilyMemberSummaryDto
                    {
                        UserId = u.UserId,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        AvatarUrl = u.AvatarUrl,
                        Relationship = u.RelationshipToPrimary
                    })
                    .ToListAsync();
            }

            var now = DateTime.UtcNow;
            var isExpired = user.MembershipValidUntil.HasValue && user.MembershipValidUntil.Value < now;
            var daysUntilExpiration = user.MembershipValidUntil.HasValue
                ? (int)(user.MembershipValidUntil.Value - now).TotalDays
                : 0;

            var status = new MembershipStatusDto
            {
                UserId = user.UserId,
                MembershipTypeName = user.MembershipType?.Name ?? "Unknown",
                MembershipPrice = user.MembershipType?.AnnualFee ?? 0,
                IsActive = user.IsActive,
                MembershipValidUntil = user.MembershipValidUntil,
                IsExpired = isExpired,
                IsExpiringSoon = !isExpired && daysUntilExpiration <= 30 && daysUntilExpiration > 0,
                DaysUntilExpiration = daysUntilExpiration,
                LatestPayment = paymentDtos.FirstOrDefault(p => p.Status == "Confirmed"),
                PendingPayment = paymentDtos.FirstOrDefault(p => p.Status == "Pending"),
                PaymentHistory = paymentDtos,
                FamilyMembers = familyMembers
            };

            return Ok(new ApiResponse<MembershipStatusDto>
            {
                Success = true,
                Data = status
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching membership status");
            return StatusCode(500, new ApiResponse<MembershipStatusDto>
            {
                Success = false,
                Message = "An error occurred while fetching membership status"
            });
        }
    }

    // GET: api/MembershipPayments/methods
    // Get available payment methods
    [HttpGet("methods")]
    [AllowAnonymous]
    public ActionResult<ApiResponse<List<PaymentMethodDto>>> GetPaymentMethods()
    {
        var methods = new List<PaymentMethodDto>
        {
            new PaymentMethodDto
            {
                Code = "Zelle",
                Name = "Zelle",
                Instructions = "Send payment via Zelle to treasurer@casec.org. Include your name and 'Membership' in the memo.",
                IsActive = true
            }
        };

        return Ok(new ApiResponse<List<PaymentMethodDto>>
        {
            Success = true,
            Data = methods
        });
    }

    // POST: api/MembershipPayments
    // Submit a new payment
    [HttpPost]
    public async Task<ActionResult<ApiResponse<MembershipPaymentDto>>> SubmitPayment([FromBody] SubmitPaymentRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users
                .Include(u => u.MembershipType)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return NotFound(new ApiResponse<MembershipPaymentDto>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Check if there's already a pending payment
            var existingPending = await _context.MembershipPayments
                .AnyAsync(p => p.UserId == userId && p.Status == "Pending");

            if (existingPending)
            {
                return BadRequest(new ApiResponse<MembershipPaymentDto>
                {
                    Success = false,
                    Message = "You already have a pending payment. Please wait for admin confirmation or cancel it first."
                });
            }

            // Validate membership type
            var membershipType = await _context.MembershipTypes.FindAsync(request.MembershipTypeId);
            if (membershipType == null || !membershipType.IsActive)
            {
                return BadRequest(new ApiResponse<MembershipPaymentDto>
                {
                    Success = false,
                    Message = "Invalid membership type"
                });
            }

            // Calculate validity period (1 year from now or from current expiration if not expired)
            var validFrom = DateTime.UtcNow;
            if (user.MembershipValidUntil.HasValue && user.MembershipValidUntil.Value > validFrom)
            {
                validFrom = user.MembershipValidUntil.Value; // Extend from current expiration
            }
            var validUntil = validFrom.AddYears(1);

            var payment = new MembershipPayment
            {
                UserId = userId,
                MembershipTypeId = request.MembershipTypeId,
                Amount = request.Amount,
                PaymentMethod = request.PaymentMethod,
                TransactionId = request.TransactionId,
                PaymentDate = request.PaymentDate,
                PaymentScope = request.PaymentScope,
                Status = "Pending",
                ValidFrom = validFrom,
                ValidUntil = validUntil,
                Notes = request.Notes
            };

            _context.MembershipPayments.Add(payment);
            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = userId,
                ActivityType = "PaymentSubmitted",
                Description = $"Submitted membership payment of ${request.Amount} via {request.PaymentMethod}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(payment).Reference(p => p.MembershipType).LoadAsync();

            return Ok(new ApiResponse<MembershipPaymentDto>
            {
                Success = true,
                Message = "Payment submitted successfully. Please upload proof of payment.",
                Data = MapToPaymentDto(payment)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting payment");
            return StatusCode(500, new ApiResponse<MembershipPaymentDto>
            {
                Success = false,
                Message = "An error occurred while submitting payment"
            });
        }
    }

    // POST: api/MembershipPayments/{id}/proof
    // Upload proof of payment
    [HttpPost("{id}/proof")]
    public async Task<ActionResult<ApiResponse<MembershipPaymentDto>>> UploadProofOfPayment(int id, IFormFile file)
    {
        try
        {
            var userId = GetCurrentUserId();
            var payment = await _context.MembershipPayments
                .Include(p => p.MembershipType)
                .FirstOrDefaultAsync(p => p.PaymentId == id && p.UserId == userId);

            if (payment == null)
            {
                return NotFound(new ApiResponse<MembershipPaymentDto>
                {
                    Success = false,
                    Message = "Payment not found"
                });
            }

            if (payment.Status != "Pending")
            {
                return BadRequest(new ApiResponse<MembershipPaymentDto>
                {
                    Success = false,
                    Message = "Can only upload proof for pending payments"
                });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<MembershipPaymentDto>
                {
                    Success = false,
                    Message = "No file uploaded"
                });
            }

            // Validate file type (images and PDFs)
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
            {
                return BadRequest(new ApiResponse<MembershipPaymentDto>
                {
                    Success = false,
                    Message = "Invalid file type. Please upload an image or PDF."
                });
            }

            // Delete old proof if exists
            if (!string.IsNullOrEmpty(payment.ProofOfPaymentUrl) && payment.ProofOfPaymentUrl.StartsWith("/api/asset/"))
            {
                var oldFileIdStr = payment.ProofOfPaymentUrl.Replace("/api/asset/", "");
                if (int.TryParse(oldFileIdStr, out var oldFileId))
                {
                    await _assetService.DeleteAssetAsync(oldFileId);
                }
            }

            // Upload new proof
            var uploadResult = await _assetService.UploadAssetAsync(
                file,
                "payment-proofs",
                objectType: "MembershipPayment",
                objectId: payment.PaymentId,
                uploadedBy: userId
            );

            if (!uploadResult.Success)
            {
                return BadRequest(new ApiResponse<MembershipPaymentDto>
                {
                    Success = false,
                    Message = uploadResult.Error ?? "Failed to upload file"
                });
            }

            payment.ProofOfPaymentUrl = uploadResult.Url;
            payment.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<MembershipPaymentDto>
            {
                Success = true,
                Message = "Proof of payment uploaded successfully",
                Data = MapToPaymentDto(payment)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading proof of payment");
            return StatusCode(500, new ApiResponse<MembershipPaymentDto>
            {
                Success = false,
                Message = "An error occurred while uploading proof of payment"
            });
        }
    }

    // DELETE: api/MembershipPayments/{id}
    // Cancel a pending payment
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> CancelPayment(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var payment = await _context.MembershipPayments
                .FirstOrDefaultAsync(p => p.PaymentId == id && p.UserId == userId);

            if (payment == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Payment not found"
                });
            }

            if (payment.Status != "Pending")
            {
                return BadRequest(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Can only cancel pending payments"
                });
            }

            // Delete proof file if exists
            if (!string.IsNullOrEmpty(payment.ProofOfPaymentUrl) && payment.ProofOfPaymentUrl.StartsWith("/api/asset/"))
            {
                var fileIdStr = payment.ProofOfPaymentUrl.Replace("/api/asset/", "");
                if (int.TryParse(fileIdStr, out var fileId))
                {
                    await _assetService.DeleteAssetAsync(fileId);
                }
            }

            _context.MembershipPayments.Remove(payment);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Payment cancelled successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling payment");
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while cancelling payment"
            });
        }
    }

    // ============ ADMIN ENDPOINTS ============

    // GET: api/MembershipPayments/admin/pending
    // Get all pending payments (Admin only)
    [HttpGet("admin/pending")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<MembershipPaymentDto>>>> GetPendingPayments()
    {
        try
        {
            var payments = await _context.MembershipPayments
                .Where(p => p.Status == "Pending")
                .OrderBy(p => p.CreatedAt)
                .Include(p => p.User)
                .Include(p => p.MembershipType)
                .ToListAsync();

            var dtos = payments.Select(p => MapToPaymentDto(p)).ToList();

            return Ok(new ApiResponse<List<MembershipPaymentDto>>
            {
                Success = true,
                Data = dtos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching pending payments");
            return StatusCode(500, new ApiResponse<List<MembershipPaymentDto>>
            {
                Success = false,
                Message = "An error occurred while fetching pending payments"
            });
        }
    }

    // GET: api/MembershipPayments/admin/all
    // Get all payments with optional filters (Admin only)
    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<MembershipPaymentDto>>>> GetAllPayments(
        [FromQuery] string? status = null,
        [FromQuery] int? userId = null,
        [FromQuery] string? search = null)
    {
        try
        {
            var query = _context.MembershipPayments
                .Include(p => p.User)
                .Include(p => p.MembershipType)
                .Include(p => p.ConfirmedByUser)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(p => p.Status == status);
            }

            if (userId.HasValue)
            {
                query = query.Where(p => p.UserId == userId.Value);
            }

            // Search by user name or email
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(p =>
                    p.User!.FirstName.ToLower().Contains(searchLower) ||
                    p.User.LastName.ToLower().Contains(searchLower) ||
                    p.User.Email.ToLower().Contains(searchLower) ||
                    (p.User.FirstName + " " + p.User.LastName).ToLower().Contains(searchLower));
            }

            var payments = await query
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var dtos = payments.Select(p => MapToPaymentDto(p)).ToList();

            return Ok(new ApiResponse<List<MembershipPaymentDto>>
            {
                Success = true,
                Data = dtos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all payments");
            return StatusCode(500, new ApiResponse<List<MembershipPaymentDto>>
            {
                Success = false,
                Message = "An error occurred while fetching payments"
            });
        }
    }

    // GET: api/MembershipPayments/admin/{id}
    // Get payment details (Admin only)
    [HttpGet("admin/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<MembershipPaymentDto>>> GetPaymentDetails(int id)
    {
        try
        {
            var payment = await _context.MembershipPayments
                .Include(p => p.User)
                .Include(p => p.MembershipType)
                .Include(p => p.ConfirmedByUser)
                .FirstOrDefaultAsync(p => p.PaymentId == id);

            if (payment == null)
            {
                return NotFound(new ApiResponse<MembershipPaymentDto>
                {
                    Success = false,
                    Message = "Payment not found"
                });
            }

            var dto = MapToPaymentDto(payment);

            // Get family members if this is a family payment
            if (payment.PaymentScope == "Family" && payment.User?.FamilyGroupId != null)
            {
                dto.CoveredFamilyMembers = await _context.Users
                    .Where(u => u.FamilyGroupId == payment.User.FamilyGroupId && u.UserId != payment.UserId)
                    .Select(u => new FamilyMemberSummaryDto
                    {
                        UserId = u.UserId,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        AvatarUrl = u.AvatarUrl,
                        Relationship = u.RelationshipToPrimary
                    })
                    .ToListAsync();
            }

            return Ok(new ApiResponse<MembershipPaymentDto>
            {
                Success = true,
                Data = dto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching payment details");
            return StatusCode(500, new ApiResponse<MembershipPaymentDto>
            {
                Success = false,
                Message = "An error occurred while fetching payment details"
            });
        }
    }

    // POST: api/MembershipPayments/admin/{id}/confirm
    // Confirm or reject a payment (Admin only)
    [HttpPost("admin/{id}/confirm")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<MembershipPaymentDto>>> ConfirmPayment(int id, [FromBody] ConfirmPaymentRequest request)
    {
        try
        {
            var adminId = GetCurrentUserId();
            var payment = await _context.MembershipPayments
                .Include(p => p.User)
                .Include(p => p.MembershipType)
                .FirstOrDefaultAsync(p => p.PaymentId == id);

            if (payment == null)
            {
                return NotFound(new ApiResponse<MembershipPaymentDto>
                {
                    Success = false,
                    Message = "Payment not found"
                });
            }

            if (payment.Status != "Pending")
            {
                return BadRequest(new ApiResponse<MembershipPaymentDto>
                {
                    Success = false,
                    Message = "This payment has already been processed"
                });
            }

            if (payment.User == null)
            {
                return BadRequest(new ApiResponse<MembershipPaymentDto>
                {
                    Success = false,
                    Message = "User associated with this payment not found"
                });
            }

            if (request.Approve)
            {
                // Approve the payment
                payment.Status = "Confirmed";
                payment.ConfirmedBy = adminId;
                payment.ConfirmedAt = DateTime.UtcNow;

                // Update validity dates if provided
                if (request.ValidFrom.HasValue)
                    payment.ValidFrom = request.ValidFrom.Value;
                if (request.ValidUntil.HasValue)
                    payment.ValidUntil = request.ValidUntil.Value;

                if (!string.IsNullOrEmpty(request.Notes))
                    payment.Notes = (payment.Notes ?? "") + "\n[Admin] " + request.Notes;

                // Update the user's membership
                var user = payment.User;
                user.MembershipTypeId = payment.MembershipTypeId;
                user.MembershipValidUntil = payment.ValidUntil;
                user.IsActive = true;
                user.UpdatedAt = DateTime.UtcNow;

                // Handle family membership - allow linking family members for any payment
                if (request.FamilyMemberIds != null && request.FamilyMemberIds.Any())
                {
                    // Store covered family member IDs
                    payment.CoveredFamilyMemberIds = JsonSerializer.Serialize(request.FamilyMemberIds);

                    // Update payment scope to Family if it wasn't already
                    if (payment.PaymentScope != "Family")
                    {
                        payment.PaymentScope = "Family";
                    }

                    // Update family members' membership
                    var familyMembers = await _context.Users
                        .Where(u => request.FamilyMemberIds.Contains(u.UserId))
                        .ToListAsync();

                    foreach (var member in familyMembers)
                    {
                        member.MembershipTypeId = payment.MembershipTypeId;
                        member.MembershipValidUntil = payment.ValidUntil;
                        member.IsActive = true;
                        member.UpdatedAt = DateTime.UtcNow;
                    }
                }

                // Log activity
                var log = new ActivityLog
                {
                    UserId = adminId,
                    ActivityType = "PaymentConfirmed",
                    Description = $"Confirmed payment #{id} for user {user.FirstName} {user.LastName}"
                };
                _context.ActivityLogs.Add(log);
            }
            else
            {
                // Reject the payment
                payment.Status = "Rejected";
                payment.ConfirmedBy = adminId;
                payment.ConfirmedAt = DateTime.UtcNow;
                payment.RejectionReason = request.RejectionReason;

                // Log activity
                var log = new ActivityLog
                {
                    UserId = adminId,
                    ActivityType = "PaymentRejected",
                    Description = $"Rejected payment #{id}: {request.RejectionReason}"
                };
                _context.ActivityLogs.Add(log);
            }

            payment.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(payment).Reference(p => p.ConfirmedByUser).LoadAsync();

            return Ok(new ApiResponse<MembershipPaymentDto>
            {
                Success = true,
                Message = request.Approve ? "Payment confirmed successfully" : "Payment rejected",
                Data = MapToPaymentDto(payment)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming payment {PaymentId}: {Message}", id, ex.Message);
            return StatusCode(500, new ApiResponse<MembershipPaymentDto>
            {
                Success = false,
                Message = $"An error occurred while processing payment: {ex.Message}"
            });
        }
    }

    // GET: api/MembershipPayments/admin/user/{userId}/family
    // Get a user's family members for family membership assignment (Admin only)
    [HttpGet("admin/user/{userId}/family")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<FamilyMemberSummaryDto>>>> GetUserFamilyMembers(int userId)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new ApiResponse<List<FamilyMemberSummaryDto>>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            if (!user.FamilyGroupId.HasValue)
            {
                return Ok(new ApiResponse<List<FamilyMemberSummaryDto>>
                {
                    Success = true,
                    Data = new List<FamilyMemberSummaryDto>(),
                    Message = "User is not part of a family group"
                });
            }

            var familyMembers = await _context.Users
                .Where(u => u.FamilyGroupId == user.FamilyGroupId && u.UserId != userId)
                .Select(u => new FamilyMemberSummaryDto
                {
                    UserId = u.UserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    AvatarUrl = u.AvatarUrl,
                    Relationship = u.RelationshipToPrimary
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<FamilyMemberSummaryDto>>
            {
                Success = true,
                Data = familyMembers
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching family members");
            return StatusCode(500, new ApiResponse<List<FamilyMemberSummaryDto>>
            {
                Success = false,
                Message = "An error occurred while fetching family members"
            });
        }
    }

    // GET: api/MembershipPayments/admin/users/search
    // Search users to link to family membership (Admin only)
    [HttpGet("admin/users/search")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<FamilyMemberSummaryDto>>>> SearchUsersForFamilyLink(
        [FromQuery] string query,
        [FromQuery] int excludeUserId = 0)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return Ok(new ApiResponse<List<FamilyMemberSummaryDto>>
                {
                    Success = true,
                    Data = new List<FamilyMemberSummaryDto>()
                });
            }

            var searchLower = query.ToLower();
            var users = await _context.Users
                .Where(u => u.IsActive && u.UserId != excludeUserId &&
                    (u.FirstName.ToLower().Contains(searchLower) ||
                     u.LastName.ToLower().Contains(searchLower) ||
                     u.Email.ToLower().Contains(searchLower) ||
                     (u.FirstName + " " + u.LastName).ToLower().Contains(searchLower)))
                .OrderBy(u => u.LastName)
                .ThenBy(u => u.FirstName)
                .Take(10)
                .Select(u => new FamilyMemberSummaryDto
                {
                    UserId = u.UserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    AvatarUrl = u.AvatarUrl,
                    Email = u.Email
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<FamilyMemberSummaryDto>>
            {
                Success = true,
                Data = users
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users");
            return StatusCode(500, new ApiResponse<List<FamilyMemberSummaryDto>>
            {
                Success = false,
                Message = "An error occurred while searching users"
            });
        }
    }

    // Helper method to map payment entity to DTO
    private MembershipPaymentDto MapToPaymentDto(MembershipPayment payment)
    {
        var dto = new MembershipPaymentDto
        {
            PaymentId = payment.PaymentId,
            UserId = payment.UserId,
            UserName = payment.User != null ? $"{payment.User.FirstName} {payment.User.LastName}" : "Unknown",
            UserEmail = payment.User?.Email,
            UserAvatarUrl = payment.User?.AvatarUrl,
            MembershipTypeId = payment.MembershipTypeId,
            MembershipTypeName = payment.MembershipType?.Name ?? "Unknown",
            Amount = payment.Amount,
            PaymentDate = payment.PaymentDate,
            PaymentMethod = payment.PaymentMethod,
            TransactionId = payment.TransactionId,
            Status = payment.Status,
            ProofOfPaymentUrl = payment.ProofOfPaymentUrl,
            PaymentScope = payment.PaymentScope,
            ConfirmedBy = payment.ConfirmedBy,
            ConfirmedByName = payment.ConfirmedByUser != null
                ? $"{payment.ConfirmedByUser.FirstName} {payment.ConfirmedByUser.LastName}"
                : null,
            ConfirmedAt = payment.ConfirmedAt,
            RejectionReason = payment.RejectionReason,
            ValidFrom = payment.ValidFrom,
            ValidUntil = payment.ValidUntil,
            Notes = payment.Notes,
            CreatedAt = payment.CreatedAt
        };

        if (!string.IsNullOrEmpty(payment.CoveredFamilyMemberIds))
        {
            try
            {
                dto.CoveredFamilyMemberIds = JsonSerializer.Deserialize<List<int>>(payment.CoveredFamilyMemberIds);
            }
            catch { }
        }

        return dto;
    }
}
