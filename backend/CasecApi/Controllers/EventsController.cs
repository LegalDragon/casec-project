using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using CasecApi.Data;
using UserEntity = CasecApi.Models.User;
using CasecApi.Models;
using CasecApi.Models.DTOs;
using CasecApi.Services;

namespace CasecApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventsController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<EventsController> _logger;
    private readonly IAssetService _assetService;

    public EventsController(CasecDbContext context, ILogger<EventsController> logger, IAssetService assetService)
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

    private async Task<bool> IsSystemAdmin(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user != null && user.IsAdmin;
    }

    private async Task<bool> IsClubAdmin(int userId, int clubId)
    {
        return await _context.ClubAdmins.AnyAsync(ca => ca.UserId == userId && ca.ClubId == clubId);
    }

    private async Task<bool> CanManageEvent(int userId, Event eventItem)
    {
        // System admins can manage any event
        if (await IsSystemAdmin(userId))
            return true;

        // Club admins can manage events hosted by their club
        if (eventItem.HostClubId.HasValue)
            return await IsClubAdmin(userId, eventItem.HostClubId.Value);

        return false;
    }

    // GET: api/Events/all (Admin only - includes all events)
    [Authorize]
    [HttpGet("all")]
    public async Task<ActionResult<ApiResponse<List<EventDto>>>> GetAllEvents()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var isAdmin = await IsSystemAdmin(currentUserId);

            // Get clubs where user is admin
            var adminClubIds = await _context.ClubAdmins
                .Where(ca => ca.UserId == currentUserId)
                .Select(ca => ca.ClubId)
                .ToListAsync();

            var query = _context.Events.AsQueryable();

            // If not system admin, filter to only their club's events or CASEC events
            if (!isAdmin)
            {
                query = query.Where(e =>
                    e.HostClubId == null || // CASEC events (no host club)
                    (e.HostClubId.HasValue && adminClubIds.Contains(e.HostClubId.Value))); // Their club's events
            }

            var events = await query
                .OrderByDescending(e => e.EventDate)
                .Select(e => new EventDto
                {
                    EventId = e.EventId,
                    Title = e.Title,
                    Description = e.Description,
                    EventDate = e.EventDate,
                    Location = e.Location,
                    EventType = e.EventType,
                    EventCategory = e.EventCategory,
                    EventScope = e.EventScope,
                    HostClubId = e.HostClubId,
                    HostClubName = e.HostClub != null ? e.HostClub.Name : null,
                    HostClubAvatar = e.HostClub != null ? e.HostClub.AvatarUrl : null,
                    PartnerName = e.PartnerName,
                    PartnerLogo = e.PartnerLogo,
                    PartnerWebsite = e.PartnerWebsite,
                    RegistrationUrl = e.RegistrationUrl,
                    EventFee = e.EventFee,
                    MaxCapacity = e.MaxCapacity,
                    IsRegistrationRequired = e.IsRegistrationRequired,
                    IsFeatured = e.IsFeatured,
                    TotalRegistrations = _context.EventRegistrations.Count(er => er.EventId == e.EventId),
                    SpotsRemaining = e.MaxCapacity - _context.EventRegistrations.Count(er => er.EventId == e.EventId),
                    IsUserRegistered = currentUserId > 0 &&
                        _context.EventRegistrations.Any(er => er.EventId == e.EventId && er.UserId == currentUserId),
                    CreatedAt = e.CreatedAt
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<EventDto>>
            {
                Success = true,
                Data = events
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all events");
            return StatusCode(500, new ApiResponse<List<EventDto>>
            {
                Success = false,
                Message = "An error occurred while fetching events"
            });
        }
    }

    // GET: api/Events
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<EventDto>>>> GetEvents(
        [FromQuery] string? eventType = null,
        [FromQuery] string? category = null,
        [FromQuery] int? clubId = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] bool? featured = null,
        [FromQuery] bool? upcoming = true)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var query = _context.Events.AsQueryable();

            // Filter by event type
            if (!string.IsNullOrEmpty(eventType))
            {
                query = query.Where(e => e.EventType == eventType);
            }

            // Filter by category
            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(e => e.EventCategory == category);
            }

            // Filter by club
            if (clubId.HasValue)
            {
                query = query.Where(e => e.HostClubId == clubId.Value);
            }

            // Filter by date range
            if (dateFrom.HasValue)
            {
                query = query.Where(e => e.EventDate >= dateFrom.Value);
            }

            if (dateTo.HasValue)
            {
                query = query.Where(e => e.EventDate <= dateTo.Value);
            }

            // Filter by featured
            if (featured.HasValue)
            {
                query = query.Where(e => e.IsFeatured == featured.Value);
            }

            // Filter by upcoming/past (only if date range not specified)
            if (upcoming.HasValue && upcoming.Value && !dateFrom.HasValue && !dateTo.HasValue)
            {
                query = query.Where(e => e.EventDate >= DateTime.UtcNow);
            }

            var events = await query
                .OrderBy(e => e.EventDate)
                .Select(e => new EventDto
                {
                    EventId = e.EventId,
                    Title = e.Title,
                    Description = e.Description,
                    EventDate = e.EventDate,
                    Location = e.Location,
                    EventType = e.EventType,
                    EventCategory = e.EventCategory,
                    EventScope = e.EventScope,
                    HostClubId = e.HostClubId,
                    HostClubName = e.HostClub != null ? e.HostClub.Name : null,
                    HostClubAvatar = e.HostClub != null ? e.HostClub.AvatarUrl : null,
                    PartnerName = e.PartnerName,
                    PartnerLogo = e.PartnerLogo,
                    PartnerWebsite = e.PartnerWebsite,
                    RegistrationUrl = e.RegistrationUrl,
                    EventFee = e.EventFee,
                    MaxCapacity = e.MaxCapacity,
                    IsRegistrationRequired = e.IsRegistrationRequired,
                    IsFeatured = e.IsFeatured,
                    TotalRegistrations = _context.EventRegistrations.Count(er => er.EventId == e.EventId),
                    SpotsRemaining = e.MaxCapacity - _context.EventRegistrations.Count(er => er.EventId == e.EventId),
                    IsUserRegistered = currentUserId > 0 && 
                        _context.EventRegistrations.Any(er => er.EventId == e.EventId && er.UserId == currentUserId),
                    CreatedAt = e.CreatedAt
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<EventDto>>
            {
                Success = true,
                Data = events
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching events");
            return StatusCode(500, new ApiResponse<List<EventDto>>
            {
                Success = false,
                Message = "An error occurred while fetching events"
            });
        }
    }

    // GET: api/Events/{id}
    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<EventDto>>> GetEvent(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var eventItem = await _context.Events.FindAsync(id);

            if (eventItem == null)
            {
                return NotFound(new ApiResponse<EventDto>
                {
                    Success = false,
                    Message = "Event not found"
                });
            }

            var eventDto = new EventDto
            {
                EventId = eventItem.EventId,
                Title = eventItem.Title,
                Description = eventItem.Description,
                EventDate = eventItem.EventDate,
                Location = eventItem.Location,
                EventType = eventItem.EventType,
                EventCategory = eventItem.EventCategory,
                PartnerName = eventItem.PartnerName,
                PartnerLogo = eventItem.PartnerLogo,
                PartnerWebsite = eventItem.PartnerWebsite,
                RegistrationUrl = eventItem.RegistrationUrl,
                EventFee = eventItem.EventFee,
                MaxCapacity = eventItem.MaxCapacity,
                IsRegistrationRequired = eventItem.IsRegistrationRequired,
                IsFeatured = eventItem.IsFeatured,
                TotalRegistrations = await _context.EventRegistrations.CountAsync(er => er.EventId == id),
                SpotsRemaining = eventItem.MaxCapacity - await _context.EventRegistrations.CountAsync(er => er.EventId == id),
                IsUserRegistered = currentUserId > 0 && 
                    await _context.EventRegistrations.AnyAsync(er => er.EventId == id && er.UserId == currentUserId),
                CreatedAt = eventItem.CreatedAt
            };

            return Ok(new ApiResponse<EventDto>
            {
                Success = true,
                Data = eventDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching event");
            return StatusCode(500, new ApiResponse<EventDto>
            {
                Success = false,
                Message = "An error occurred while fetching event"
            });
        }
    }

    // POST: api/Events (Admin or Club Admin)
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<EventDto>>> CreateEvent([FromBody] CreateEventRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var isAdmin = await IsSystemAdmin(currentUserId);

            // Check permissions: System admins can create any event
            // Club admins can only create events for their clubs
            if (!isAdmin)
            {
                if (!request.HostClubId.HasValue)
                {
                    return Forbid(); // Only system admins can create CASEC-wide events
                }

                var isClubAdminUser = await IsClubAdmin(currentUserId, request.HostClubId.Value);
                if (!isClubAdminUser)
                {
                    return Forbid(); // Must be admin of the host club
                }
            }

            var eventItem = new Event
            {
                Title = request.Title,
                Description = request.Description,
                EventDate = request.EventDate,
                Location = request.Location,
                EventType = request.EventType ?? "CasecEvent",
                EventCategory = request.EventCategory,
                EventScope = request.EventScope ?? "AllMembers",
                HostClubId = request.HostClubId,
                PartnerName = request.PartnerName,
                PartnerLogo = request.PartnerLogo,
                PartnerWebsite = request.PartnerWebsite,
                RegistrationUrl = request.RegistrationUrl,
                EventFee = request.EventFee,
                MaxCapacity = request.MaxCapacity,
                IsRegistrationRequired = request.IsRegistrationRequired,
                IsFeatured = request.IsFeatured
            };

            _context.Events.Add(eventItem);
            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "EventCreated",
                Description = $"Created event: {eventItem.Title} (Type: {eventItem.EventType})"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<EventDto>
            {
                Success = true,
                Message = "Event created successfully",
                Data = new EventDto { EventId = eventItem.EventId }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating event");
            return StatusCode(500, new ApiResponse<EventDto>
            {
                Success = false,
                Message = "An error occurred while creating event"
            });
        }
    }

    // PUT: api/Events/{id} (Admin or Club Admin)
    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateEvent(int id, [FromBody] UpdateEventRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var eventItem = await _context.Events.FindAsync(id);

            if (eventItem == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Event not found"
                });
            }

            // Check permissions
            if (!await CanManageEvent(currentUserId, eventItem))
            {
                return Forbid();
            }

            eventItem.Title = request.Title ?? eventItem.Title;
            eventItem.Description = request.Description ?? eventItem.Description;
            eventItem.EventDate = request.EventDate ?? eventItem.EventDate;
            eventItem.Location = request.Location ?? eventItem.Location;
            eventItem.EventType = request.EventType ?? eventItem.EventType;
            eventItem.EventCategory = request.EventCategory;
            eventItem.EventScope = request.EventScope ?? eventItem.EventScope;
            eventItem.PartnerName = request.PartnerName;
            eventItem.PartnerLogo = request.PartnerLogo;
            eventItem.PartnerWebsite = request.PartnerWebsite;
            eventItem.RegistrationUrl = request.RegistrationUrl;
            eventItem.EventFee = request.EventFee ?? eventItem.EventFee;
            eventItem.MaxCapacity = request.MaxCapacity ?? eventItem.MaxCapacity;
            eventItem.IsRegistrationRequired = request.IsRegistrationRequired ?? eventItem.IsRegistrationRequired;
            eventItem.IsFeatured = request.IsFeatured ?? eventItem.IsFeatured;

            // Only system admins can change the host club
            if (request.HostClubId.HasValue && await IsSystemAdmin(currentUserId))
            {
                eventItem.HostClubId = request.HostClubId;
            }

            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "EventUpdated",
                Description = $"Updated event: {eventItem.Title}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Event updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating event");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while updating event"
            });
        }
    }

    // DELETE: api/Events/{id} (Admin or Club Admin)
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteEvent(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var eventItem = await _context.Events.FindAsync(id);

            if (eventItem == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Event not found"
                });
            }

            // Check permissions
            if (!await CanManageEvent(currentUserId, eventItem))
            {
                return Forbid();
            }

            // Delete event registrations first
            var registrations = await _context.EventRegistrations
                .Where(er => er.EventId == id)
                .ToListAsync();
            _context.EventRegistrations.RemoveRange(registrations);

            // Delete the event
            _context.Events.Remove(eventItem);
            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "EventDeleted",
                Description = $"Deleted event: {eventItem.Title}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Event deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting event");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting event"
            });
        }
    }

    // POST: api/Events/{id}/register
    [HttpPost("{id}/register")]
    public async Task<ActionResult<ApiResponse<object>>> RegisterForEvent(int id, [FromBody] EventRegistrationRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var eventItem = await _context.Events.FindAsync(id);

            if (eventItem == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Event not found"
                });
            }

            // Check if event requires registration
            if (!eventItem.IsRegistrationRequired)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "This event does not require registration"
                });
            }

            // Check if event type allows registration
            if (eventItem.EventType == "Announcement")
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Cannot register for announcement-only events"
                });
            }

            // Check if already registered
            var existingRegistration = await _context.EventRegistrations
                .FirstOrDefaultAsync(er => er.EventId == id && er.UserId == currentUserId);

            if (existingRegistration != null)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "You are already registered for this event"
                });
            }

            // Check capacity
            var currentRegistrations = await _context.EventRegistrations.CountAsync(er => er.EventId == id);
            if (currentRegistrations >= eventItem.MaxCapacity)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Event is at full capacity"
                });
            }

            var registration = new EventRegistration
            {
                EventId = id,
                UserId = currentUserId,
                NumberOfGuests = request.NumberOfGuests,
                RegistrationDate = DateTime.UtcNow,
                PaymentStatus = eventItem.EventFee > 0 ? "Pending" : "Free"
            };

            _context.EventRegistrations.Add(registration);
            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "EventRegistration",
                Description = $"Registered for event: {eventItem.Title}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Successfully registered for event"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering for event");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while registering for event"
            });
        }
    }

    // GET: api/Events/types
    [AllowAnonymous]
    [HttpGet("types")]
    public ActionResult<ApiResponse<List<EventTypeInfo>>> GetEventTypes()
    {
        var types = new List<EventTypeInfo>
        {
            new EventTypeInfo 
            { 
                Type = "CasecEvent", 
                DisplayName = "CASEC Event", 
                Description = "Official CASEC community events",
                Icon = "🎉",
                AllowsRegistration = true
            },
            new EventTypeInfo 
            { 
                Type = "PartnerEvent", 
                DisplayName = "Partner Event", 
                Description = "Events hosted by our partners",
                Icon = "🤝",
                AllowsRegistration = true
            },
            new EventTypeInfo 
            { 
                Type = "Announcement", 
                DisplayName = "Announcement", 
                Description = "Information and updates (view only)",
                Icon = "📢",
                AllowsRegistration = false
            }
        };

        return Ok(new ApiResponse<List<EventTypeInfo>>
        {
            Success = true,
            Data = types
        });
    }

    // GET: api/Events/categories
    [AllowAnonymous]
    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponse<List<string>>>> GetEventCategories()
    {
        try
        {
            var categories = await _context.Events
                .Where(e => !string.IsNullOrEmpty(e.EventCategory))
                .Select(e => e.EventCategory!)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Ok(new ApiResponse<List<string>>
            {
                Success = true,
                Data = categories
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching categories");
            return StatusCode(500, new ApiResponse<List<string>>
            {
                Success = false,
                Message = "An error occurred while fetching categories"
            });
        }
    }

    // GET: api/Events/{id}/assets (Get event photos and documents)
    [AllowAnonymous]
    [HttpGet("{id}/assets")]
    public async Task<ActionResult<ApiResponse<EventAssetsDto>>> GetEventAssets(int id)
    {
        try
        {
            var eventItem = await _context.Events.FindAsync(id);
            if (eventItem == null)
            {
                return NotFound(new ApiResponse<EventAssetsDto>
                {
                    Success = false,
                    Message = "Event not found"
                });
            }

            var assets = await _assetService.GetAssetsByObjectAsync("Event", id);

            var photos = assets
                .Where(a => a.ContentType.StartsWith("image/"))
                .Select(a => new EventAssetDto
                {
                    FileId = a.FileId,
                    FileName = a.OriginalFileName,
                    ContentType = a.ContentType,
                    FileSize = a.FileSize,
                    Url = $"/api/asset/{a.FileId}",
                    UploadedAt = a.CreatedAt
                })
                .ToList();

            var documents = assets
                .Where(a => !a.ContentType.StartsWith("image/"))
                .Select(a => new EventAssetDto
                {
                    FileId = a.FileId,
                    FileName = a.OriginalFileName,
                    ContentType = a.ContentType,
                    FileSize = a.FileSize,
                    Url = $"/api/asset/{a.FileId}",
                    UploadedAt = a.CreatedAt
                })
                .ToList();

            return Ok(new ApiResponse<EventAssetsDto>
            {
                Success = true,
                Data = new EventAssetsDto
                {
                    EventId = id,
                    Photos = photos,
                    Documents = documents
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching event assets");
            return StatusCode(500, new ApiResponse<EventAssetsDto>
            {
                Success = false,
                Message = "An error occurred while fetching event assets"
            });
        }
    }

    // POST: api/Events/{id}/photos (Upload event photos - Admin/Club Admin)
    [Authorize]
    [HttpPost("{id}/photos")]
    public async Task<ActionResult<ApiResponse<List<EventAssetDto>>>> UploadEventPhotos(int id, [FromForm] List<IFormFile> files)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var eventItem = await _context.Events.FindAsync(id);

            if (eventItem == null)
            {
                return NotFound(new ApiResponse<List<EventAssetDto>>
                {
                    Success = false,
                    Message = "Event not found"
                });
            }

            // Check permissions
            if (!await CanManageEvent(currentUserId, eventItem))
            {
                return Forbid();
            }

            if (files == null || !files.Any())
            {
                return BadRequest(new ApiResponse<List<EventAssetDto>>
                {
                    Success = false,
                    Message = "No files uploaded"
                });
            }

            var uploadedAssets = new List<EventAssetDto>();

            foreach (var file in files)
            {
                // Validate image type
                if (!file.ContentType.StartsWith("image/"))
                {
                    continue; // Skip non-image files
                }

                var result = await _assetService.UploadAssetAsync(
                    file,
                    $"events/{id}/photos",
                    objectType: "Event",
                    objectId: id,
                    uploadedBy: currentUserId
                );

                if (result.Success)
                {
                    uploadedAssets.Add(new EventAssetDto
                    {
                        FileId = result.FileId!.Value,
                        FileName = result.OriginalFileName!,
                        ContentType = result.ContentType!,
                        FileSize = result.FileSize,
                        Url = result.Url!,
                        UploadedAt = DateTime.UtcNow
                    });
                }
            }

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "EventPhotosUploaded",
                Description = $"Uploaded {uploadedAssets.Count} photos to event: {eventItem.Title}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<List<EventAssetDto>>
            {
                Success = true,
                Message = $"Successfully uploaded {uploadedAssets.Count} photos",
                Data = uploadedAssets
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading event photos");
            return StatusCode(500, new ApiResponse<List<EventAssetDto>>
            {
                Success = false,
                Message = "An error occurred while uploading photos"
            });
        }
    }

    // POST: api/Events/{id}/documents (Upload event documents - Admin/Club Admin)
    [Authorize]
    [HttpPost("{id}/documents")]
    public async Task<ActionResult<ApiResponse<List<EventAssetDto>>>> UploadEventDocuments(int id, [FromForm] List<IFormFile> files)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var eventItem = await _context.Events.FindAsync(id);

            if (eventItem == null)
            {
                return NotFound(new ApiResponse<List<EventAssetDto>>
                {
                    Success = false,
                    Message = "Event not found"
                });
            }

            // Check permissions
            if (!await CanManageEvent(currentUserId, eventItem))
            {
                return Forbid();
            }

            if (files == null || !files.Any())
            {
                return BadRequest(new ApiResponse<List<EventAssetDto>>
                {
                    Success = false,
                    Message = "No files uploaded"
                });
            }

            // Allowed document types
            var allowedTypes = new[] { "application/pdf", "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "text/plain", "text/csv" };

            var uploadedAssets = new List<EventAssetDto>();

            foreach (var file in files)
            {
                // Validate document type
                if (!allowedTypes.Contains(file.ContentType))
                {
                    continue; // Skip invalid file types
                }

                var result = await _assetService.UploadAssetAsync(
                    file,
                    $"events/{id}/documents",
                    objectType: "Event",
                    objectId: id,
                    uploadedBy: currentUserId
                );

                if (result.Success)
                {
                    uploadedAssets.Add(new EventAssetDto
                    {
                        FileId = result.FileId!.Value,
                        FileName = result.OriginalFileName!,
                        ContentType = result.ContentType!,
                        FileSize = result.FileSize,
                        Url = result.Url!,
                        UploadedAt = DateTime.UtcNow
                    });
                }
            }

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "EventDocumentsUploaded",
                Description = $"Uploaded {uploadedAssets.Count} documents to event: {eventItem.Title}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<List<EventAssetDto>>
            {
                Success = true,
                Message = $"Successfully uploaded {uploadedAssets.Count} documents",
                Data = uploadedAssets
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading event documents");
            return StatusCode(500, new ApiResponse<List<EventAssetDto>>
            {
                Success = false,
                Message = "An error occurred while uploading documents"
            });
        }
    }

    // DELETE: api/Events/{id}/assets/{fileId} (Delete event asset - Admin/Club Admin)
    [Authorize]
    [HttpDelete("{id}/assets/{fileId}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteEventAsset(int id, int fileId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var eventItem = await _context.Events.FindAsync(id);

            if (eventItem == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Event not found"
                });
            }

            // Check permissions
            if (!await CanManageEvent(currentUserId, eventItem))
            {
                return Forbid();
            }

            // Verify asset belongs to this event
            var asset = await _assetService.GetAssetAsync(fileId);
            if (asset == null || asset.ObjectType != "Event" || asset.ObjectId != id)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Asset not found for this event"
                });
            }

            var deleted = await _assetService.DeleteAssetAsync(fileId);

            if (!deleted)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to delete asset"
                });
            }

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "EventAssetDeleted",
                Description = $"Deleted asset from event: {eventItem.Title}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Asset deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting event asset");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting asset"
            });
        }
    }
}
