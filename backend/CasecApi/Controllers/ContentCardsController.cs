using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CasecApi.Data;
using CasecApi.Models;
using CasecApi.Models.DTOs;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
public class ContentCardsController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<ContentCardsController> _logger;

    public ContentCardsController(CasecDbContext context, ILogger<ContentCardsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: /ContentCards - List all cards (admin only)
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ContentCardDto>>>> GetCards(
        [FromQuery] string? entityType = null,
        [FromQuery] int? entityId = null)
    {
        try
        {
            var query = _context.ContentCards.AsQueryable();

            if (!string.IsNullOrEmpty(entityType))
            {
                query = query.Where(c => c.EntityType == entityType);
            }

            if (entityId.HasValue)
            {
                query = query.Where(c => c.EntityId == entityId.Value);
            }

            var cards = await query
                .OrderBy(c => c.EntityType)
                .ThenBy(c => c.EntityId)
                .ThenBy(c => c.DisplayOrder)
                .Select(c => MapToDto(c))
                .ToListAsync();

            return Ok(new ApiResponse<List<ContentCardDto>>
            {
                Success = true,
                Data = cards
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting content cards");
            return StatusCode(500, new ApiResponse<List<ContentCardDto>>
            {
                Success = false,
                Message = "An error occurred while fetching cards"
            });
        }
    }

    // GET: /ContentCards/{id} - Get single card
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ContentCardDto>>> GetCard(int id)
    {
        try
        {
            var card = await _context.ContentCards.FindAsync(id);

            if (card == null)
            {
                return NotFound(new ApiResponse<ContentCardDto>
                {
                    Success = false,
                    Message = "Card not found"
                });
            }

            return Ok(new ApiResponse<ContentCardDto>
            {
                Success = true,
                Data = MapToDto(card)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting card {Id}", id);
            return StatusCode(500, new ApiResponse<ContentCardDto>
            {
                Success = false,
                Message = "An error occurred while fetching the card"
            });
        }
    }

    // GET: /ContentCards/entity/{entityType}/{entityId} - Get cards for a specific entity (public)
    [HttpGet("entity/{entityType}/{entityId}")]
    public async Task<ActionResult<ApiResponse<List<ContentCardDto>>>> GetCardsByEntity(string entityType, int entityId)
    {
        try
        {
            var cards = await _context.ContentCards
                .Where(c => c.EntityType == entityType && c.EntityId == entityId)
                .OrderBy(c => c.DisplayOrder)
                .Select(c => MapToDto(c))
                .ToListAsync();

            return Ok(new ApiResponse<List<ContentCardDto>>
            {
                Success = true,
                Data = cards
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cards for {EntityType}/{EntityId}", entityType, entityId);
            return StatusCode(500, new ApiResponse<List<ContentCardDto>>
            {
                Success = false,
                Message = "An error occurred while fetching cards"
            });
        }
    }

    // POST: /ContentCards - Create new card (admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ContentCardDto>>> CreateCard([FromBody] CreateContentCardRequest request)
    {
        try
        {
            // Validate entity type
            if (request.EntityType != "ProgramItem" && request.EntityType != "Performer")
            {
                return BadRequest(new ApiResponse<ContentCardDto>
                {
                    Success = false,
                    Message = "EntityType must be 'ProgramItem' or 'Performer'"
                });
            }

            // Validate media type
            if (request.MediaType != "image" && request.MediaType != "video")
            {
                return BadRequest(new ApiResponse<ContentCardDto>
                {
                    Success = false,
                    Message = "MediaType must be 'image' or 'video'"
                });
            }

            // Validate layout type
            var validLayouts = new[] { "left", "right", "top", "bottom", "overlay", "fullwidth" };
            if (!validLayouts.Contains(request.LayoutType))
            {
                return BadRequest(new ApiResponse<ContentCardDto>
                {
                    Success = false,
                    Message = "LayoutType must be one of: left, right, top, bottom, overlay, fullwidth"
                });
            }

            var card = new ContentCard
            {
                EntityType = request.EntityType,
                EntityId = request.EntityId,
                TitleZh = request.TitleZh,
                TitleEn = request.TitleEn,
                BodyTextZh = request.BodyTextZh,
                BodyTextEn = request.BodyTextEn,
                MediaUrl = request.MediaUrl,
                MediaType = request.MediaType,
                LayoutType = request.LayoutType,
                DisplayOrder = request.DisplayOrder,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ContentCards.Add(card);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCard), new { id = card.CardId }, new ApiResponse<ContentCardDto>
            {
                Success = true,
                Data = MapToDto(card),
                Message = "Card created successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating card");
            return StatusCode(500, new ApiResponse<ContentCardDto>
            {
                Success = false,
                Message = "An error occurred while creating the card"
            });
        }
    }

    // PUT: /ContentCards/{id} - Update card (admin only)
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ContentCardDto>>> UpdateCard(int id, [FromBody] UpdateContentCardRequest request)
    {
        try
        {
            var card = await _context.ContentCards.FindAsync(id);

            if (card == null)
            {
                return NotFound(new ApiResponse<ContentCardDto>
                {
                    Success = false,
                    Message = "Card not found"
                });
            }

            // Update fields if provided
            if (request.TitleZh != null) card.TitleZh = request.TitleZh;
            if (request.TitleEn != null) card.TitleEn = request.TitleEn;
            if (request.BodyTextZh != null) card.BodyTextZh = request.BodyTextZh;
            if (request.BodyTextEn != null) card.BodyTextEn = request.BodyTextEn;
            if (request.MediaUrl != null) card.MediaUrl = request.MediaUrl;

            if (request.MediaType != null)
            {
                if (request.MediaType != "image" && request.MediaType != "video")
                {
                    return BadRequest(new ApiResponse<ContentCardDto>
                    {
                        Success = false,
                        Message = "MediaType must be 'image' or 'video'"
                    });
                }
                card.MediaType = request.MediaType;
            }

            if (request.LayoutType != null)
            {
                var validLayouts = new[] { "left", "right", "top", "bottom", "overlay", "fullwidth" };
                if (!validLayouts.Contains(request.LayoutType))
                {
                    return BadRequest(new ApiResponse<ContentCardDto>
                    {
                        Success = false,
                        Message = "LayoutType must be one of: left, right, top, bottom, overlay, fullwidth"
                    });
                }
                card.LayoutType = request.LayoutType;
            }

            if (request.DisplayOrder.HasValue) card.DisplayOrder = request.DisplayOrder.Value;

            card.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<ContentCardDto>
            {
                Success = true,
                Data = MapToDto(card),
                Message = "Card updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating card {Id}", id);
            return StatusCode(500, new ApiResponse<ContentCardDto>
            {
                Success = false,
                Message = "An error occurred while updating the card"
            });
        }
    }

    // DELETE: /ContentCards/{id} - Delete card (admin only)
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteCard(int id)
    {
        try
        {
            var card = await _context.ContentCards.FindAsync(id);

            if (card == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Card not found"
                });
            }

            _context.ContentCards.Remove(card);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Card deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting card {Id}", id);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting the card"
            });
        }
    }

    // GET: /ContentCards/performers - Get all performers with their card counts
    [Authorize(Roles = "Admin")]
    [HttpGet("performers")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetPerformersWithCardCounts()
    {
        try
        {
            var performers = await _context.Performers
                .Where(p => p.IsActive)
                .Select(p => new
                {
                    p.PerformerId,
                    p.Name,
                    p.ChineseName,
                    p.EnglishName,
                    p.PhotoUrl,
                    CardCount = _context.ContentCards.Count(c => c.EntityType == "Performer" && c.EntityId == p.PerformerId)
                })
                .OrderBy(p => p.Name)
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Data = performers.Cast<object>().ToList()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting performers with card counts");
            return StatusCode(500, new ApiResponse<List<object>>
            {
                Success = false,
                Message = "An error occurred while fetching performers"
            });
        }
    }

    // GET: /ContentCards/programitems - Get all program items with their card counts
    [Authorize(Roles = "Admin")]
    [HttpGet("programitems")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetProgramItemsWithCardCounts()
    {
        try
        {
            var items = await _context.ProgramItems
                .Include(i => i.Section)
                    .ThenInclude(s => s.Program)
                .Select(i => new
                {
                    i.ItemId,
                    i.Title,
                    i.PerformanceType,
                    i.PerformerNames,
                    i.PerformerNames2,
                    ProgramTitle = i.Section != null && i.Section.Program != null ? i.Section.Program.Title : null,
                    SectionTitle = i.Section != null ? i.Section.Title : null,
                    CardCount = _context.ContentCards.Count(c => c.EntityType == "ProgramItem" && c.EntityId == i.ItemId)
                })
                .OrderBy(i => i.ProgramTitle)
                .ThenBy(i => i.SectionTitle)
                .ThenBy(i => i.Title)
                .ToListAsync();

            return Ok(new ApiResponse<List<object>>
            {
                Success = true,
                Data = items.Cast<object>().ToList()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting program items with card counts");
            return StatusCode(500, new ApiResponse<List<object>>
            {
                Success = false,
                Message = "An error occurred while fetching program items"
            });
        }
    }

    private static ContentCardDto MapToDto(ContentCard card)
    {
        return new ContentCardDto
        {
            CardId = card.CardId,
            EntityType = card.EntityType,
            EntityId = card.EntityId,
            TitleZh = card.TitleZh,
            TitleEn = card.TitleEn,
            BodyTextZh = card.BodyTextZh,
            BodyTextEn = card.BodyTextEn,
            MediaUrl = card.MediaUrl,
            MediaType = card.MediaType,
            LayoutType = card.LayoutType,
            DisplayOrder = card.DisplayOrder,
            CreatedAt = card.CreatedAt,
            UpdatedAt = card.UpdatedAt
        };
    }
}
