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
            // Check if user has admin access (legacy admin OR role-based permission for programs)
            var hasAdminAccess = await HasAreaPermissionAsync("programs");

            var query = _context.EventPrograms
                .Include(p => p.Sections)
                    .ThenInclude(s => s.Items)
                .AsQueryable();

            // Non-admins only see published programs
            if (!hasAdminAccess || !includeAll)
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
            // Check if user has admin access (legacy admin OR role-based permission for programs)
            var hasAdminAccess = await HasAreaPermissionAsync("programs");

            EventProgram? program;

            // Note: Avoid filtered Includes (.OrderBy inside Include) for SQL Server 2014 compatibility
            // Ordering is done in the mapping methods instead
            if (int.TryParse(idOrSlug, out int id))
            {
                program = await _context.EventPrograms
                    .Include(p => p.Sections)
                        .ThenInclude(s => s.Items)
                            .ThenInclude(i => i.Performers)
                                .ThenInclude(ip => ip.Performer)
                    .FirstOrDefaultAsync(p => p.ProgramId == id);
            }
            else
            {
                program = await _context.EventPrograms
                    .Include(p => p.Sections)
                        .ThenInclude(s => s.Items)
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
            if (!hasAdminAccess && program.Status != "Published")
            {
                return NotFound(new ApiResponse<EventProgramDto>
                {
                    Success = false,
                    Message = "Program not found"
                });
            }

            // Collect all item IDs and performer IDs to load their cards
            var itemIds = program.Sections?
                .SelectMany(s => s.Items?.Select(i => i.ItemId) ?? Enumerable.Empty<int>())
                .ToList() ?? new List<int>();

            var performerIds = program.Sections?
                .SelectMany(s => s.Items?.SelectMany(i => i.Performers?.Select(p => p.PerformerId) ?? Enumerable.Empty<int>()) ?? Enumerable.Empty<int>())
                .Distinct()
                .ToList() ?? new List<int>();

            // Load content cards - use separate queries to avoid OPENJSON (not supported in SQL Server 2014)
            var itemCards = new Dictionary<int, List<ContentCard>>();
            var performerCards = new Dictionary<int, List<ContentCard>>();

            if (itemIds.Any())
            {
                // Load item cards - filter in memory for SQL Server 2014 compatibility
                var itemCardsList = await _context.ContentCards
                    .Where(c => c.EntityType == "ProgramItem")
                    .OrderBy(c => c.DisplayOrder)
                    .ToListAsync();

                itemCards = itemCardsList
                    .Where(c => itemIds.Contains(c.EntityId))
                    .GroupBy(c => c.EntityId)
                    .ToDictionary(g => g.Key, g => g.ToList());
            }

            if (performerIds.Any())
            {
                // Load performer cards - filter in memory for SQL Server 2014 compatibility
                var performerCardsList = await _context.ContentCards
                    .Where(c => c.EntityType == "Performer")
                    .OrderBy(c => c.DisplayOrder)
                    .ToListAsync();

                performerCards = performerCardsList
                    .Where(c => performerIds.Contains(c.EntityId))
                    .GroupBy(c => c.EntityId)
                    .ToDictionary(g => g.Key, g => g.ToList());
            }

            var dto = MapToDto(program, itemCards, performerCards);

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

    // POST: /EventPrograms - Create new program (requires edit permission for programs area)
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<EventProgramDto>>> CreateProgram([FromBody] CreateEventProgramRequest request)
    {
        try
        {
            // Check permission (requires edit access)
            if (!await HasAreaPermissionAsync("programs", requireEdit: true))
            {
                return ForbiddenResponse<EventProgramDto>();
            }

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
                TitleZh = request.TitleZh,
                TitleEn = request.TitleEn,
                Subtitle = request.Subtitle,
                SubtitleZh = request.SubtitleZh,
                SubtitleEn = request.SubtitleEn,
                Description = request.Description,
                DescriptionZh = request.DescriptionZh,
                DescriptionEn = request.DescriptionEn,
                ImageUrl = request.ImageUrl,
                EventDate = request.EventDate,
                Venue = request.Venue,
                VenueAddress = request.VenueAddress,
                SlideShowIds = request.SlideShowIds != null ? JsonSerializer.Serialize(request.SlideShowIds) : null,
                ColorThemes = request.ColorThemes != null ? JsonSerializer.Serialize(request.ColorThemes) : null,
                ShowBackgroundImage = request.ShowBackgroundImage,
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

    // PUT: /EventPrograms/{id} - Update program (requires edit permission for programs area)
    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<EventProgramDto>>> UpdateProgram(int id, [FromBody] UpdateEventProgramRequest request)
    {
        try
        {
            // Check permission (requires edit access)
            if (!await HasAreaPermissionAsync("programs", requireEdit: true))
            {
                return ForbiddenResponse<EventProgramDto>();
            }

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
            if (request.TitleZh != null) program.TitleZh = request.TitleZh;
            if (request.TitleEn != null) program.TitleEn = request.TitleEn;
            if (request.Subtitle != null) program.Subtitle = request.Subtitle;
            if (request.SubtitleZh != null) program.SubtitleZh = request.SubtitleZh;
            if (request.SubtitleEn != null) program.SubtitleEn = request.SubtitleEn;
            if (request.Description != null) program.Description = request.Description;
            if (request.DescriptionZh != null) program.DescriptionZh = request.DescriptionZh;
            if (request.DescriptionEn != null) program.DescriptionEn = request.DescriptionEn;
            if (request.ImageUrl != null) program.ImageUrl = request.ImageUrl;
            if (request.EventDate.HasValue) program.EventDate = request.EventDate;
            if (request.Venue != null) program.Venue = request.Venue;
            if (request.VenueAddress != null) program.VenueAddress = request.VenueAddress;
            if (request.SlideShowIds != null) program.SlideShowIds = JsonSerializer.Serialize(request.SlideShowIds);
            if (request.ColorThemes != null) program.ColorThemes = JsonSerializer.Serialize(request.ColorThemes);
            if (request.ShowBackgroundImage.HasValue) program.ShowBackgroundImage = request.ShowBackgroundImage.Value;
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

    // DELETE: /EventPrograms/{id} - Delete program (requires delete permission for programs area)
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteProgram(int id)
    {
        try
        {
            // Check permission (requires delete access)
            if (!await HasAreaPermissionAsync("programs", requireDelete: true))
            {
                return ForbiddenResponse<bool>();
            }

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
    [Authorize]
    [HttpPost("{programId}/sections")]
    public async Task<ActionResult<ApiResponse<ProgramSectionDto>>> CreateSection(int programId, [FromBody] CreateProgramSectionRequest request)
    {
        try
        {
            // Check permission (requires edit access)
            if (!await HasAreaPermissionAsync("programs", requireEdit: true))
            {
                return ForbiddenResponse<ProgramSectionDto>();
            }

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
                TitleZh = request.TitleZh,
                TitleEn = request.TitleEn,
                Subtitle = request.Subtitle,
                SubtitleZh = request.SubtitleZh,
                SubtitleEn = request.SubtitleEn,
                Description = request.Description,
                DescriptionZh = request.DescriptionZh,
                DescriptionEn = request.DescriptionEn,
                DisplayOrder = request.DisplayOrder,
                IsActive = request.IsActive,
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
    [Authorize]
    [HttpPut("sections/{sectionId}")]
    public async Task<ActionResult<ApiResponse<ProgramSectionDto>>> UpdateSection(int sectionId, [FromBody] UpdateProgramSectionRequest request)
    {
        try
        {
            // Check permission (requires edit access)
            if (!await HasAreaPermissionAsync("programs", requireEdit: true))
            {
                return ForbiddenResponse<ProgramSectionDto>();
            }

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
            if (request.TitleZh != null) section.TitleZh = request.TitleZh;
            if (request.TitleEn != null) section.TitleEn = request.TitleEn;
            if (request.Subtitle != null) section.Subtitle = request.Subtitle;
            if (request.SubtitleZh != null) section.SubtitleZh = request.SubtitleZh;
            if (request.SubtitleEn != null) section.SubtitleEn = request.SubtitleEn;
            if (request.Description != null) section.Description = request.Description;
            if (request.DescriptionZh != null) section.DescriptionZh = request.DescriptionZh;
            if (request.DescriptionEn != null) section.DescriptionEn = request.DescriptionEn;
            if (request.DisplayOrder.HasValue) section.DisplayOrder = request.DisplayOrder.Value;
            if (request.IsActive.HasValue) section.IsActive = request.IsActive.Value;

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

    // PUT: /EventPrograms/{programId}/sections/reorder - Reorder sections within a program
    [Authorize]
    [HttpPut("{programId}/sections/reorder")]
    public async Task<ActionResult<ApiResponse<bool>>> ReorderSections(int programId, [FromBody] ReorderSectionsRequest request)
    {
        try
        {
            // Check permission (requires edit access)
            if (!await HasAreaPermissionAsync("programs", requireEdit: true))
            {
                return ForbiddenResponse<bool>();
            }

            var program = await _context.EventPrograms
                .Include(p => p.Sections)
                .FirstOrDefaultAsync(p => p.ProgramId == programId);

            if (program == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Program not found"
                });
            }

            // Update display order for each section
            foreach (var orderItem in request.SectionOrder)
            {
                var section = program.Sections?.FirstOrDefault(s => s.SectionId == orderItem.SectionId);
                if (section != null)
                {
                    section.DisplayOrder = orderItem.DisplayOrder;
                    section.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = true,
                Message = "Sections reordered successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering sections for program {ProgramId}", programId);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while reordering sections"
            });
        }
    }

    // DELETE: /EventPrograms/sections/{sectionId} - Delete section
    [Authorize]
    [HttpDelete("sections/{sectionId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSection(int sectionId)
    {
        try
        {
            // Check permission (requires delete access)
            if (!await HasAreaPermissionAsync("programs", requireDelete: true))
            {
                return ForbiddenResponse<bool>();
            }

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
    [Authorize]
    [HttpPost("sections/{sectionId}/items")]
    public async Task<ActionResult<ApiResponse<ProgramItemDto>>> CreateItem(int sectionId, [FromBody] CreateProgramItemRequest request)
    {
        try
        {
            // Check permission (requires edit access)
            if (!await HasAreaPermissionAsync("programs", requireEdit: true))
            {
                return ForbiddenResponse<ProgramItemDto>();
            }

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
                TitleZh = request.TitleZh,
                TitleEn = request.TitleEn,
                PerformanceType = request.PerformanceType,
                PerformanceTypeZh = request.PerformanceTypeZh,
                PerformanceTypeEn = request.PerformanceTypeEn,
                PerformerNames = request.PerformerNames,
                PerformerNames2 = request.PerformerNames2,
                Description = request.Description,
                DescriptionZh = request.DescriptionZh,
                DescriptionEn = request.DescriptionEn,
                ImageUrl = request.ImageUrl,
                ContentPageId = request.ContentPageId,
                DisplayOrder = request.DisplayOrder,
                DurationMinutes = request.DurationMinutes,
                IsActive = request.IsActive,
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
    [Authorize]
    [HttpPut("items/{itemId}")]
    public async Task<ActionResult<ApiResponse<ProgramItemDto>>> UpdateItem(int itemId, [FromBody] UpdateProgramItemRequest request)
    {
        try
        {
            // Check permission (requires edit access)
            if (!await HasAreaPermissionAsync("programs", requireEdit: true))
            {
                return ForbiddenResponse<ProgramItemDto>();
            }

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
            if (request.TitleZh != null) item.TitleZh = request.TitleZh;
            if (request.TitleEn != null) item.TitleEn = request.TitleEn;
            if (request.PerformanceType != null) item.PerformanceType = request.PerformanceType;
            if (request.PerformanceTypeZh != null) item.PerformanceTypeZh = request.PerformanceTypeZh;
            if (request.PerformanceTypeEn != null) item.PerformanceTypeEn = request.PerformanceTypeEn;
            if (request.PerformerNames != null) item.PerformerNames = request.PerformerNames;
            if (request.PerformerNames2 != null) item.PerformerNames2 = request.PerformerNames2;
            if (request.Description != null) item.Description = request.Description;
            if (request.DescriptionZh != null) item.DescriptionZh = request.DescriptionZh;
            if (request.DescriptionEn != null) item.DescriptionEn = request.DescriptionEn;
            if (request.ImageUrl != null) item.ImageUrl = request.ImageUrl;
            if (request.ContentPageId.HasValue) item.ContentPageId = request.ContentPageId;
            if (request.DisplayOrder.HasValue) item.DisplayOrder = request.DisplayOrder.Value;
            if (request.DurationMinutes.HasValue) item.DurationMinutes = request.DurationMinutes;
            if (request.IsActive.HasValue) item.IsActive = request.IsActive.Value;

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

    // PUT: /EventPrograms/sections/{sectionId}/items/reorder - Reorder items within a section
    [Authorize]
    [HttpPut("sections/{sectionId}/items/reorder")]
    public async Task<ActionResult<ApiResponse<bool>>> ReorderItems(int sectionId, [FromBody] ReorderItemsRequest request)
    {
        try
        {
            // Check permission (requires edit access)
            if (!await HasAreaPermissionAsync("programs", requireEdit: true))
            {
                return ForbiddenResponse<bool>();
            }

            var section = await _context.ProgramSections
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.SectionId == sectionId);

            if (section == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Section not found"
                });
            }

            // Update display order for each item
            foreach (var orderItem in request.ItemOrder)
            {
                var item = section.Items?.FirstOrDefault(i => i.ItemId == orderItem.ItemId);
                if (item != null)
                {
                    item.DisplayOrder = orderItem.DisplayOrder;
                    item.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = true,
                Message = "Items reordered successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering items for section {SectionId}", sectionId);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while reordering items"
            });
        }
    }

    // DELETE: /EventPrograms/items/{itemId} - Delete item
    [Authorize]
    [HttpDelete("items/{itemId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteItem(int itemId)
    {
        try
        {
            // Check permission (requires delete access)
            if (!await HasAreaPermissionAsync("programs", requireDelete: true))
            {
                return ForbiddenResponse<bool>();
            }

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
                    BioZh = p.BioZh,
                    BioEn = p.BioEn,
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

    // POST: /EventPrograms/performers - Create performer (requires edit permission for programs or performers area)
    [Authorize]
    [HttpPost("performers")]
    public async Task<ActionResult<ApiResponse<PerformerDto>>> CreatePerformer([FromBody] CreatePerformerRequest request)
    {
        try
        {
            // Check permission (requires edit access for programs or performers area)
            var hasProgramsPermission = await HasAreaPermissionAsync("programs", requireEdit: true);
            var hasPerformersPermission = await HasAreaPermissionAsync("performers", requireEdit: true);
            if (!hasProgramsPermission && !hasPerformersPermission)
            {
                return ForbiddenResponse<PerformerDto>();
            }

            var performer = new Performer
            {
                Name = request.Name,
                ChineseName = request.ChineseName,
                EnglishName = request.EnglishName,
                Bio = request.Bio,
                BioZh = request.BioZh,
                BioEn = request.BioEn,
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

    // PUT: /EventPrograms/performers/{performerId} - Update performer (requires edit permission for programs or performers area)
    [Authorize]
    [HttpPut("performers/{performerId}")]
    public async Task<ActionResult<ApiResponse<PerformerDto>>> UpdatePerformer(int performerId, [FromBody] UpdatePerformerRequest request)
    {
        try
        {
            // Check permission (requires edit access for programs or performers area)
            var hasProgramsPermission = await HasAreaPermissionAsync("programs", requireEdit: true);
            var hasPerformersPermission = await HasAreaPermissionAsync("performers", requireEdit: true);
            if (!hasProgramsPermission && !hasPerformersPermission)
            {
                return ForbiddenResponse<PerformerDto>();
            }

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
            if (request.BioZh != null) performer.BioZh = request.BioZh;
            if (request.BioEn != null) performer.BioEn = request.BioEn;
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

    private EventProgramDto MapToDto(
        EventProgram program,
        Dictionary<int, List<ContentCard>>? itemCards = null,
        Dictionary<int, List<ContentCard>>? performerCards = null)
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

        List<ColorThemeDto>? colorThemes = null;
        if (!string.IsNullOrEmpty(program.ColorThemes))
        {
            try
            {
                colorThemes = JsonSerializer.Deserialize<List<ColorThemeDto>>(program.ColorThemes);
            }
            catch { }
        }

        return new EventProgramDto
        {
            ProgramId = program.ProgramId,
            Title = program.Title,
            TitleZh = program.TitleZh,
            TitleEn = program.TitleEn,
            Subtitle = program.Subtitle,
            SubtitleZh = program.SubtitleZh,
            SubtitleEn = program.SubtitleEn,
            Description = program.Description,
            DescriptionZh = program.DescriptionZh,
            DescriptionEn = program.DescriptionEn,
            ImageUrl = program.ImageUrl,
            EventDate = program.EventDate,
            Venue = program.Venue,
            VenueAddress = program.VenueAddress,
            SlideShowIds = slideShowIds,
            ColorThemes = colorThemes,
            ShowBackgroundImage = program.ShowBackgroundImage,
            Status = program.Status,
            IsFeatured = program.IsFeatured,
            Slug = program.Slug,
            CreatedAt = program.CreatedAt,
            UpdatedAt = program.UpdatedAt,
            Sections = program.Sections?
                .OrderBy(s => s.DisplayOrder)
                .Select(s => MapSectionToDto(s, itemCards, performerCards))
                .ToList() ?? new List<ProgramSectionDto>()
        };
    }

    private ProgramSectionDto MapSectionToDto(
        ProgramSection section,
        Dictionary<int, List<ContentCard>>? itemCards = null,
        Dictionary<int, List<ContentCard>>? performerCards = null)
    {
        return new ProgramSectionDto
        {
            SectionId = section.SectionId,
            ProgramId = section.ProgramId,
            Title = section.Title,
            TitleZh = section.TitleZh,
            TitleEn = section.TitleEn,
            Subtitle = section.Subtitle,
            SubtitleZh = section.SubtitleZh,
            SubtitleEn = section.SubtitleEn,
            Description = section.Description,
            DescriptionZh = section.DescriptionZh,
            DescriptionEn = section.DescriptionEn,
            DisplayOrder = section.DisplayOrder,
            IsActive = section.IsActive,
            Items = section.Items?
                .OrderBy(i => i.DisplayOrder)
                .Select(i => MapItemToDto(i, itemCards, performerCards))
                .ToList() ?? new List<ProgramItemDto>()
        };
    }

    private ProgramItemDto MapItemToDto(
        ProgramItem item,
        Dictionary<int, List<ContentCard>>? itemCards = null,
        Dictionary<int, List<ContentCard>>? performerCards = null)
    {
        var cards = itemCards != null && itemCards.TryGetValue(item.ItemId, out var ic)
            ? ic.Select(MapCardToDto).ToList()
            : null;

        return new ProgramItemDto
        {
            ItemId = item.ItemId,
            SectionId = item.SectionId,
            ItemNumber = item.ItemNumber,
            Title = item.Title,
            TitleZh = item.TitleZh,
            TitleEn = item.TitleEn,
            PerformanceType = item.PerformanceType,
            PerformanceTypeZh = item.PerformanceTypeZh,
            PerformanceTypeEn = item.PerformanceTypeEn,
            PerformerNames = item.PerformerNames,
            PerformerNames2 = item.PerformerNames2,
            Description = item.Description,
            DescriptionZh = item.DescriptionZh,
            DescriptionEn = item.DescriptionEn,
            ImageUrl = item.ImageUrl,
            ContentPageId = item.ContentPageId,
            DisplayOrder = item.DisplayOrder,
            DurationMinutes = item.DurationMinutes,
            IsActive = item.IsActive,
            Performers = item.Performers?
                .OrderBy(ip => ip.DisplayOrder)
                .Where(ip => ip.Performer != null)
                .Select(ip => MapPerformerToDto(ip.Performer!, performerCards))
                .ToList(),
            Cards = cards
        };
    }

    private PerformerDto MapPerformerToDto(
        Performer performer,
        Dictionary<int, List<ContentCard>>? performerCards = null)
    {
        var cards = performerCards != null && performerCards.TryGetValue(performer.PerformerId, out var pc)
            ? pc.Select(MapCardToDto).ToList()
            : null;

        return new PerformerDto
        {
            PerformerId = performer.PerformerId,
            Name = performer.Name,
            ChineseName = performer.ChineseName,
            EnglishName = performer.EnglishName,
            Bio = performer.Bio,
            BioZh = performer.BioZh,
            BioEn = performer.BioEn,
            PhotoUrl = performer.PhotoUrl,
            Website = performer.Website,
            Instagram = performer.Instagram,
            YouTube = performer.YouTube,
            ContentPageId = performer.ContentPageId,
            IsActive = performer.IsActive,
            Cards = cards
        };
    }

    private ContentCardDto MapCardToDto(ContentCard card)
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
            AspectRatio = card.AspectRatio ?? "original",
            DisplayOrder = card.DisplayOrder,
            CreatedAt = card.CreatedAt,
            UpdatedAt = card.UpdatedAt
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
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    /// <summary>
    /// Checks if the current user has permission for a specific admin area.
    /// Returns true if user is legacy admin OR has role-based permission for the area.
    /// </summary>
    private async Task<bool> HasAreaPermissionAsync(string areaKey, bool requireEdit = false, bool requireDelete = false)
    {
        // Legacy admin check (from JWT token)
        if (User.IsInRole("Admin"))
        {
            return true;
        }

        var userId = GetCurrentUserId();
        if (userId == null) return false;

        // Check role-based permissions
        var hasPermission = await _context.UserRoles
            .Where(ur => ur.UserId == userId.Value)
            .Join(_context.RoleAreaPermissions,
                ur => ur.RoleId,
                rap => rap.RoleId,
                (ur, rap) => rap)
            .Join(_context.AdminAreas,
                rap => rap.AreaId,
                a => a.AreaId,
                (rap, a) => new { rap, a })
            .Where(x => x.a.AreaKey == areaKey)
            .Where(x => x.rap.CanView)
            .Where(x => !requireEdit || x.rap.CanEdit)
            .Where(x => !requireDelete || x.rap.CanDelete)
            .AnyAsync();

        return hasPermission;
    }

    /// <summary>
    /// Returns a 403 Forbidden response for unauthorized access.
    /// </summary>
    private ActionResult<ApiResponse<T>> ForbiddenResponse<T>(string message = "You do not have permission to perform this action")
    {
        return StatusCode(403, new ApiResponse<T>
        {
            Success = false,
            Message = message
        });
    }
}
