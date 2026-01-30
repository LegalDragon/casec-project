using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CasecApi.Data;
using CasecApi.Models;
using CasecApi.Models.DTOs;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
[AllowAnonymous]
public class ProgramRatingsController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<ProgramRatingsController> _logger;

    public ProgramRatingsController(CasecDbContext context, ILogger<ProgramRatingsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // POST: /ProgramRatings/rate — Submit or update a rating
    [HttpPost("rate")]
    public async Task<ActionResult<ApiResponse<ProgramRatingDto>>> SubmitRating([FromBody] SubmitRatingRequest request)
    {
        try
        {
            // Validate
            if (string.IsNullOrWhiteSpace(request.PhoneNumber))
                return BadRequest(new ApiResponse<ProgramRatingDto> { Success = false, Message = "Phone number is required" });

            if (request.Rating < 1 || request.Rating > 5)
                return BadRequest(new ApiResponse<ProgramRatingDto> { Success = false, Message = "Rating must be between 1 and 5" });

            if (request.EventProgramId <= 0)
                return BadRequest(new ApiResponse<ProgramRatingDto> { Success = false, Message = "Event program ID is required" });

            var phone = request.PhoneNumber.Trim();

            // Check for existing rating (dedup by phone + programItemId)
            ProgramRating? existing;
            if (request.ProgramItemId.HasValue)
            {
                existing = await _context.ProgramRatings
                    .FirstOrDefaultAsync(r =>
                        r.ProgramItemId == request.ProgramItemId.Value &&
                        r.PhoneNumber == phone);
            }
            else
            {
                // Overall event rating (ProgramItemId is null)
                existing = await _context.ProgramRatings
                    .FirstOrDefaultAsync(r =>
                        r.EventProgramId == request.EventProgramId &&
                        r.ProgramItemId == null &&
                        r.PhoneNumber == phone);
            }

            if (existing != null)
            {
                // Update existing rating
                existing.Rating = request.Rating;
                existing.Comment = request.Comment?.Trim();
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new rating
                existing = new ProgramRating
                {
                    EventProgramId = request.EventProgramId,
                    ProgramItemId = request.ProgramItemId,
                    PhoneNumber = phone,
                    Rating = request.Rating,
                    Comment = request.Comment?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ProgramRatings.Add(existing);
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<ProgramRatingDto>
            {
                Success = true,
                Message = "Rating submitted successfully",
                Data = new ProgramRatingDto
                {
                    ProgramRatingId = existing.ProgramRatingId,
                    EventProgramId = existing.EventProgramId,
                    ProgramItemId = existing.ProgramItemId,
                    PhoneNumber = existing.PhoneNumber,
                    Rating = existing.Rating,
                    Comment = existing.Comment,
                    CreatedAt = existing.CreatedAt,
                    UpdatedAt = existing.UpdatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting program rating");
            return StatusCode(500, new ApiResponse<ProgramRatingDto>
            {
                Success = false,
                Message = "An error occurred while submitting the rating"
            });
        }
    }

    // GET: /ProgramRatings/event/{eventProgramId} — Aggregate ratings for all items in a program
    [HttpGet("event/{eventProgramId}")]
    public async Task<ActionResult<ApiResponse<EventRatingsDto>>> GetEventRatings(int eventProgramId, [FromQuery] string? phone = null)
    {
        try
        {
            var ratings = await _context.ProgramRatings
                .Where(r => r.EventProgramId == eventProgramId)
                .ToListAsync();

            // Group by ProgramItemId to get aggregates per item
            var itemGroups = ratings
                .Where(r => r.ProgramItemId.HasValue)
                .GroupBy(r => r.ProgramItemId!.Value)
                .Select(g => new ItemRatingAggregateDto
                {
                    ProgramItemId = g.Key,
                    AverageRating = Math.Round(g.Average(r => r.Rating), 2),
                    TotalRatings = g.Count(),
                    Distribution = Enumerable.Range(1, 5)
                        .Select(star => new RatingDistributionDto
                        {
                            Stars = star,
                            Count = g.Count(r => r.Rating == star)
                        }).ToList()
                })
                .ToList();

            // Overall event rating (ProgramItemId is null)
            var overallRatings = ratings.Where(r => !r.ProgramItemId.HasValue).ToList();
            ItemRatingAggregateDto? overall = null;
            if (overallRatings.Any())
            {
                overall = new ItemRatingAggregateDto
                {
                    ProgramItemId = null,
                    AverageRating = Math.Round(overallRatings.Average(r => r.Rating), 2),
                    TotalRatings = overallRatings.Count,
                    Distribution = Enumerable.Range(1, 5)
                        .Select(star => new RatingDistributionDto
                        {
                            Stars = star,
                            Count = overallRatings.Count(r => r.Rating == star)
                        }).ToList()
                };
            }

            // If phone is provided, include user's own ratings
            List<ProgramRatingDto>? myRatings = null;
            if (!string.IsNullOrWhiteSpace(phone))
            {
                var phoneTrimmed = phone.Trim();
                myRatings = ratings
                    .Where(r => r.PhoneNumber == phoneTrimmed)
                    .Select(r => new ProgramRatingDto
                    {
                        ProgramRatingId = r.ProgramRatingId,
                        EventProgramId = r.EventProgramId,
                        ProgramItemId = r.ProgramItemId,
                        PhoneNumber = r.PhoneNumber,
                        Rating = r.Rating,
                        Comment = r.Comment,
                        CreatedAt = r.CreatedAt,
                        UpdatedAt = r.UpdatedAt
                    })
                    .ToList();
            }

            return Ok(new ApiResponse<EventRatingsDto>
            {
                Success = true,
                Data = new EventRatingsDto
                {
                    EventProgramId = eventProgramId,
                    OverallRating = overall,
                    ItemRatings = itemGroups,
                    MyRatings = myRatings
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event ratings for program {EventProgramId}", eventProgramId);
            return StatusCode(500, new ApiResponse<EventRatingsDto>
            {
                Success = false,
                Message = "An error occurred while fetching ratings"
            });
        }
    }

    // GET: /ProgramRatings/item/{programItemId} — Ratings for a single item
    [HttpGet("item/{programItemId}")]
    public async Task<ActionResult<ApiResponse<ItemRatingAggregateDto>>> GetItemRatings(int programItemId)
    {
        try
        {
            var ratings = await _context.ProgramRatings
                .Where(r => r.ProgramItemId == programItemId)
                .ToListAsync();

            if (!ratings.Any())
            {
                return Ok(new ApiResponse<ItemRatingAggregateDto>
                {
                    Success = true,
                    Data = new ItemRatingAggregateDto
                    {
                        ProgramItemId = programItemId,
                        AverageRating = 0,
                        TotalRatings = 0,
                        Distribution = Enumerable.Range(1, 5)
                            .Select(star => new RatingDistributionDto { Stars = star, Count = 0 })
                            .ToList()
                    }
                });
            }

            return Ok(new ApiResponse<ItemRatingAggregateDto>
            {
                Success = true,
                Data = new ItemRatingAggregateDto
                {
                    ProgramItemId = programItemId,
                    AverageRating = Math.Round(ratings.Average(r => r.Rating), 2),
                    TotalRatings = ratings.Count,
                    Distribution = Enumerable.Range(1, 5)
                        .Select(star => new RatingDistributionDto
                        {
                            Stars = star,
                            Count = ratings.Count(r => r.Rating == star)
                        }).ToList()
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting item ratings for item {ProgramItemId}", programItemId);
            return StatusCode(500, new ApiResponse<ItemRatingAggregateDto>
            {
                Success = false,
                Message = "An error occurred while fetching item ratings"
            });
        }
    }
}

// DTOs for ProgramRatings
public class SubmitRatingRequest
{
    public int EventProgramId { get; set; }
    public int? ProgramItemId { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

public class ProgramRatingDto
{
    public int ProgramRatingId { get; set; }
    public int EventProgramId { get; set; }
    public int? ProgramItemId { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class EventRatingsDto
{
    public int EventProgramId { get; set; }
    public ItemRatingAggregateDto? OverallRating { get; set; }
    public List<ItemRatingAggregateDto> ItemRatings { get; set; } = new();
    public List<ProgramRatingDto>? MyRatings { get; set; }
}

public class ItemRatingAggregateDto
{
    public int? ProgramItemId { get; set; }
    public double AverageRating { get; set; }
    public int TotalRatings { get; set; }
    public List<RatingDistributionDto> Distribution { get; set; } = new();
}

public class RatingDistributionDto
{
    public int Stars { get; set; }
    public int Count { get; set; }
}
