using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CasecApi.Data;
using CasecApi.Models;
using CasecApi.Models.DTOs;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
public class PerformersController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<PerformersController> _logger;

    public PerformersController(CasecDbContext context, ILogger<PerformersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private async Task<bool> HasAreaPermissionAsync(string areaKey, bool requireEdit = false, bool requireDelete = false)
    {
        if (User.IsInRole("Admin")) return true;
        var userId = GetCurrentUserId();
        if (userId == null) return false;
        return await _context.UserRoles
            .Where(ur => ur.UserId == userId.Value)
            .Join(_context.RoleAreaPermissions, ur => ur.RoleId, rap => rap.RoleId, (ur, rap) => rap)
            .Join(_context.AdminAreas, rap => rap.AreaId, a => a.AreaId, (rap, a) => new { rap, a })
            .Where(x => x.a.AreaKey == areaKey && x.rap.CanView)
            .Where(x => !requireEdit || x.rap.CanEdit)
            .Where(x => !requireDelete || x.rap.CanDelete)
            .AnyAsync();
    }

    private ActionResult<ApiResponse<T>> ForbiddenResponse<T>(string message = "You do not have permission to perform this action")
    {
        return StatusCode(403, new ApiResponse<T> { Success = false, Message = message });
    }

    // GET: /Performers - Get all performers (public, active only)
    [HttpGet]
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

    // GET: /Performers/admin/all - Get all performers including inactive
    [Authorize]
    [HttpGet("admin/all")]
    public async Task<ActionResult<ApiResponse<List<PerformerDto>>>> GetAllPerformers()
    {
        try
        {
            if (!await HasAreaPermissionAsync("performers"))
                return ForbiddenResponse<List<PerformerDto>>();

            var performers = await _context.Performers
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
            _logger.LogError(ex, "Error getting all performers");
            return StatusCode(500, new ApiResponse<List<PerformerDto>>
            {
                Success = false,
                Message = "An error occurred while fetching performers"
            });
        }
    }

    // GET: /Performers/{id} - Get a specific performer
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PerformerDto>>> GetPerformer(int id)
    {
        try
        {
            var performer = await _context.Performers
                .Where(p => p.PerformerId == id)
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
                .FirstOrDefaultAsync();

            if (performer == null)
            {
                return NotFound(new ApiResponse<PerformerDto>
                {
                    Success = false,
                    Message = "Performer not found"
                });
            }

            return Ok(new ApiResponse<PerformerDto>
            {
                Success = true,
                Data = performer
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting performer {Id}", id);
            return StatusCode(500, new ApiResponse<PerformerDto>
            {
                Success = false,
                Message = "An error occurred while fetching the performer"
            });
        }
    }

    // POST: /Performers - Create a new performer
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<PerformerDto>>> CreatePerformer([FromBody] CreatePerformerRequest request)
    {
        try
        {
            if (!await HasAreaPermissionAsync("performers", requireEdit: true))
                return ForbiddenResponse<PerformerDto>();

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

            var dto = new PerformerDto
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

            return CreatedAtAction(nameof(GetPerformer), new { id = performer.PerformerId }, new ApiResponse<PerformerDto>
            {
                Success = true,
                Data = dto,
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

    // PUT: /Performers/{id} - Update a performer
    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<PerformerDto>>> UpdatePerformer(int id, [FromBody] UpdatePerformerRequest request)
    {
        try
        {
            if (!await HasAreaPermissionAsync("performers", requireEdit: true))
                return ForbiddenResponse<PerformerDto>();

            var performer = await _context.Performers.FindAsync(id);
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

            var dto = new PerformerDto
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

            return Ok(new ApiResponse<PerformerDto>
            {
                Success = true,
                Data = dto,
                Message = "Performer updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating performer {Id}", id);
            return StatusCode(500, new ApiResponse<PerformerDto>
            {
                Success = false,
                Message = "An error occurred while updating the performer"
            });
        }
    }

    // DELETE: /Performers/{id} - Delete a performer
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePerformer(int id)
    {
        try
        {
            if (!await HasAreaPermissionAsync("performers", requireDelete: true))
                return ForbiddenResponse<bool>();

            var performer = await _context.Performers.FindAsync(id);
            if (performer == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Performer not found"
                });
            }

            // Check if performer is linked to any program items
            var linkedItems = await _context.ProgramItemPerformers
                .AnyAsync(pip => pip.PerformerId == id);

            if (linkedItems)
            {
                return BadRequest(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Cannot delete performer that is linked to program items. Remove the links first or deactivate the performer instead."
                });
            }

            _context.Performers.Remove(performer);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = true,
                Message = "Performer deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting performer {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting the performer"
            });
        }
    }

    // GET: /Performers/search?q=query - Search performers by name
    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<List<PerformerDto>>>> SearchPerformers([FromQuery] string q)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(new ApiResponse<List<PerformerDto>>
                {
                    Success = true,
                    Data = new List<PerformerDto>()
                });
            }

            var searchTerm = q.ToLower();
            var performers = await _context.Performers
                .Where(p => p.IsActive && (
                    p.Name.ToLower().Contains(searchTerm) ||
                    (p.ChineseName != null && p.ChineseName.Contains(q)) ||
                    (p.EnglishName != null && p.EnglishName.ToLower().Contains(searchTerm))
                ))
                .OrderBy(p => p.Name)
                .Take(20)
                .Select(p => new PerformerDto
                {
                    PerformerId = p.PerformerId,
                    Name = p.Name,
                    ChineseName = p.ChineseName,
                    EnglishName = p.EnglishName,
                    PhotoUrl = p.PhotoUrl,
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
            _logger.LogError(ex, "Error searching performers");
            return StatusCode(500, new ApiResponse<List<PerformerDto>>
            {
                Success = false,
                Message = "An error occurred while searching performers"
            });
        }
    }
}
