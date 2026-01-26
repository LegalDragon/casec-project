using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CasecApi.Data;
using CasecApi.Models;
using CasecApi.Models.DTOs;
using System.Text.Json;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
public class EventProgramsController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<EventProgramsController> _logger;

    public EventProgramsController(CasecDbContext context, ILogger<EventProgramsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: /EventPrograms - List all programs (public: only published, admin: all)
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<EventProgramListDto>>>> GetPrograms([FromQuery] bool includeAll = false)
    {
        try
        {
            var isAdmin = User.IsInRole("Admin");

            var query = _context.EventPrograms
                .Include(p => p.Sections)
                    .ThenInclude(s => s.Items)
                .AsQueryable();

            // Non-admins only see published programs
            if (!isAdmin || !includeAll)
            {
                query = query.Where(p => p.Status == "Published");
            }

            var programs = await query
                .OrderByDescending(p => p.IsFeatured)
                .ThenByDescending(p => p.EventDate)
                .ThenByDescending(p => p.CreatedAt)
                .Select(p => new EventProgramListDto
                {
                    ProgramId = p.ProgramId,
                    Title = p.Title,
                    Subtitle = p.Subtitle,
                    ImageUrl = p.ImageUrl,
                    EventDate = p.EventDate,
                    Venue = p.Venue,
                    Status = p.Status,
                    IsFeatured = p.IsFeatured,
                    Slug = p.Slug,
                    SectionCount = p.Sections.Count,
                    ItemCount = p.Sections.SelectMany(s => s.Items).Count(),
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<EventProgramListDto>>
            {
                Success = true,
                Data = programs
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting event programs");
            return StatusCode(500, new ApiResponse<List<EventProgramListDto>>
            {
                Success = false,
                Message = "An error occurred while fetching programs"
            });
        }
    }

    // GET: /EventPrograms/{idOrSlug} - Get single program by ID or slug
    [HttpGet("{idOrSlug}")]
    public async Task<ActionResult<ApiResponse<EventProgramDto>>> GetProgram(string idOrSlug)
    {
        try
        {
            var isAdmin = User.IsInRole("Admin");

            EventProgram? program;

            if (int.TryParse(idOrSlug, out int id))
            {
                program = await _context.EventPrograms
                    .Include(p => p.Sections.OrderBy(s => s.DisplayOrder))
                        .ThenInclude(s => s.Items.OrderBy(i => i.DisplayOrder))
                            .ThenInclude(i => i.Performers)
                                .ThenInclude(ip => ip.Performer)
                    .FirstOrDefaultAsync(p => p.ProgramId == id);
            }
            else
            {
                program = await _context.EventPrograms
                    .Include(p => p.Sections.OrderBy(s => s.DisplayOrder))
                        .ThenInclude(s => s.Items.OrderBy(i => i.DisplayOrder))
                            .ThenInclude(i => i.Performers)
                                .ThenInclude(ip => ip.Performer)
                    .FirstOrDefaultAsync(p => p.Slug == idOrSlug);
            }

            if (program == null)
            {
                return NotFound(new ApiResponse<EventProgramDto>
                {
                    Success = false,
                    Message = "Program not found"
                });
            }

            // Non-admins can only see published programs
            if (!isAdmin && program.Status != "Published")
            {
                return NotFound(new ApiResponse<EventProgramDto>
                {
                    Success = false,
                    Message = "Program not found"
                });
            }

            var dto = MapToDto(program);

            return Ok(new ApiResponse<EventProgramDto>
            {
                Success = true,
                Data = dto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting program {IdOrSlug}", idOrSlug);
            return StatusCode(500, new ApiResponse<EventProgramDto>
            {
                Success = false,
                Message = "An error occurred while fetching the program"
            });
        }
    }

    // POST: /EventPrograms - Create new program (admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<EventProgramDto>>> CreateProgram([FromBody] CreateEventProgramRequest request)
    {
        try
        {
            // Generate slug if not provided
            var slug = request.Slug ?? GenerateSlug(request.Title);

            // Ensure slug is unique
            var existingSlug = await _context.EventPrograms.AnyAsync(p => p.Slug == slug);
            if (existingSlug)
            {
                slug = $"{slug}-{DateTime.UtcNow.Ticks}";
            }

            var program = new EventProgram
            {
                Title = request.Title,
                Subtitle = request.Subtitle,
                Description = request.Description,
                ImageUrl = request.ImageUrl,
                EventDate = request.EventDate,
                Venue = request.Venue,
                VenueAddress = request.VenueAddress,
                SlideShowIds = request.SlideShowIds != null ? JsonSerializer.Serialize(request.SlideShowIds) : null,
                Slug = slug,
                Status = "Draft",
                CreatedBy = GetCurrentUserId(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.EventPrograms.Add(program);
            await _context.SaveChangesAsync();

            var dto = MapToDto(program);

            return CreatedAtAction(nameof(GetProgram), new { idOrSlug = program.ProgramId }, new ApiResponse<EventProgramDto>
            {
                Success = true,
                Data = dto,
                Message = "Program created successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating program");
            return StatusCode(500, new ApiResponse<EventProgramDto>
            {
                Success = false,
                Message = "An error occurred while creating the program"
            });
        }
    }

    // PUT: /EventPrograms/{id} - Update program (admin only)
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<EventProgramDto>>> UpdateProgram(int id, [FromBody] UpdateEventProgramRequest request)
    {
        try
        {
            var program = await _context.EventPrograms
                .Include(p => p.Sections)
                    .ThenInclude(s => s.Items)
                .FirstOrDefaultAsync(p => p.ProgramId == id);

            if (program == null)
            {
                return NotFound(new ApiResponse<EventProgramDto>
                {
                    Success = false,
                    Message = "Program not found"
                });
            }

            if (request.Title != null) program.Title = request.Title;
            if (request.Subtitle != null) program.Subtitle = request.Subtitle;
            if (request.Description != null) program.Description = request.Description;
            if (request.ImageUrl != null) program.ImageUrl = request.ImageUrl;
            if (request.EventDate.HasValue) program.EventDate = request.EventDate;
            if (request.Venue != null) program.Venue = request.Venue;
            if (request.VenueAddress != null) program.VenueAddress = request.VenueAddress;
            if (request.SlideShowIds != null) program.SlideShowIds = JsonSerializer.Serialize(request.SlideShowIds);
            if (request.Status != null) program.Status = request.Status;
            if (request.IsFeatured.HasValue) program.IsFeatured = request.IsFeatured.Value;
            if (request.Slug != null)
            {
                // Check if new slug is unique
                var existingSlug = await _context.EventPrograms.AnyAsync(p => p.Slug == request.Slug && p.ProgramId != id);
                if (existingSlug)
                {
                    return BadRequest(new ApiResponse<EventProgramDto>
                    {
                        Success = false,
                        Message = "Slug already exists"
                    });
                }
                program.Slug = request.Slug;
            }

            program.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var dto = MapToDto(program);

            return Ok(new ApiResponse<EventProgramDto>
            {
                Success = true,
                Data = dto,
                Message = "Program updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating program {Id}", id);
            return StatusCode(500, new ApiResponse<EventProgramDto>
            {
                Success = false,
                Message = "An error occurred while updating the program"
            });
        }
    }

    // DELETE: /EventPrograms/{id} - Delete program (admin only)
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteProgram(int id)
    {
        try
        {
            var program = await _context.EventPrograms.FindAsync(id);
            if (program == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Program not found"
                });
            }

            _context.EventPrograms.Remove(program);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = true,
                Message = "Program deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting program {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting the program"
            });
        }
    }

    // ============ SECTION ENDPOINTS ============

    // POST: /EventPrograms/{programId}/sections - Add section to program
    [Authorize(Roles = "Admin")]
    [HttpPost("{programId}/sections")]
    public async Task<ActionResult<ApiResponse<ProgramSectionDto>>> CreateSection(int programId, [FromBody] CreateProgramSectionRequest request)
    {
        try
        {
            var program = await _context.EventPrograms.FindAsync(programId);
            if (program == null)
            {
                return NotFound(new ApiResponse<ProgramSectionDto>
                {
                    Success = false,
                    Message = "Program not found"
                });
            }

            var section = new ProgramSection
            {
                ProgramId = programId,
                Title = request.Title,
                Subtitle = request.Subtitle,
                Description = request.Description,
                DisplayOrder = request.DisplayOrder,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ProgramSections.Add(section);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<ProgramSectionDto>
            {
                Success = true,
                Data = MapSectionToDto(section),
                Message = "Section created successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating section for program {ProgramId}", programId);
            return StatusCode(500, new ApiResponse<ProgramSectionDto>
            {
                Success = false,
                Message = "An error occurred while creating the section"
            });
        }
    }

    // PUT: /EventPrograms/sections/{sectionId} - Update section
    [Authorize(Roles = "Admin")]
    [HttpPut("sections/{sectionId}")]
    public async Task<ActionResult<ApiResponse<ProgramSectionDto>>> UpdateSection(int sectionId, [FromBody] UpdateProgramSectionRequest request)
    {
        try
        {
            var section = await _context.ProgramSections
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.SectionId == sectionId);

            if (section == null)
            {
                return NotFound(new ApiResponse<ProgramSectionDto>
                {
                    Success = false,
                    Message = "Section not found"
                });
            }

            if (request.Title != null) section.Title = request.Title;
            if (request.Subtitle != null) section.Subtitle = request.Subtitle;
            if (request.Description != null) section.Description = request.Description;
            if (request.DisplayOrder.HasValue) section.DisplayOrder = request.DisplayOrder.Value;

            section.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<ProgramSectionDto>
            {
                Success = true,
                Data = MapSectionToDto(section),
                Message = "Section updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating section {SectionId}", sectionId);
            return StatusCode(500, new ApiResponse<ProgramSectionDto>
            {
                Success = false,
                Message = "An error occurred while updating the section"
            });
        }
    }

    // DELETE: /EventPrograms/sections/{sectionId} - Delete section
    [Authorize(Roles = "Admin")]
    [HttpDelete("sections/{sectionId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSection(int sectionId)
    {
        try
        {
            var section = await _context.ProgramSections.FindAsync(sectionId);
            if (section == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Section not found"
                });
            }

            _context.ProgramSections.Remove(section);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = true,
                Message = "Section deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting section {SectionId}", sectionId);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting the section"
            });
        }
    }

    // ============ ITEM ENDPOINTS ============

    // POST: /EventPrograms/sections/{sectionId}/items - Add item to section
    [Authorize(Roles = "Admin")]
    [HttpPost("sections/{sectionId}/items")]
    public async Task<ActionResult<ApiResponse<ProgramItemDto>>> CreateItem(int sectionId, [FromBody] CreateProgramItemRequest request)
    {
        try
        {
            var section = await _context.ProgramSections.FindAsync(sectionId);
            if (section == null)
            {
                return NotFound(new ApiResponse<ProgramItemDto>
                {
                    Success = false,
                    Message = "Section not found"
                });
            }

            var item = new ProgramItem
            {
                SectionId = sectionId,
                ItemNumber = request.ItemNumber,
                Title = request.Title,
                PerformanceType = request.PerformanceType,
                PerformerNames = request.PerformerNames,
                Description = request.Description,
                ImageUrl = request.ImageUrl,
                ContentPageId = request.ContentPageId,
                DisplayOrder = request.DisplayOrder,
                DurationMinutes = request.DurationMinutes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ProgramItems.Add(item);
            await _context.SaveChangesAsync();

            // Add performers if specified
            if (request.PerformerIds != null && request.PerformerIds.Count > 0)
            {
                for (int i = 0; i < request.PerformerIds.Count; i++)
                {
                    _context.ProgramItemPerformers.Add(new ProgramItemPerformer
                    {
                        ItemId = item.ItemId,
                        PerformerId = request.PerformerIds[i],
                        DisplayOrder = i
                    });
                }
                await _context.SaveChangesAsync();
            }

            return Ok(new ApiResponse<ProgramItemDto>
            {
                Success = true,
                Data = MapItemToDto(item),
                Message = "Item created successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating item for section {SectionId}", sectionId);
            return StatusCode(500, new ApiResponse<ProgramItemDto>
            {
                Success = false,
                Message = "An error occurred while creating the item"
            });
        }
    }

    // PUT: /EventPrograms/items/{itemId} - Update item
    [Authorize(Roles = "Admin")]
    [HttpPut("items/{itemId}")]
    public async Task<ActionResult<ApiResponse<ProgramItemDto>>> UpdateItem(int itemId, [FromBody] UpdateProgramItemRequest request)
    {
        try
        {
            var item = await _context.ProgramItems
                .Include(i => i.Performers)
                    .ThenInclude(ip => ip.Performer)
                .FirstOrDefaultAsync(i => i.ItemId == itemId);

            if (item == null)
            {
                return NotFound(new ApiResponse<ProgramItemDto>
                {
                    Success = false,
                    Message = "Item not found"
                });
            }

            if (request.ItemNumber.HasValue) item.ItemNumber = request.ItemNumber.Value;
            if (request.Title != null) item.Title = request.Title;
            if (request.PerformanceType != null) item.PerformanceType = request.PerformanceType;
            if (request.PerformerNames != null) item.PerformerNames = request.PerformerNames;
            if (request.Description != null) item.Description = request.Description;
            if (request.ImageUrl != null) item.ImageUrl = request.ImageUrl;
            if (request.ContentPageId.HasValue) item.ContentPageId = request.ContentPageId;
            if (request.DisplayOrder.HasValue) item.DisplayOrder = request.DisplayOrder.Value;
            if (request.DurationMinutes.HasValue) item.DurationMinutes = request.DurationMinutes;

            // Update performers if specified
            if (request.PerformerIds != null)
            {
                // Remove existing performers
                var existingPerformers = await _context.ProgramItemPerformers
                    .Where(ip => ip.ItemId == itemId)
                    .ToListAsync();
                _context.ProgramItemPerformers.RemoveRange(existingPerformers);

                // Add new performers
                for (int i = 0; i < request.PerformerIds.Count; i++)
                {
                    _context.ProgramItemPerformers.Add(new ProgramItemPerformer
                    {
                        ItemId = itemId,
                        PerformerId = request.PerformerIds[i],
                        DisplayOrder = i
                    });
                }
            }

            item.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Reload with performers
            item = await _context.ProgramItems
                .Include(i => i.Performers)
                    .ThenInclude(ip => ip.Performer)
                .FirstOrDefaultAsync(i => i.ItemId == itemId);

            return Ok(new ApiResponse<ProgramItemDto>
            {
                Success = true,
                Data = MapItemToDto(item!),
                Message = "Item updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating item {ItemId}", itemId);
            return StatusCode(500, new ApiResponse<ProgramItemDto>
            {
                Success = false,
                Message = "An error occurred while updating the item"
            });
        }
    }

    // DELETE: /EventPrograms/items/{itemId} - Delete item
    [Authorize(Roles = "Admin")]
    [HttpDelete("items/{itemId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteItem(int itemId)
    {
        try
        {
            var item = await _context.ProgramItems.FindAsync(itemId);
            if (item == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Item not found"
                });
            }

            _context.ProgramItems.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = true,
                Message = "Item deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting item {ItemId}", itemId);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting the item"
            });
        }
    }

    // ============ PERFORMER ENDPOINTS ============

    // GET: /EventPrograms/performers - List all performers
    [HttpGet("performers")]
    public async Task<ActionResult<ApiResponse<List<PerformerDto>>>> GetPerformers()
    {
        try
        {
            var performers = await _context.Performers
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .Select(p => new PerformerDto
                {
                    PerformerId = p.PerformerId,
                    Name = p.Name,
                    ChineseName = p.ChineseName,
                    EnglishName = p.EnglishName,
                    Bio = p.Bio,
                    PhotoUrl = p.PhotoUrl,
                    Website = p.Website,
                    Instagram = p.Instagram,
                    YouTube = p.YouTube,
                    ContentPageId = p.ContentPageId,
                    IsActive = p.IsActive
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<PerformerDto>>
            {
                Success = true,
                Data = performers
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting performers");
            return StatusCode(500, new ApiResponse<List<PerformerDto>>
            {
                Success = false,
                Message = "An error occurred while fetching performers"
            });
        }
    }

    // POST: /EventPrograms/performers - Create performer (admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost("performers")]
    public async Task<ActionResult<ApiResponse<PerformerDto>>> CreatePerformer([FromBody] CreatePerformerRequest request)
    {
        try
        {
            var performer = new Performer
            {
                Name = request.Name,
                ChineseName = request.ChineseName,
                EnglishName = request.EnglishName,
                Bio = request.Bio,
                PhotoUrl = request.PhotoUrl,
                Website = request.Website,
                Instagram = request.Instagram,
                YouTube = request.YouTube,
                ContentPageId = request.ContentPageId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Performers.Add(performer);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<PerformerDto>
            {
                Success = true,
                Data = MapPerformerToDto(performer),
                Message = "Performer created successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating performer");
            return StatusCode(500, new ApiResponse<PerformerDto>
            {
                Success = false,
                Message = "An error occurred while creating the performer"
            });
        }
    }

    // PUT: /EventPrograms/performers/{performerId} - Update performer (admin only)
    [Authorize(Roles = "Admin")]
    [HttpPut("performers/{performerId}")]
    public async Task<ActionResult<ApiResponse<PerformerDto>>> UpdatePerformer(int performerId, [FromBody] UpdatePerformerRequest request)
    {
        try
        {
            var performer = await _context.Performers.FindAsync(performerId);
            if (performer == null)
            {
                return NotFound(new ApiResponse<PerformerDto>
                {
                    Success = false,
                    Message = "Performer not found"
                });
            }

            if (request.Name != null) performer.Name = request.Name;
            if (request.ChineseName != null) performer.ChineseName = request.ChineseName;
            if (request.EnglishName != null) performer.EnglishName = request.EnglishName;
            if (request.Bio != null) performer.Bio = request.Bio;
            if (request.PhotoUrl != null) performer.PhotoUrl = request.PhotoUrl;
            if (request.Website != null) performer.Website = request.Website;
            if (request.Instagram != null) performer.Instagram = request.Instagram;
            if (request.YouTube != null) performer.YouTube = request.YouTube;
            if (request.ContentPageId.HasValue) performer.ContentPageId = request.ContentPageId;
            if (request.IsActive.HasValue) performer.IsActive = request.IsActive.Value;

            performer.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<PerformerDto>
            {
                Success = true,
                Data = MapPerformerToDto(performer),
                Message = "Performer updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating performer {PerformerId}", performerId);
            return StatusCode(500, new ApiResponse<PerformerDto>
            {
                Success = false,
                Message = "An error occurred while updating the performer"
            });
        }
    }

    // ============ HELPER METHODS ============

    private EventProgramDto MapToDto(EventProgram program)
    {
        List<int>? slideShowIds = null;
        if (!string.IsNullOrEmpty(program.SlideShowIds))
        {
            try
            {
                slideShowIds = JsonSerializer.Deserialize<List<int>>(program.SlideShowIds);
            }
            catch { }
        }

        return new EventProgramDto
        {
            ProgramId = program.ProgramId,
            Title = program.Title,
            Subtitle = program.Subtitle,
            Description = program.Description,
            ImageUrl = program.ImageUrl,
            EventDate = program.EventDate,
            Venue = program.Venue,
            VenueAddress = program.VenueAddress,
            SlideShowIds = slideShowIds,
            Status = program.Status,
            IsFeatured = program.IsFeatured,
            Slug = program.Slug,
            CreatedAt = program.CreatedAt,
            UpdatedAt = program.UpdatedAt,
            Sections = program.Sections?
                .OrderBy(s => s.DisplayOrder)
                .Select(s => MapSectionToDto(s))
                .ToList() ?? new List<ProgramSectionDto>()
        };
    }

    private ProgramSectionDto MapSectionToDto(ProgramSection section)
    {
        return new ProgramSectionDto
        {
            SectionId = section.SectionId,
            ProgramId = section.ProgramId,
            Title = section.Title,
            Subtitle = section.Subtitle,
            Description = section.Description,
            DisplayOrder = section.DisplayOrder,
            Items = section.Items?
                .OrderBy(i => i.DisplayOrder)
                .Select(i => MapItemToDto(i))
                .ToList() ?? new List<ProgramItemDto>()
        };
    }

    private ProgramItemDto MapItemToDto(ProgramItem item)
    {
        return new ProgramItemDto
        {
            ItemId = item.ItemId,
            SectionId = item.SectionId,
            ItemNumber = item.ItemNumber,
            Title = item.Title,
            PerformanceType = item.PerformanceType,
            PerformerNames = item.PerformerNames,
            Description = item.Description,
            ImageUrl = item.ImageUrl,
            ContentPageId = item.ContentPageId,
            DisplayOrder = item.DisplayOrder,
            DurationMinutes = item.DurationMinutes,
            Performers = item.Performers?
                .OrderBy(ip => ip.DisplayOrder)
                .Where(ip => ip.Performer != null)
                .Select(ip => MapPerformerToDto(ip.Performer!))
                .ToList()
        };
    }

    private PerformerDto MapPerformerToDto(Performer performer)
    {
        return new PerformerDto
        {
            PerformerId = performer.PerformerId,
            Name = performer.Name,
            ChineseName = performer.ChineseName,
            EnglishName = performer.EnglishName,
            Bio = performer.Bio,
            PhotoUrl = performer.PhotoUrl,
            Website = performer.Website,
            Instagram = performer.Instagram,
            YouTube = performer.YouTube,
            ContentPageId = performer.ContentPageId,
            IsActive = performer.IsActive
        };
    }

    private string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("《", "")
            .Replace("》", "")
            .Replace("·", "-");

        // Remove non-ASCII characters for cleaner URLs
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-");
        slug = slug.Trim('-');

        return string.IsNullOrEmpty(slug) ? $"program-{DateTime.UtcNow.Ticks}" : slug;
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
