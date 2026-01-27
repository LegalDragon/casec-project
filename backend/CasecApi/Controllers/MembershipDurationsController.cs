using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CasecApi.Data;
using CasecApi.Models;
using CasecApi.Models.DTOs;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
public class MembershipDurationsController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<MembershipDurationsController> _logger;

    public MembershipDurationsController(CasecDbContext context, ILogger<MembershipDurationsController> logger)
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

    private ActionResult<T> ForbiddenResponse<T>(string message = "You do not have permission to perform this action")
    {
        return StatusCode(403, new ApiResponse<T> { Success = false, Message = message });
    }

    // GET: api/MembershipDurations
    // Get all active durations (public for payment forms)
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<MembershipDurationDto>>>> GetDurations()
    {
        try
        {
            var durations = await _context.MembershipDurations
                .Where(d => d.IsActive)
                .OrderBy(d => d.DisplayOrder)
                .ThenBy(d => d.Months)
                .Select(d => new MembershipDurationDto
                {
                    DurationId = d.DurationId,
                    Name = d.Name,
                    Months = d.Months,
                    Description = d.Description,
                    IsActive = d.IsActive,
                    DisplayOrder = d.DisplayOrder
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<MembershipDurationDto>>
            {
                Success = true,
                Data = durations
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching durations");
            return StatusCode(500, new ApiResponse<List<MembershipDurationDto>>
            {
                Success = false,
                Message = "An error occurred while fetching durations"
            });
        }
    }

    // GET: api/MembershipDurations/admin/all
    // Get all durations including inactive (Admin only)
    [HttpGet("admin/all")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<MembershipDurationDto>>>> GetAllDurations()
    {
        try
        {
            if (!await HasAreaPermissionAsync("membership-types"))
                return ForbiddenResponse<List<MembershipDurationDto>>();

            var durations = await _context.MembershipDurations
                .OrderBy(d => d.DisplayOrder)
                .ThenBy(d => d.Months)
                .Select(d => new MembershipDurationDto
                {
                    DurationId = d.DurationId,
                    Name = d.Name,
                    Months = d.Months,
                    Description = d.Description,
                    IsActive = d.IsActive,
                    DisplayOrder = d.DisplayOrder
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<MembershipDurationDto>>
            {
                Success = true,
                Data = durations
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all durations");
            return StatusCode(500, new ApiResponse<List<MembershipDurationDto>>
            {
                Success = false,
                Message = "An error occurred while fetching durations"
            });
        }
    }

    // POST: api/MembershipDurations/admin
    // Create a new duration (Admin only)
    [HttpPost("admin")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<MembershipDurationDto>>> CreateDuration([FromBody] CreateDurationRequest request)
    {
        try
        {
            if (!await HasAreaPermissionAsync("membership-types", requireEdit: true))
                return ForbiddenResponse<MembershipDurationDto>();

            var duration = new MembershipDuration
            {
                Name = request.Name,
                Months = request.Months,
                Description = request.Description,
                IsActive = request.IsActive,
                DisplayOrder = request.DisplayOrder
            };

            _context.MembershipDurations.Add(duration);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<MembershipDurationDto>
            {
                Success = true,
                Message = "Duration created successfully",
                Data = new MembershipDurationDto
                {
                    DurationId = duration.DurationId,
                    Name = duration.Name,
                    Months = duration.Months,
                    Description = duration.Description,
                    IsActive = duration.IsActive,
                    DisplayOrder = duration.DisplayOrder
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating duration");
            return StatusCode(500, new ApiResponse<MembershipDurationDto>
            {
                Success = false,
                Message = "An error occurred while creating duration"
            });
        }
    }

    // PUT: api/MembershipDurations/admin/{id}
    // Update a duration (Admin only)
    [HttpPut("admin/{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<MembershipDurationDto>>> UpdateDuration(int id, [FromBody] CreateDurationRequest request)
    {
        try
        {
            if (!await HasAreaPermissionAsync("membership-types", requireEdit: true))
                return ForbiddenResponse<MembershipDurationDto>();

            var duration = await _context.MembershipDurations.FindAsync(id);
            if (duration == null)
            {
                return NotFound(new ApiResponse<MembershipDurationDto>
                {
                    Success = false,
                    Message = "Duration not found"
                });
            }

            duration.Name = request.Name;
            duration.Months = request.Months;
            duration.Description = request.Description;
            duration.IsActive = request.IsActive;
            duration.DisplayOrder = request.DisplayOrder;
            duration.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<MembershipDurationDto>
            {
                Success = true,
                Message = "Duration updated successfully",
                Data = new MembershipDurationDto
                {
                    DurationId = duration.DurationId,
                    Name = duration.Name,
                    Months = duration.Months,
                    Description = duration.Description,
                    IsActive = duration.IsActive,
                    DisplayOrder = duration.DisplayOrder
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating duration");
            return StatusCode(500, new ApiResponse<MembershipDurationDto>
            {
                Success = false,
                Message = "An error occurred while updating duration"
            });
        }
    }

    // DELETE: api/MembershipDurations/admin/{id}
    // Delete a duration (Admin only)
    [HttpDelete("admin/{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteDuration(int id)
    {
        try
        {
            if (!await HasAreaPermissionAsync("membership-types", requireDelete: true))
                return ForbiddenResponse<bool>();

            var duration = await _context.MembershipDurations.FindAsync(id);
            if (duration == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Duration not found"
                });
            }

            // Check if duration is used in any payments
            var isUsed = await _context.MembershipPayments.AnyAsync(p => p.DurationId == id);
            if (isUsed)
            {
                // Soft delete - just deactivate
                duration.IsActive = false;
                duration.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Duration deactivated (in use by existing payments)",
                    Data = true
                });
            }

            _context.MembershipDurations.Remove(duration);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Duration deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting duration");
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting duration"
            });
        }
    }
}
