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
public class SeatRafflesController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<SeatRafflesController> _logger;

    public SeatRafflesController(CasecDbContext context, ILogger<SeatRafflesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    // ==================== SEAT RAFFLES ====================

    // GET: /SeatRaffles - List all seat raffles
    [Authorize]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<SeatRaffleDto>>>> GetRaffles()
    {
        try
        {
            var raffles = await _context.SeatRaffles
                .Include(r => r.Chart)
                .Include(r => r.Winners.Where(w => !w.IsTestDraw))
                .Include(r => r.Exclusions)
                .Include(r => r.Targets)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var dtos = raffles.Select(r => new SeatRaffleDto
            {
                SeatRaffleId = r.SeatRaffleId,
                ChartId = r.ChartId,
                ChartName = r.Chart?.Name,
                Name = r.Name,
                Description = r.Description,
                Status = r.Status,
                PrizeName = r.PrizeName,
                PrizeValue = r.PrizeValue,
                ExclusionCount = r.Exclusions.Count,
                TargetCount = r.Targets.Count,
                WinnerCount = r.Winners.Count(w => !w.IsTestDraw),
                CreatedAt = r.CreatedAt
            }).ToList();

            return Ok(new ApiResponse<List<SeatRaffleDto>> { Success = true, Data = dtos });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching seat raffles");
            return StatusCode(500, new ApiResponse<List<SeatRaffleDto>> { Success = false, Message = "Error fetching raffles" });
        }
    }

    // GET: /SeatRaffles/{id} - Get raffle details with full settings
    [Authorize]
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<SeatRaffleDetailDto>>> GetRaffle(int id)
    {
        try
        {
            var raffle = await _context.SeatRaffles
                .Include(r => r.Chart)
                    .ThenInclude(c => c.Sections)
                .Include(r => r.Chart)
                    .ThenInclude(c => c.Seats)
                .Include(r => r.Exclusions)
                    .ThenInclude(e => e.Seat)
                .Include(r => r.Targets)
                    .ThenInclude(t => t.Seat)
                .Include(r => r.Winners.OrderBy(w => w.DrawNumber))
                    .ThenInclude(w => w.Seat)
                .FirstOrDefaultAsync(r => r.SeatRaffleId == id);

            if (raffle == null)
                return NotFound(new ApiResponse<SeatRaffleDetailDto> { Success = false, Message = "Raffle not found" });

            var dto = MapToDetailDto(raffle);

            return Ok(new ApiResponse<SeatRaffleDetailDto> { Success = true, Data = dto });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching seat raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<SeatRaffleDetailDto> { Success = false, Message = "Error fetching raffle" });
        }
    }

    // GET: /SeatRaffles/{id}/drawing - Get drawing page data (public for display)
    [AllowAnonymous]
    [HttpGet("{id}/drawing")]
    public async Task<ActionResult<ApiResponse<SeatRaffleDrawingDto>>> GetDrawingData(int id)
    {
        try
        {
            var raffle = await _context.SeatRaffles
                .Include(r => r.Chart)
                    .ThenInclude(c => c.Sections.OrderBy(s => s.DisplayOrder))
                .Include(r => r.Chart)
                    .ThenInclude(c => c.Seats)
                .Include(r => r.Exclusions)
                .Include(r => r.Targets)
                .Include(r => r.Winners.Where(w => !w.IsTestDraw))
                .FirstOrDefaultAsync(r => r.SeatRaffleId == id);

            if (raffle == null)
                return NotFound(new ApiResponse<SeatRaffleDrawingDto> { Success = false, Message = "Raffle not found" });

            var excludedSeatIds = raffle.Exclusions.Select(e => e.SeatId).ToHashSet();
            var targetSeatIds = raffle.Targets.Select(t => t.SeatId).ToHashSet();
            var winnerSeatIds = raffle.Winners.Select(w => w.SeatId).ToHashSet();

            // Build eligible seats list
            var allSeats = raffle.Chart.Seats.ToList();
            var eligibleSeats = allSeats.Where(s =>
            {
                // Exclude NotExist and NotAvailable seats
                if (s.Status == "NotExist" || s.Status == "NotAvailable")
                    return false;

                // If targets specified, seat must be in targets
                if (targetSeatIds.Count > 0 && !targetSeatIds.Contains(s.SeatId))
                    return false;

                // Must not be excluded
                if (excludedSeatIds.Contains(s.SeatId))
                    return false;

                // Must be occupied if required
                if (raffle.RequireOccupied && string.IsNullOrEmpty(s.AttendeeName) && s.Status != "Occupied")
                    return false;

                // Must not have won already (unless repeat winners allowed)
                if (!raffle.AllowRepeatWinners && winnerSeatIds.Contains(s.SeatId))
                    return false;

                return true;
            }).ToList();

            var dto = new SeatRaffleDrawingDto
            {
                SeatRaffleId = raffle.SeatRaffleId,
                Name = raffle.Name,
                Status = raffle.Status,

                // Theme
                BackgroundImageUrl = raffle.BackgroundImageUrl,
                BackgroundColor = raffle.BackgroundColor,
                BackgroundGradient = raffle.BackgroundGradient,
                PrimaryColor = raffle.PrimaryColor,
                SecondaryColor = raffle.SecondaryColor,
                WinnerColor = raffle.WinnerColor,
                TextColor = raffle.TextColor,
                SeatColor = raffle.SeatColor,
                SeatHighlightColor = raffle.SeatHighlightColor,

                // Settings
                AnimationSpeed = raffle.AnimationSpeed,
                AnimationSteps = raffle.AnimationSteps,
                ShowAttendeeName = raffle.ShowAttendeeName,
                ShowAttendeePhone = raffle.ShowAttendeePhone,

                // Prize
                PrizeName = raffle.PrizeName,
                PrizeDescription = raffle.PrizeDescription,
                PrizeImageUrl = raffle.PrizeImageUrl,
                PrizeValue = raffle.PrizeValue,

                // Chart structure
                Sections = raffle.Chart.Sections.Select(s => new SeatingSectionDto
                {
                    SectionId = s.SectionId,
                    Name = s.Name,
                    ShortName = s.ShortName,
                    DisplayOrder = s.DisplayOrder,
                    RowLabels = s.RowLabels,
                    SeatsPerRow = s.SeatsPerRow,
                    StartSeatNumber = s.StartSeatNumber
                }).ToList(),

                // All seats with eligibility info
                Seats = allSeats.Select(s => new SeatRaffleDrawingSeatDto
                {
                    SeatId = s.SeatId,
                    SectionId = s.SectionId,
                    RowLabel = s.RowLabel,
                    SeatNumber = s.SeatNumber,
                    AttendeeName = raffle.ShowAttendeeName ? s.AttendeeName : null,
                    AttendeePhone = raffle.ShowAttendeePhone ? s.AttendeePhone : null,
                    IsEligible = eligibleSeats.Any(e => e.SeatId == s.SeatId),
                    IsExcluded = excludedSeatIds.Contains(s.SeatId),
                    IsTarget = targetSeatIds.Count > 0 && targetSeatIds.Contains(s.SeatId),
                    IsWinner = winnerSeatIds.Contains(s.SeatId),
                    IsOccupied = s.Status == "Occupied" || !string.IsNullOrEmpty(s.AttendeeName)
                }).ToList(),

                // Stats
                TotalSeats = allSeats.Count,
                EligibleSeats = eligibleSeats.Count,
                ExcludedSeats = excludedSeatIds.Count,
                TargetedSeats = targetSeatIds.Count,

                // Previous winners
                Winners = raffle.Winners.Where(w => !w.IsTestDraw).Select(w => new SeatRaffleWinnerDto
                {
                    WinnerId = w.WinnerId,
                    SeatId = w.SeatId,
                    DrawNumber = w.DrawNumber,
                    AttendeeName = w.AttendeeName,
                    SectionName = w.SectionName,
                    RowLabel = w.RowLabel,
                    SeatNumber = w.SeatNumber,
                    DrawnAt = w.DrawnAt
                }).ToList()
            };

            return Ok(new ApiResponse<SeatRaffleDrawingDto> { Success = true, Data = dto });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching drawing data for raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<SeatRaffleDrawingDto> { Success = false, Message = "Error fetching drawing data" });
        }
    }

    // POST: /SeatRaffles - Create raffle
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<SeatRaffleDto>>> CreateRaffle([FromBody] CreateSeatRaffleRequest request)
    {
        try
        {
            var chart = await _context.SeatingCharts.FindAsync(request.ChartId);
            if (chart == null)
                return BadRequest(new ApiResponse<SeatRaffleDto> { Success = false, Message = "Seating chart not found" });

            var raffle = new SeatRaffle
            {
                ChartId = request.ChartId,
                Name = request.Name,
                Description = request.Description,
                Status = "Draft",
                PrizeName = request.PrizeName,
                PrizeDescription = request.PrizeDescription,
                PrizeValue = request.PrizeValue,
                RequireOccupied = request.RequireOccupied ?? true,
                ShowAttendeeName = request.ShowAttendeeName ?? true,
                CreatedBy = GetCurrentUserId()
            };

            _context.SeatRaffles.Add(raffle);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SeatRaffleDto>
            {
                Success = true,
                Data = new SeatRaffleDto
                {
                    SeatRaffleId = raffle.SeatRaffleId,
                    ChartId = raffle.ChartId,
                    Name = raffle.Name,
                    Status = raffle.Status
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating seat raffle");
            return StatusCode(500, new ApiResponse<SeatRaffleDto> { Success = false, Message = "Error creating raffle" });
        }
    }

    // PUT: /SeatRaffles/{id} - Update raffle settings
    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<SeatRaffleDto>>> UpdateRaffle(int id, [FromBody] UpdateSeatRaffleRequest request)
    {
        try
        {
            var raffle = await _context.SeatRaffles.FindAsync(id);
            if (raffle == null)
                return NotFound(new ApiResponse<SeatRaffleDto> { Success = false, Message = "Raffle not found" });

            // Basic info
            if (request.Name != null) raffle.Name = request.Name;
            if (request.Description != null) raffle.Description = request.Description;
            if (request.Status != null) raffle.Status = request.Status;

            // Theme settings
            if (request.BackgroundImageUrl != null) raffle.BackgroundImageUrl = request.BackgroundImageUrl == "" ? null : request.BackgroundImageUrl;
            if (request.BackgroundColor != null) raffle.BackgroundColor = request.BackgroundColor;
            if (request.BackgroundGradient != null) raffle.BackgroundGradient = request.BackgroundGradient == "" ? null : request.BackgroundGradient;
            if (request.PrimaryColor != null) raffle.PrimaryColor = request.PrimaryColor;
            if (request.SecondaryColor != null) raffle.SecondaryColor = request.SecondaryColor;
            if (request.WinnerColor != null) raffle.WinnerColor = request.WinnerColor;
            if (request.TextColor != null) raffle.TextColor = request.TextColor;
            if (request.SeatColor != null) raffle.SeatColor = request.SeatColor;
            if (request.SeatHighlightColor != null) raffle.SeatHighlightColor = request.SeatHighlightColor;

            // Raffle settings
            if (request.RequireOccupied.HasValue) raffle.RequireOccupied = request.RequireOccupied.Value;
            if (request.AllowRepeatWinners.HasValue) raffle.AllowRepeatWinners = request.AllowRepeatWinners.Value;
            if (request.AnimationSpeed.HasValue) raffle.AnimationSpeed = request.AnimationSpeed.Value;
            if (request.AnimationSteps.HasValue) raffle.AnimationSteps = request.AnimationSteps.Value;
            if (request.ShowAttendeeName.HasValue) raffle.ShowAttendeeName = request.ShowAttendeeName.Value;
            if (request.ShowAttendeePhone.HasValue) raffle.ShowAttendeePhone = request.ShowAttendeePhone.Value;

            // Prize info
            if (request.PrizeName != null) raffle.PrizeName = request.PrizeName == "" ? null : request.PrizeName;
            if (request.PrizeDescription != null) raffle.PrizeDescription = request.PrizeDescription == "" ? null : request.PrizeDescription;
            if (request.PrizeImageUrl != null) raffle.PrizeImageUrl = request.PrizeImageUrl == "" ? null : request.PrizeImageUrl;
            if (request.PrizeValue.HasValue) raffle.PrizeValue = request.PrizeValue.Value == 0 ? null : request.PrizeValue;

            raffle.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SeatRaffleDto>
            {
                Success = true,
                Data = new SeatRaffleDto
                {
                    SeatRaffleId = raffle.SeatRaffleId,
                    Name = raffle.Name,
                    Status = raffle.Status
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating seat raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<SeatRaffleDto> { Success = false, Message = "Error updating raffle" });
        }
    }

    // DELETE: /SeatRaffles/{id}
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteRaffle(int id)
    {
        try
        {
            var raffle = await _context.SeatRaffles.FindAsync(id);
            if (raffle == null)
                return NotFound(new ApiResponse<bool> { Success = false, Message = "Raffle not found" });

            _context.SeatRaffles.Remove(raffle);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool> { Success = true, Data = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting seat raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<bool> { Success = false, Message = "Error deleting raffle" });
        }
    }

    // ==================== EXCLUSIONS & TARGETS ====================

    // POST: /SeatRaffles/{id}/exclusions - Add exclusion
    [Authorize]
    [HttpPost("{id}/exclusions")]
    public async Task<ActionResult<ApiResponse<bool>>> AddExclusions(int id, [FromBody] AddSeatExclusionsRequest request)
    {
        try
        {
            var raffle = await _context.SeatRaffles.FindAsync(id);
            if (raffle == null)
                return NotFound(new ApiResponse<bool> { Success = false, Message = "Raffle not found" });

            foreach (var seatId in request.SeatIds)
            {
                var exists = await _context.SeatRaffleExclusions.AnyAsync(e => e.SeatRaffleId == id && e.SeatId == seatId);
                if (!exists)
                {
                    _context.SeatRaffleExclusions.Add(new SeatRaffleExclusion
                    {
                        SeatRaffleId = id,
                        SeatId = seatId,
                        Reason = request.Reason
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new ApiResponse<bool> { Success = true, Data = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding exclusions");
            return StatusCode(500, new ApiResponse<bool> { Success = false, Message = "Error adding exclusions" });
        }
    }

    // DELETE: /SeatRaffles/{id}/exclusions - Remove exclusions
    [Authorize]
    [HttpDelete("{id}/exclusions")]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveExclusions(int id, [FromBody] List<int> seatIds)
    {
        try
        {
            var exclusions = await _context.SeatRaffleExclusions
                .Where(e => e.SeatRaffleId == id && seatIds.Contains(e.SeatId))
                .ToListAsync();

            _context.SeatRaffleExclusions.RemoveRange(exclusions);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool> { Success = true, Data = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing exclusions");
            return StatusCode(500, new ApiResponse<bool> { Success = false, Message = "Error removing exclusions" });
        }
    }

    // POST: /SeatRaffles/{id}/targets - Set targets
    [Authorize]
    [HttpPost("{id}/targets")]
    public async Task<ActionResult<ApiResponse<bool>>> SetTargets(int id, [FromBody] List<int> seatIds)
    {
        try
        {
            var raffle = await _context.SeatRaffles.FindAsync(id);
            if (raffle == null)
                return NotFound(new ApiResponse<bool> { Success = false, Message = "Raffle not found" });

            // Remove existing targets
            var existing = await _context.SeatRaffleTargets.Where(t => t.SeatRaffleId == id).ToListAsync();
            _context.SeatRaffleTargets.RemoveRange(existing);

            // Add new targets
            foreach (var seatId in seatIds)
            {
                _context.SeatRaffleTargets.Add(new SeatRaffleTarget
                {
                    SeatRaffleId = id,
                    SeatId = seatId
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new ApiResponse<bool> { Success = true, Data = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting targets");
            return StatusCode(500, new ApiResponse<bool> { Success = false, Message = "Error setting targets" });
        }
    }

    // DELETE: /SeatRaffles/{id}/targets - Clear all targets
    [Authorize]
    [HttpDelete("{id}/targets")]
    public async Task<ActionResult<ApiResponse<bool>>> ClearTargets(int id)
    {
        try
        {
            var targets = await _context.SeatRaffleTargets.Where(t => t.SeatRaffleId == id).ToListAsync();
            _context.SeatRaffleTargets.RemoveRange(targets);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool> { Success = true, Data = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing targets");
            return StatusCode(500, new ApiResponse<bool> { Success = false, Message = "Error clearing targets" });
        }
    }

    // ==================== DRAWING ====================

    // POST: /SeatRaffles/{id}/draw - Draw a winner
    [Authorize]
    [HttpPost("{id}/draw")]
    public async Task<ActionResult<ApiResponse<SeatRaffleWinnerDto>>> DrawWinner(int id, [FromQuery] bool isTest = false)
    {
        try
        {
            var raffle = await _context.SeatRaffles
                .Include(r => r.Chart)
                    .ThenInclude(c => c.Seats)
                        .ThenInclude(s => s.Section)
                .Include(r => r.Exclusions)
                .Include(r => r.Targets)
                .Include(r => r.Winners)
                .FirstOrDefaultAsync(r => r.SeatRaffleId == id);

            if (raffle == null)
                return NotFound(new ApiResponse<SeatRaffleWinnerDto> { Success = false, Message = "Raffle not found" });

            var excludedSeatIds = raffle.Exclusions.Select(e => e.SeatId).ToHashSet();
            var targetSeatIds = raffle.Targets.Select(t => t.SeatId).ToHashSet();
            var winnerSeatIds = raffle.Winners.Where(w => !w.IsTestDraw).Select(w => w.SeatId).ToHashSet();

            // Get eligible seats
            var eligibleSeats = raffle.Chart.Seats.Where(s =>
            {
                // Exclude NotExist and NotAvailable seats
                if (s.Status == "NotExist" || s.Status == "NotAvailable")
                    return false;
                if (targetSeatIds.Count > 0 && !targetSeatIds.Contains(s.SeatId))
                    return false;
                if (excludedSeatIds.Contains(s.SeatId))
                    return false;
                if (raffle.RequireOccupied && string.IsNullOrEmpty(s.AttendeeName) && s.Status != "Occupied")
                    return false;
                if (!raffle.AllowRepeatWinners && winnerSeatIds.Contains(s.SeatId))
                    return false;
                return true;
            }).ToList();

            if (eligibleSeats.Count == 0)
                return BadRequest(new ApiResponse<SeatRaffleWinnerDto> { Success = false, Message = "No eligible seats remaining" });

            // Random draw
            var random = new Random();
            var winnerSeat = eligibleSeats[random.Next(eligibleSeats.Count)];

            // Record winner
            var drawNumber = raffle.Winners.Count(w => !w.IsTestDraw) + 1;
            var winner = new SeatRaffleWinner
            {
                SeatRaffleId = id,
                SeatId = winnerSeat.SeatId,
                DrawNumber = isTest ? 0 : drawNumber,
                AttendeeName = winnerSeat.AttendeeName,
                AttendeePhone = winnerSeat.AttendeePhone,
                SectionName = winnerSeat.Section?.Name,
                RowLabel = winnerSeat.RowLabel,
                SeatNumber = winnerSeat.SeatNumber,
                IsTestDraw = isTest,
                DrawnBy = GetCurrentUserId()
            };

            _context.SeatRaffleWinners.Add(winner);

            // Update raffle status if not test
            if (!isTest && raffle.Status == "Draft")
            {
                raffle.Status = "Active";
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SeatRaffleWinnerDto>
            {
                Success = true,
                Data = new SeatRaffleWinnerDto
                {
                    WinnerId = winner.WinnerId,
                    SeatId = winner.SeatId,
                    DrawNumber = winner.DrawNumber,
                    AttendeeName = winner.AttendeeName,
                    AttendeePhone = raffle.ShowAttendeePhone ? winner.AttendeePhone : null,
                    SectionName = winner.SectionName,
                    RowLabel = winner.RowLabel,
                    SeatNumber = winner.SeatNumber,
                    IsTestDraw = winner.IsTestDraw,
                    DrawnAt = winner.DrawnAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error drawing winner for raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<SeatRaffleWinnerDto> { Success = false, Message = "Error drawing winner" });
        }
    }

    // POST: /SeatRaffles/{id}/reset - Reset raffle (clear winners)
    [Authorize]
    [HttpPost("{id}/reset")]
    public async Task<ActionResult<ApiResponse<bool>>> ResetRaffle(int id, [FromQuery] bool testOnly = false)
    {
        try
        {
            var winners = await _context.SeatRaffleWinners
                .Where(w => w.SeatRaffleId == id && (!testOnly || w.IsTestDraw))
                .ToListAsync();

            _context.SeatRaffleWinners.RemoveRange(winners);

            if (!testOnly)
            {
                var raffle = await _context.SeatRaffles.FindAsync(id);
                if (raffle != null)
                {
                    raffle.Status = "Draft";
                    raffle.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool> { Success = true, Data = true, Message = $"Cleared {winners.Count} winner(s)" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting raffle {RaffleId}", id);
            return StatusCode(500, new ApiResponse<bool> { Success = false, Message = "Error resetting raffle" });
        }
    }

    private SeatRaffleDetailDto MapToDetailDto(SeatRaffle r)
    {
        return new SeatRaffleDetailDto
        {
            SeatRaffleId = r.SeatRaffleId,
            ChartId = r.ChartId,
            ChartName = r.Chart?.Name,
            Name = r.Name,
            Description = r.Description,
            Status = r.Status,

            BackgroundImageUrl = r.BackgroundImageUrl,
            BackgroundColor = r.BackgroundColor,
            BackgroundGradient = r.BackgroundGradient,
            PrimaryColor = r.PrimaryColor,
            SecondaryColor = r.SecondaryColor,
            WinnerColor = r.WinnerColor,
            TextColor = r.TextColor,
            SeatColor = r.SeatColor,
            SeatHighlightColor = r.SeatHighlightColor,

            RequireOccupied = r.RequireOccupied,
            AllowRepeatWinners = r.AllowRepeatWinners,
            AnimationSpeed = r.AnimationSpeed,
            AnimationSteps = r.AnimationSteps,
            ShowAttendeeName = r.ShowAttendeeName,
            ShowAttendeePhone = r.ShowAttendeePhone,

            PrizeName = r.PrizeName,
            PrizeDescription = r.PrizeDescription,
            PrizeImageUrl = r.PrizeImageUrl,
            PrizeValue = r.PrizeValue,

            ExcludedSeatIds = r.Exclusions.Select(e => e.SeatId).ToList(),
            TargetSeatIds = r.Targets.Select(t => t.SeatId).ToList(),
            Winners = r.Winners.Where(w => !w.IsTestDraw).Select(w => new SeatRaffleWinnerDto
            {
                WinnerId = w.WinnerId,
                SeatId = w.SeatId,
                DrawNumber = w.DrawNumber,
                AttendeeName = w.AttendeeName,
                SectionName = w.SectionName,
                RowLabel = w.RowLabel,
                SeatNumber = w.SeatNumber,
                DrawnAt = w.DrawnAt
            }).ToList(),

            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        };
    }
}
