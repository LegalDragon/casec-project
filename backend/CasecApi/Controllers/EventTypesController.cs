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
public class EventTypesController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<EventTypesController> _logger;

    public EventTypesController(CasecDbContext context, ILogger<EventTypesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    private async Task<bool> HasAreaPermissionAsync(string areaKey, bool requireEdit = false, bool requireDelete = false)
    {
        if (User.IsInRole("Admin")) return true;
        var userId = GetCurrentUserId();
        if (userId == 0) return false;
        return await _context.UserRoles
            .Where(ur => ur.UserId == userId)
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

    // GET: /EventTypes (Public - returns active event types)
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<EventTypeDto>>>> GetEventTypes()
    {
        try
        {
            var eventTypes = await _context.EventTypes
                .Where(et => et.IsActive)
                .OrderBy(et => et.DisplayOrder)
                .ThenBy(et => et.DisplayName)
                .Select(et => new EventTypeDto
                {
                    EventTypeId = et.EventTypeId,
                    Code = et.Code,
                    DisplayName = et.DisplayName,
                    Description = et.Description,
                    Icon = et.Icon,
                    Color = et.Color,
                    AllowsRegistration = et.AllowsRegistration,
                    IsActive = et.IsActive,
                    DisplayOrder = et.DisplayOrder
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<EventTypeDto>>
            {
                Success = true,
                Data = eventTypes
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching event types");
            return StatusCode(500, new ApiResponse<List<EventTypeDto>>
            {
                Success = false,
                Message = "An error occurred while fetching event types"
            });
        }
    }

    // GET: /EventTypes/all (includes inactive)
    [Authorize]
    [HttpGet("all")]
    public async Task<ActionResult<ApiResponse<List<EventTypeDto>>>> GetAllEventTypes()
    {
        try
        {
            if (!await HasAreaPermissionAsync("event-types"))
                return ForbiddenResponse<List<EventTypeDto>>();

            var eventTypes = await _context.EventTypes
                .OrderBy(et => et.DisplayOrder)
                .ThenBy(et => et.DisplayName)
                .Select(et => new EventTypeDto
                {
                    EventTypeId = et.EventTypeId,
                    Code = et.Code,
                    DisplayName = et.DisplayName,
                    Description = et.Description,
                    Icon = et.Icon,
                    Color = et.Color,
                    AllowsRegistration = et.AllowsRegistration,
                    IsActive = et.IsActive,
                    DisplayOrder = et.DisplayOrder
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<EventTypeDto>>
            {
                Success = true,
                Data = eventTypes
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all event types");
            return StatusCode(500, new ApiResponse<List<EventTypeDto>>
            {
                Success = false,
                Message = "An error occurred while fetching event types"
            });
        }
    }

    // GET: /EventTypes/{id}
    [Authorize]
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<EventTypeDto>>> GetEventType(int id)
    {
        try
        {
            if (!await HasAreaPermissionAsync("event-types"))
                return ForbiddenResponse<EventTypeDto>();

            var eventType = await _context.EventTypes.FindAsync(id);

            if (eventType == null)
            {
                return NotFound(new ApiResponse<EventTypeDto>
                {
                    Success = false,
                    Message = "Event type not found"
                });
            }

            return Ok(new ApiResponse<EventTypeDto>
            {
                Success = true,
                Data = new EventTypeDto
                {
                    EventTypeId = eventType.EventTypeId,
                    Code = eventType.Code,
                    DisplayName = eventType.DisplayName,
                    Description = eventType.Description,
                    Icon = eventType.Icon,
                    Color = eventType.Color,
                    AllowsRegistration = eventType.AllowsRegistration,
                    IsActive = eventType.IsActive,
                    DisplayOrder = eventType.DisplayOrder
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching event type {EventTypeId}", id);
            return StatusCode(500, new ApiResponse<EventTypeDto>
            {
                Success = false,
                Message = "An error occurred while fetching event type"
            });
        }
    }

    // POST: /EventTypes
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<EventTypeDto>>> CreateEventType([FromBody] CreateEventTypeRequest request)
    {
        try
        {
            if (!await HasAreaPermissionAsync("event-types", requireEdit: true))
                return ForbiddenResponse<EventTypeDto>();

            // Check for duplicate code
            var existingCode = await _context.EventTypes
                .AnyAsync(et => et.Code == request.Code);

            if (existingCode)
            {
                return BadRequest(new ApiResponse<EventTypeDto>
                {
                    Success = false,
                    Message = "An event type with this code already exists"
                });
            }

            var eventType = new EventType
            {
                Code = request.Code,
                DisplayName = request.DisplayName,
                Description = request.Description,
                Icon = request.Icon,
                Color = request.Color,
                AllowsRegistration = request.AllowsRegistration,
                DisplayOrder = request.DisplayOrder,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.EventTypes.Add(eventType);
            await _context.SaveChangesAsync();

            // Log activity
            var currentUserId = GetCurrentUserId();
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "EventTypeCreated",
                Description = $"Created event type: {eventType.DisplayName} ({eventType.Code})"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<EventTypeDto>
            {
                Success = true,
                Message = "Event type created successfully",
                Data = new EventTypeDto
                {
                    EventTypeId = eventType.EventTypeId,
                    Code = eventType.Code,
                    DisplayName = eventType.DisplayName,
                    Description = eventType.Description,
                    Icon = eventType.Icon,
                    Color = eventType.Color,
                    AllowsRegistration = eventType.AllowsRegistration,
                    IsActive = eventType.IsActive,
                    DisplayOrder = eventType.DisplayOrder
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating event type");
            return StatusCode(500, new ApiResponse<EventTypeDto>
            {
                Success = false,
                Message = "An error occurred while creating event type"
            });
        }
    }

    // PUT: /EventTypes/{id}
    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<EventTypeDto>>> UpdateEventType(int id, [FromBody] UpdateEventTypeRequest request)
    {
        try
        {
            if (!await HasAreaPermissionAsync("event-types", requireEdit: true))
                return ForbiddenResponse<EventTypeDto>();

            var eventType = await _context.EventTypes.FindAsync(id);

            if (eventType == null)
            {
                return NotFound(new ApiResponse<EventTypeDto>
                {
                    Success = false,
                    Message = "Event type not found"
                });
            }

            // Check for duplicate code if code is being changed
            if (!string.IsNullOrEmpty(request.Code) && request.Code != eventType.Code)
            {
                var existingCode = await _context.EventTypes
                    .AnyAsync(et => et.Code == request.Code && et.EventTypeId != id);

                if (existingCode)
                {
                    return BadRequest(new ApiResponse<EventTypeDto>
                    {
                        Success = false,
                        Message = "An event type with this code already exists"
                    });
                }
                eventType.Code = request.Code;
            }

            if (!string.IsNullOrEmpty(request.DisplayName))
                eventType.DisplayName = request.DisplayName;
            if (request.Description != null)
                eventType.Description = request.Description;
            if (request.Icon != null)
                eventType.Icon = request.Icon;
            if (request.Color != null)
                eventType.Color = request.Color;
            if (request.AllowsRegistration.HasValue)
                eventType.AllowsRegistration = request.AllowsRegistration.Value;
            if (request.IsActive.HasValue)
                eventType.IsActive = request.IsActive.Value;
            if (request.DisplayOrder.HasValue)
                eventType.DisplayOrder = request.DisplayOrder.Value;

            eventType.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Log activity
            var currentUserId = GetCurrentUserId();
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "EventTypeUpdated",
                Description = $"Updated event type: {eventType.DisplayName} ({eventType.Code})"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<EventTypeDto>
            {
                Success = true,
                Message = "Event type updated successfully",
                Data = new EventTypeDto
                {
                    EventTypeId = eventType.EventTypeId,
                    Code = eventType.Code,
                    DisplayName = eventType.DisplayName,
                    Description = eventType.Description,
                    Icon = eventType.Icon,
                    Color = eventType.Color,
                    AllowsRegistration = eventType.AllowsRegistration,
                    IsActive = eventType.IsActive,
                    DisplayOrder = eventType.DisplayOrder
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating event type {EventTypeId}", id);
            return StatusCode(500, new ApiResponse<EventTypeDto>
            {
                Success = false,
                Message = "An error occurred while updating event type"
            });
        }
    }

    // DELETE: /EventTypes/{id}
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteEventType(int id)
    {
        try
        {
            if (!await HasAreaPermissionAsync("event-types", requireDelete: true))
                return ForbiddenResponse<bool>();

            var eventType = await _context.EventTypes.FindAsync(id);

            if (eventType == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Event type not found"
                });
            }

            // Check if any events are using this type
            var eventsUsingType = await _context.Events
                .AnyAsync(e => e.EventType == eventType.Code);

            if (eventsUsingType)
            {
                // Soft delete - just deactivate
                eventType.IsActive = false;
                eventType.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Event type deactivated (events exist using this type)",
                    Data = true
                });
            }

            // Hard delete if no events use this type
            _context.EventTypes.Remove(eventType);
            await _context.SaveChangesAsync();

            // Log activity
            var currentUserId = GetCurrentUserId();
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "EventTypeDeleted",
                Description = $"Deleted event type: {eventType.DisplayName} ({eventType.Code})"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Event type deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting event type {EventTypeId}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting event type"
            });
        }
    }
}
