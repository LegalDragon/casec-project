using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using CasecApi.Data;
using CasecApi.Models;
using CasecApi.Models.DTOs;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
public class RafflesController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<RafflesController> _logger;

    public RafflesController(CasecDbContext context, ILogger<RafflesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    // GET: /Raffles - Get active raffles (public)
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<RaffleSummaryDto>>>> GetActiveRaffles()
    {
        try
        {
            var now = DateTime.UtcNow;
            var raffles = await _context.Raffles
                .Include(r => r.Participants)
                .Where(r => r.Status == "Active" || r.Status == "Drawing")
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var raffleDtos = raffles.Select(r => new RaffleSummaryDto
            {
                RaffleId = r.RaffleId,
                Name = r.Name,
                ImageUrl = r.ImageUrl,
                Status = r.Status,
                TotalTicketsSold = r.TotalTicketsSold,
                ParticipantCount = r.Participants.Count(p => p.IsVerified),
                TotalRevenue = r.TotalRevenue,
                StartDate = r.StartDate,
                EndDate = r.EndDate,
                DrawingDate = r.DrawingDate
            }).ToList();

            return Ok(new ApiResponse<List<RaffleSummaryDto>>
            {
                Success = true,
                Data = raffleDtos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching active raffles");
            return StatusCode(500, new ApiResponse<List<RaffleSummaryDto>>
            {
                Success = false,
                Message = "An error occurred while fetching raffles"
            });
        }
    }

    // GET: /Raffles/{id} - Get raffle details (public)
    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<RaffleDto>>> GetRaffle(int id)
    {
        try
        {
            var raffle = await _context.Raffles
                .Include(r => r.Prizes)
                .Include(r => r.TicketTiers)
                .Include(r => r.Participants)
                .Include(r => r.CreatedByUser)
                .FirstOrDefaultAsync(r => r.RaffleId == id);

            if (raffle == null)
            {
                return NotFound(new ApiResponse<RaffleDto>
                {
                    Success = false,
                    Message = "Raffle not found"
                });
            }

            var dto = MapToRaffleDto(raffle);

            return Ok(new ApiResponse<RaffleDto>
            {
                Success = true,
                Data = dto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<RaffleDto>
            {
                Success = false,
                Message = "An error occurred while fetching raffle"
            });
        }
    }

    // GET: /Raffles/{id}/drawing - Get drawing page data
    [AllowAnonymous]
    [HttpGet("{id}/drawing")]
    public async Task<ActionResult<ApiResponse<RaffleDrawingDto>>> GetDrawingData(int id)
    {
        try
        {
            var raffle = await _context.Raffles
                .Include(r => r.Prizes)
                .Include(r => r.Participants)
                .FirstOrDefaultAsync(r => r.RaffleId == id);

            if (raffle == null)
            {
                return NotFound(new ApiResponse<RaffleDrawingDto>
                {
                    Success = false,
                    Message = "Raffle not found"
                });
            }

            var dto = new RaffleDrawingDto
            {
                RaffleId = raffle.RaffleId,
                Name = raffle.Name,
                Description = raffle.Description,
                ImageUrl = raffle.ImageUrl,
                Status = raffle.Status,
                WinningNumber = raffle.WinningNumber,
                RevealedDigits = raffle.RevealedDigits,
                TicketDigits = raffle.TicketDigits,
                TotalTicketsSold = raffle.TotalTicketsSold,
                DrawingDate = raffle.DrawingDate,
                Prizes = raffle.Prizes.OrderBy(p => p.DisplayOrder).Select(p => new RafflePrizeDto
                {
                    PrizeId = p.PrizeId,
                    RaffleId = p.RaffleId,
                    Name = p.Name,
                    Description = p.Description,
                    ImageUrl = p.ImageUrl,
                    Value = p.Value,
                    DisplayOrder = p.DisplayOrder,
                    IsGrandPrize = p.IsGrandPrize
                }).ToList(),
                Participants = raffle.Participants
                    .Where(p => p.IsVerified && p.TotalTickets > 0 && p.PaymentStatus == "Confirmed")
                    .Select(p => new RaffleParticipantSummaryDto
                    {
                        ParticipantId = p.ParticipantId,
                        Name = p.Name,
                        AvatarUrl = p.AvatarUrl,
                        TicketStart = p.TicketStart,
                        TicketEnd = p.TicketEnd,
                        TotalTickets = p.TotalTickets,
                        IsWinner = p.IsWinner,
                        IsStillEligible = IsParticipantEligible(p, raffle.RevealedDigits, raffle.TicketDigits)
                    })
                    .OrderBy(p => p.TicketStart)
                    .ToList()
            };

            return Ok(new ApiResponse<RaffleDrawingDto>
            {
                Success = true,
                Data = dto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching drawing data for raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<RaffleDrawingDto>
            {
                Success = false,
                Message = "An error occurred while fetching drawing data"
            });
        }
    }

    // Helper to check if participant is still eligible based on revealed digits
    private bool IsParticipantEligible(RaffleParticipant participant, string? revealedDigits, int ticketDigits)
    {
        if (string.IsNullOrEmpty(revealedDigits) || !participant.TicketStart.HasValue || !participant.TicketEnd.HasValue)
            return true;

        // Check if any of the participant's ticket numbers could still match
        for (int ticket = participant.TicketStart.Value; ticket <= participant.TicketEnd.Value; ticket++)
        {
            var ticketStr = ticket.ToString().PadLeft(ticketDigits, '0');
            bool matches = true;
            for (int i = 0; i < revealedDigits.Length && i < ticketStr.Length; i++)
            {
                if (ticketStr[i] != revealedDigits[i])
                {
                    matches = false;
                    break;
                }
            }
            if (matches) return true;
        }
        return false;
    }

    // ============ ADMIN ENDPOINTS ============

    // GET: /Raffles/admin/all - Get all raffles (admin only)
    [Authorize(Roles = "Admin")]
    [HttpGet("admin/all")]
    public async Task<ActionResult<ApiResponse<List<RaffleDto>>>> GetAllRaffles()
    {
        try
        {
            var raffles = await _context.Raffles
                .Include(r => r.Prizes)
                .Include(r => r.TicketTiers)
                .Include(r => r.Participants)
                .Include(r => r.CreatedByUser)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var raffleDtos = raffles.Select(MapToRaffleDto).ToList();

            return Ok(new ApiResponse<List<RaffleDto>>
            {
                Success = true,
                Data = raffleDtos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all raffles");
            return StatusCode(500, new ApiResponse<List<RaffleDto>>
            {
                Success = false,
                Message = "An error occurred while fetching raffles"
            });
        }
    }

    // POST: /Raffles - Create a new raffle (admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<RaffleDto>>> CreateRaffle([FromBody] CreateRaffleRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();

            var raffle = new Raffle
            {
                Name = request.Name,
                Description = request.Description,
                ImageUrl = request.ImageUrl,
                TicketDigits = request.TicketDigits > 0 ? request.TicketDigits : 6,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                DrawingDate = request.DrawingDate,
                Status = "Draft",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Raffles.Add(raffle);
            await _context.SaveChangesAsync();

            // Add prizes if provided
            if (request.Prizes != null && request.Prizes.Any())
            {
                foreach (var prizeReq in request.Prizes)
                {
                    var prize = new RafflePrize
                    {
                        RaffleId = raffle.RaffleId,
                        Name = prizeReq.Name,
                        Description = prizeReq.Description,
                        ImageUrl = prizeReq.ImageUrl,
                        Value = prizeReq.Value,
                        DisplayOrder = prizeReq.DisplayOrder,
                        IsGrandPrize = prizeReq.IsGrandPrize,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.RafflePrizes.Add(prize);
                }
            }

            // Add ticket tiers if provided
            if (request.TicketTiers != null && request.TicketTiers.Any())
            {
                foreach (var tierReq in request.TicketTiers)
                {
                    var tier = new RaffleTicketTier
                    {
                        RaffleId = raffle.RaffleId,
                        Name = tierReq.Name,
                        Price = tierReq.Price,
                        TicketCount = tierReq.TicketCount,
                        Description = tierReq.Description,
                        DisplayOrder = tierReq.DisplayOrder,
                        IsActive = tierReq.IsActive,
                        IsFeatured = tierReq.IsFeatured,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.RaffleTicketTiers.Add(tier);
                }
            }

            await _context.SaveChangesAsync();

            // Reload with all related data
            raffle = await _context.Raffles
                .Include(r => r.Prizes)
                .Include(r => r.TicketTiers)
                .Include(r => r.Participants)
                .Include(r => r.CreatedByUser)
                .FirstOrDefaultAsync(r => r.RaffleId == raffle.RaffleId);

            return Ok(new ApiResponse<RaffleDto>
            {
                Success = true,
                Message = "Raffle created successfully",
                Data = MapToRaffleDto(raffle!)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating raffle");
            return StatusCode(500, new ApiResponse<RaffleDto>
            {
                Success = false,
                Message = "An error occurred while creating raffle"
            });
        }
    }

    // PUT: /Raffles/{id} - Update raffle (admin only)
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<RaffleDto>>> UpdateRaffle(int id, [FromBody] UpdateRaffleRequest request)
    {
        try
        {
            var raffle = await _context.Raffles
                .Include(r => r.Prizes)
                .Include(r => r.TicketTiers)
                .Include(r => r.Participants)
                .FirstOrDefaultAsync(r => r.RaffleId == id);

            if (raffle == null)
            {
                return NotFound(new ApiResponse<RaffleDto>
                {
                    Success = false,
                    Message = "Raffle not found"
                });
            }

            // Update fields
            if (!string.IsNullOrEmpty(request.Name))
                raffle.Name = request.Name;
            if (request.Description != null)
                raffle.Description = request.Description;
            if (request.ImageUrl != null)
                raffle.ImageUrl = request.ImageUrl;
            if (!string.IsNullOrEmpty(request.Status))
                raffle.Status = request.Status;
            if (request.TicketDigits.HasValue)
                raffle.TicketDigits = request.TicketDigits.Value;
            if (request.StartDate.HasValue)
                raffle.StartDate = request.StartDate;
            if (request.EndDate.HasValue)
                raffle.EndDate = request.EndDate;
            if (request.DrawingDate.HasValue)
                raffle.DrawingDate = request.DrawingDate;

            raffle.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Reload with related data
            raffle = await _context.Raffles
                .Include(r => r.Prizes)
                .Include(r => r.TicketTiers)
                .Include(r => r.Participants)
                .Include(r => r.CreatedByUser)
                .FirstOrDefaultAsync(r => r.RaffleId == id);

            return Ok(new ApiResponse<RaffleDto>
            {
                Success = true,
                Message = "Raffle updated successfully",
                Data = MapToRaffleDto(raffle!)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<RaffleDto>
            {
                Success = false,
                Message = "An error occurred while updating raffle"
            });
        }
    }

    // DELETE: /Raffles/{id} - Delete raffle (admin only)
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteRaffle(int id)
    {
        try
        {
            var raffle = await _context.Raffles
                .Include(r => r.Prizes)
                .Include(r => r.TicketTiers)
                .Include(r => r.Participants)
                .FirstOrDefaultAsync(r => r.RaffleId == id);

            if (raffle == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Raffle not found"
                });
            }

            // Prevent deletion if raffle has confirmed payments
            if (raffle.Participants.Any(p => p.PaymentStatus == "Confirmed"))
            {
                return BadRequest(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Cannot delete raffle with confirmed payments. Set status to Cancelled instead."
                });
            }

            _context.RaffleParticipants.RemoveRange(raffle.Participants);
            _context.RaffleTicketTiers.RemoveRange(raffle.TicketTiers);
            _context.RafflePrizes.RemoveRange(raffle.Prizes);
            _context.Raffles.Remove(raffle);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Raffle deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting raffle"
            });
        }
    }

    // ============ PRIZE MANAGEMENT ============

    // POST: /Raffles/{id}/prizes - Add prize to raffle
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/prizes")]
    public async Task<ActionResult<ApiResponse<RafflePrizeDto>>> AddPrize(int id, [FromBody] CreateRafflePrizeRequest request)
    {
        try
        {
            var raffle = await _context.Raffles.FindAsync(id);
            if (raffle == null)
            {
                return NotFound(new ApiResponse<RafflePrizeDto>
                {
                    Success = false,
                    Message = "Raffle not found"
                });
            }

            var prize = new RafflePrize
            {
                RaffleId = id,
                Name = request.Name,
                Description = request.Description,
                ImageUrl = request.ImageUrl,
                Value = request.Value,
                DisplayOrder = request.DisplayOrder,
                IsGrandPrize = request.IsGrandPrize,
                CreatedAt = DateTime.UtcNow
            };

            _context.RafflePrizes.Add(prize);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<RafflePrizeDto>
            {
                Success = true,
                Message = "Prize added successfully",
                Data = MapToPrizeDto(prize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding prize to raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<RafflePrizeDto>
            {
                Success = false,
                Message = "An error occurred while adding prize"
            });
        }
    }

    // PUT: /Raffles/prizes/{prizeId} - Update prize
    [Authorize(Roles = "Admin")]
    [HttpPut("prizes/{prizeId}")]
    public async Task<ActionResult<ApiResponse<RafflePrizeDto>>> UpdatePrize(int prizeId, [FromBody] UpdateRafflePrizeRequest request)
    {
        try
        {
            var prize = await _context.RafflePrizes.FindAsync(prizeId);
            if (prize == null)
            {
                return NotFound(new ApiResponse<RafflePrizeDto>
                {
                    Success = false,
                    Message = "Prize not found"
                });
            }

            if (!string.IsNullOrEmpty(request.Name))
                prize.Name = request.Name;
            if (request.Description != null)
                prize.Description = request.Description;
            if (request.ImageUrl != null)
                prize.ImageUrl = request.ImageUrl;
            if (request.Value.HasValue)
                prize.Value = request.Value;
            if (request.DisplayOrder.HasValue)
                prize.DisplayOrder = request.DisplayOrder.Value;
            if (request.IsGrandPrize.HasValue)
                prize.IsGrandPrize = request.IsGrandPrize.Value;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<RafflePrizeDto>
            {
                Success = true,
                Message = "Prize updated successfully",
                Data = MapToPrizeDto(prize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating prize {PrizeId}", prizeId);
            return StatusCode(500, new ApiResponse<RafflePrizeDto>
            {
                Success = false,
                Message = "An error occurred while updating prize"
            });
        }
    }

    // DELETE: /Raffles/prizes/{prizeId} - Delete prize
    [Authorize(Roles = "Admin")]
    [HttpDelete("prizes/{prizeId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePrize(int prizeId)
    {
        try
        {
            var prize = await _context.RafflePrizes.FindAsync(prizeId);
            if (prize == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Prize not found"
                });
            }

            _context.RafflePrizes.Remove(prize);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Prize deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting prize {PrizeId}", prizeId);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting prize"
            });
        }
    }

    // ============ TICKET TIER MANAGEMENT ============

    // POST: /Raffles/{id}/tiers - Add ticket tier
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/tiers")]
    public async Task<ActionResult<ApiResponse<RaffleTicketTierDto>>> AddTicketTier(int id, [FromBody] CreateRaffleTicketTierRequest request)
    {
        try
        {
            var raffle = await _context.Raffles.FindAsync(id);
            if (raffle == null)
            {
                return NotFound(new ApiResponse<RaffleTicketTierDto>
                {
                    Success = false,
                    Message = "Raffle not found"
                });
            }

            var tier = new RaffleTicketTier
            {
                RaffleId = id,
                Name = request.Name,
                Price = request.Price,
                TicketCount = request.TicketCount,
                Description = request.Description,
                DisplayOrder = request.DisplayOrder,
                IsActive = request.IsActive,
                IsFeatured = request.IsFeatured,
                CreatedAt = DateTime.UtcNow
            };

            _context.RaffleTicketTiers.Add(tier);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<RaffleTicketTierDto>
            {
                Success = true,
                Message = "Ticket tier added successfully",
                Data = MapToTierDto(tier)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding ticket tier to raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<RaffleTicketTierDto>
            {
                Success = false,
                Message = "An error occurred while adding ticket tier"
            });
        }
    }

    // PUT: /Raffles/tiers/{tierId} - Update ticket tier
    [Authorize(Roles = "Admin")]
    [HttpPut("tiers/{tierId}")]
    public async Task<ActionResult<ApiResponse<RaffleTicketTierDto>>> UpdateTicketTier(int tierId, [FromBody] UpdateRaffleTicketTierRequest request)
    {
        try
        {
            var tier = await _context.RaffleTicketTiers.FindAsync(tierId);
            if (tier == null)
            {
                return NotFound(new ApiResponse<RaffleTicketTierDto>
                {
                    Success = false,
                    Message = "Ticket tier not found"
                });
            }

            if (!string.IsNullOrEmpty(request.Name))
                tier.Name = request.Name;
            if (request.Price.HasValue)
                tier.Price = request.Price.Value;
            if (request.TicketCount.HasValue)
                tier.TicketCount = request.TicketCount.Value;
            if (request.Description != null)
                tier.Description = request.Description;
            if (request.DisplayOrder.HasValue)
                tier.DisplayOrder = request.DisplayOrder.Value;
            if (request.IsActive.HasValue)
                tier.IsActive = request.IsActive.Value;
            if (request.IsFeatured.HasValue)
                tier.IsFeatured = request.IsFeatured.Value;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<RaffleTicketTierDto>
            {
                Success = true,
                Message = "Ticket tier updated successfully",
                Data = MapToTierDto(tier)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating ticket tier {TierId}", tierId);
            return StatusCode(500, new ApiResponse<RaffleTicketTierDto>
            {
                Success = false,
                Message = "An error occurred while updating ticket tier"
            });
        }
    }

    // DELETE: /Raffles/tiers/{tierId} - Delete ticket tier
    [Authorize(Roles = "Admin")]
    [HttpDelete("tiers/{tierId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteTicketTier(int tierId)
    {
        try
        {
            var tier = await _context.RaffleTicketTiers.FindAsync(tierId);
            if (tier == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Ticket tier not found"
                });
            }

            _context.RaffleTicketTiers.Remove(tier);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Ticket tier deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting ticket tier {TierId}", tierId);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting ticket tier"
            });
        }
    }

    // ============ DRAWING MANAGEMENT ============

    // POST: /Raffles/{id}/start-drawing - Start the drawing process
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/start-drawing")]
    public async Task<ActionResult<ApiResponse<RaffleDrawingDto>>> StartDrawing(int id)
    {
        try
        {
            var raffle = await _context.Raffles
                .Include(r => r.Prizes)
                .Include(r => r.Participants)
                .FirstOrDefaultAsync(r => r.RaffleId == id);

            if (raffle == null)
            {
                return NotFound(new ApiResponse<RaffleDrawingDto>
                {
                    Success = false,
                    Message = "Raffle not found"
                });
            }

            if (raffle.Status != "Active")
            {
                return BadRequest(new ApiResponse<RaffleDrawingDto>
                {
                    Success = false,
                    Message = "Raffle must be Active to start drawing"
                });
            }

            if (raffle.TotalTicketsSold == 0)
            {
                return BadRequest(new ApiResponse<RaffleDrawingDto>
                {
                    Success = false,
                    Message = "Cannot start drawing with no tickets sold"
                });
            }

            raffle.Status = "Drawing";
            raffle.RevealedDigits = "";
            raffle.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return await GetDrawingData(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting drawing for raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<RaffleDrawingDto>
            {
                Success = false,
                Message = "An error occurred while starting drawing"
            });
        }
    }

    // POST: /Raffles/{id}/reveal-digit - Reveal the next digit
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/reveal-digit")]
    public async Task<ActionResult<ApiResponse<RaffleDrawingDto>>> RevealDigit(int id, [FromBody] RaffleRevealDigitRequest request)
    {
        try
        {
            var raffle = await _context.Raffles
                .Include(r => r.Prizes)
                .Include(r => r.Participants)
                .FirstOrDefaultAsync(r => r.RaffleId == id);

            if (raffle == null)
            {
                return NotFound(new ApiResponse<RaffleDrawingDto>
                {
                    Success = false,
                    Message = "Raffle not found"
                });
            }

            if (raffle.Status != "Drawing")
            {
                return BadRequest(new ApiResponse<RaffleDrawingDto>
                {
                    Success = false,
                    Message = "Raffle must be in Drawing status"
                });
            }

            if (request.Digit < 0 || request.Digit > 9)
            {
                return BadRequest(new ApiResponse<RaffleDrawingDto>
                {
                    Success = false,
                    Message = "Digit must be between 0 and 9"
                });
            }

            var currentDigits = raffle.RevealedDigits ?? "";
            if (currentDigits.Length >= raffle.TicketDigits)
            {
                return BadRequest(new ApiResponse<RaffleDrawingDto>
                {
                    Success = false,
                    Message = "All digits have been revealed"
                });
            }

            raffle.RevealedDigits = currentDigits + request.Digit.ToString();
            raffle.UpdatedAt = DateTime.UtcNow;

            // Check if all digits revealed - determine winner
            if (raffle.RevealedDigits.Length == raffle.TicketDigits)
            {
                var winningNumber = int.Parse(raffle.RevealedDigits);
                raffle.WinningNumber = winningNumber;
                raffle.Status = "Completed";

                // Find the winner
                var winner = raffle.Participants.FirstOrDefault(p =>
                    p.IsVerified &&
                    p.PaymentStatus == "Confirmed" &&
                    p.TicketStart.HasValue &&
                    p.TicketEnd.HasValue &&
                    winningNumber >= p.TicketStart.Value &&
                    winningNumber <= p.TicketEnd.Value);

                if (winner != null)
                {
                    winner.IsWinner = true;
                }
            }

            await _context.SaveChangesAsync();

            return await GetDrawingData(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revealing digit for raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<RaffleDrawingDto>
            {
                Success = false,
                Message = "An error occurred while revealing digit"
            });
        }
    }

    // POST: /Raffles/{id}/reset-drawing - Reset the drawing
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/reset-drawing")]
    public async Task<ActionResult<ApiResponse<RaffleDrawingDto>>> ResetDrawing(int id)
    {
        try
        {
            var raffle = await _context.Raffles
                .Include(r => r.Participants)
                .FirstOrDefaultAsync(r => r.RaffleId == id);

            if (raffle == null)
            {
                return NotFound(new ApiResponse<RaffleDrawingDto>
                {
                    Success = false,
                    Message = "Raffle not found"
                });
            }

            raffle.Status = "Active";
            raffle.RevealedDigits = null;
            raffle.WinningNumber = null;
            raffle.UpdatedAt = DateTime.UtcNow;

            // Reset all winners
            foreach (var participant in raffle.Participants)
            {
                participant.IsWinner = false;
            }

            await _context.SaveChangesAsync();

            return await GetDrawingData(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting drawing for raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<RaffleDrawingDto>
            {
                Success = false,
                Message = "An error occurred while resetting drawing"
            });
        }
    }

    // ============ PARTICIPANT MANAGEMENT (Admin) ============

    // GET: /Raffles/{id}/participants - Get all participants
    [Authorize(Roles = "Admin")]
    [HttpGet("{id}/participants")]
    public async Task<ActionResult<ApiResponse<List<RaffleParticipantDto>>>> GetParticipants(int id)
    {
        try
        {
            var raffle = await _context.Raffles.FindAsync(id);
            if (raffle == null)
            {
                return NotFound(new ApiResponse<List<RaffleParticipantDto>>
                {
                    Success = false,
                    Message = "Raffle not found"
                });
            }

            var participants = await _context.RaffleParticipants
                .Where(p => p.RaffleId == id)
                .OrderBy(p => p.TicketStart)
                .ToListAsync();

            var dtos = participants.Select(MapToParticipantDto).ToList();

            return Ok(new ApiResponse<List<RaffleParticipantDto>>
            {
                Success = true,
                Data = dtos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching participants for raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<List<RaffleParticipantDto>>
            {
                Success = false,
                Message = "An error occurred while fetching participants"
            });
        }
    }

    // POST: /Raffles/participants/{participantId}/confirm-payment - Confirm participant payment
    [Authorize(Roles = "Admin")]
    [HttpPost("participants/{participantId}/confirm-payment")]
    public async Task<ActionResult<ApiResponse<RaffleParticipantDto>>> ConfirmPayment(int participantId, [FromBody] RaffleConfirmPaymentRequest request)
    {
        try
        {
            var participant = await _context.RaffleParticipants
                .Include(p => p.Raffle)
                .FirstOrDefaultAsync(p => p.ParticipantId == participantId);

            if (participant == null)
            {
                return NotFound(new ApiResponse<RaffleParticipantDto>
                {
                    Success = false,
                    Message = "Participant not found"
                });
            }

            if (request.Confirm)
            {
                participant.PaymentStatus = "Confirmed";
                participant.PaymentDate = DateTime.UtcNow;
            }
            else
            {
                participant.PaymentStatus = "Rejected";
            }

            participant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<RaffleParticipantDto>
            {
                Success = true,
                Message = request.Confirm ? "Payment confirmed" : "Payment rejected",
                Data = MapToParticipantDto(participant)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming payment for participant {ParticipantId}", participantId);
            return StatusCode(500, new ApiResponse<RaffleParticipantDto>
            {
                Success = false,
                Message = "An error occurred while confirming payment"
            });
        }
    }

    // ============ HELPER METHODS ============

    private RaffleDto MapToRaffleDto(Raffle raffle)
    {
        return new RaffleDto
        {
            RaffleId = raffle.RaffleId,
            Name = raffle.Name,
            Description = raffle.Description,
            ImageUrl = raffle.ImageUrl,
            Status = raffle.Status,
            WinningNumber = raffle.WinningNumber,
            RevealedDigits = raffle.RevealedDigits,
            TicketDigits = raffle.TicketDigits,
            TotalTicketsSold = raffle.TotalTicketsSold,
            TotalRevenue = raffle.TotalRevenue,
            StartDate = raffle.StartDate,
            EndDate = raffle.EndDate,
            DrawingDate = raffle.DrawingDate,
            CreatedBy = raffle.CreatedBy,
            CreatedByName = raffle.CreatedByUser != null
                ? $"{raffle.CreatedByUser.FirstName} {raffle.CreatedByUser.LastName}"
                : null,
            CreatedAt = raffle.CreatedAt,
            UpdatedAt = raffle.UpdatedAt,
            ParticipantCount = raffle.Participants?.Count(p => p.IsVerified) ?? 0,
            Prizes = raffle.Prizes?.OrderBy(p => p.DisplayOrder).Select(MapToPrizeDto).ToList() ?? new List<RafflePrizeDto>(),
            TicketTiers = raffle.TicketTiers?.OrderBy(t => t.DisplayOrder).Select(MapToTierDto).ToList() ?? new List<RaffleTicketTierDto>()
        };
    }

    private RafflePrizeDto MapToPrizeDto(RafflePrize prize)
    {
        return new RafflePrizeDto
        {
            PrizeId = prize.PrizeId,
            RaffleId = prize.RaffleId,
            Name = prize.Name,
            Description = prize.Description,
            ImageUrl = prize.ImageUrl,
            Value = prize.Value,
            DisplayOrder = prize.DisplayOrder,
            IsGrandPrize = prize.IsGrandPrize
        };
    }

    private RaffleTicketTierDto MapToTierDto(RaffleTicketTier tier)
    {
        return new RaffleTicketTierDto
        {
            TierId = tier.TierId,
            RaffleId = tier.RaffleId,
            Name = tier.Name,
            Price = tier.Price,
            TicketCount = tier.TicketCount,
            Description = tier.Description,
            DisplayOrder = tier.DisplayOrder,
            IsActive = tier.IsActive,
            IsFeatured = tier.IsFeatured
        };
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
