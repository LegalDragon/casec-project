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
                    ThumbnailUrl = e.ThumbnailUrl,
                    SourceUrl = e.SourceUrl,
                    TotalRegistrations = _context.EventRegistrations.Count(er => er.EventId == e.EventId),
                    SpotsRemaining = (e.MaxCapacity ?? 0) - _context.EventRegistrations.Count(er => er.EventId == e.EventId),
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
                    ThumbnailUrl = e.ThumbnailUrl,
                    SourceUrl = e.SourceUrl,
                    TotalRegistrations = _context.EventRegistrations.Count(er => er.EventId == e.EventId),
                    SpotsRemaining = (e.MaxCapacity ?? 0) - _context.EventRegistrations.Count(er => er.EventId == e.EventId),
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
                ThumbnailUrl = eventItem.ThumbnailUrl,
                TotalRegistrations = await _context.EventRegistrations.CountAsync(er => er.EventId == id),
                SpotsRemaining = (eventItem.MaxCapacity ?? 0) - await _context.EventRegistrations.CountAsync(er => er.EventId == id),
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
                EventFee = request.EventFee ?? 0,
                MaxCapacity = request.MaxCapacity ?? 0,
                IsRegistrationRequired = request.IsRegistrationRequired ?? true,
                IsFeatured = request.IsFeatured ?? false,
                ThumbnailUrl = request.ThumbnailUrl,
                SourceUrl = request.SourceUrl
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
            if (request.ThumbnailUrl != null)
                eventItem.ThumbnailUrl = request.ThumbnailUrl;
            if (request.SourceUrl != null)
                eventItem.SourceUrl = request.SourceUrl;

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

    // POST: api/Events/{id}/thumbnail (Admin or Club Admin)
    [Authorize]
    [HttpPost("{id}/thumbnail")]
    public async Task<ActionResult<ApiResponse<UploadResponse>>> UploadThumbnail(int id, IFormFile file)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var eventItem = await _context.Events.FindAsync(id);

            if (eventItem == null)
            {
                return NotFound(new ApiResponse<UploadResponse>
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

            // Delete old thumbnail asset if exists
            if (!string.IsNullOrEmpty(eventItem.ThumbnailUrl) && eventItem.ThumbnailUrl.StartsWith("/api/asset/"))
            {
                var oldFileIdStr = eventItem.ThumbnailUrl.Replace("/api/asset/", "");
                if (int.TryParse(oldFileIdStr, out var oldFileId))
                {
                    await _assetService.DeleteAssetAsync(oldFileId);
                }
            }

            // Upload new thumbnail using asset service
            var uploadResult = await _assetService.UploadAssetAsync(
                file,
                "events",
                objectType: "Event",
                objectId: eventItem.EventId,
                uploadedBy: currentUserId
            );

            if (!uploadResult.Success)
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = uploadResult.Error ?? "Failed to upload file"
                });
            }

            // Update event thumbnail URL
            eventItem.ThumbnailUrl = uploadResult.Url;
            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "EventThumbnailUpdated",
                Description = $"Updated thumbnail for event: {eventItem.Title}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<UploadResponse>
            {
                Success = true,
                Message = "Thumbnail uploaded successfully",
                Data = new UploadResponse { Url = uploadResult.Url }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading event thumbnail");
            return StatusCode(500, new ApiResponse<UploadResponse>
            {
                Success = false,
                Message = "An error occurred while uploading thumbnail"
            });
        }
    }

    // POST: api/Events/{id}/thumbnail-from-url (Admin or Club Admin)
    // Downloads an image from URL and saves it locally as an asset
    [Authorize]
    [HttpPost("{id}/thumbnail-from-url")]
    public async Task<ActionResult<ApiResponse<UploadResponse>>> UploadThumbnailFromUrl(int id, [FromBody] ThumbnailFromUrlRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var eventItem = await _context.Events.FindAsync(id);

            if (eventItem == null)
            {
                return NotFound(new ApiResponse<UploadResponse>
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

            if (string.IsNullOrWhiteSpace(request.ImageUrl))
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = "Image URL is required"
                });
            }

            // Validate URL format
            if (!Uri.TryCreate(request.ImageUrl, UriKind.Absolute, out var uri) ||
                (uri.Scheme != "http" && uri.Scheme != "https"))
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = "Invalid URL format"
                });
            }

            // Download the image
            using var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(30);
            httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            httpClient.DefaultRequestHeaders.Add("Accept", "image/webp,image/apng,image/*,*/*;q=0.8");
            httpClient.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");
            // Set Referer to the image's own domain to bypass referrer checks
            httpClient.DefaultRequestHeaders.Add("Referer", $"{uri.Scheme}://{uri.Host}/");

            HttpResponseMessage response;
            try
            {
                response = await httpClient.GetAsync(uri);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to download image from {Url}", request.ImageUrl);
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = "Failed to download image from URL"
                });
            }

            if (!response.IsSuccessStatusCode)
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = $"Failed to download image: {response.StatusCode}"
                });
            }

            // Validate content type
            var contentType = response.Content.Headers.ContentType?.MediaType ?? "";
            if (!contentType.StartsWith("image/"))
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = "URL does not point to a valid image"
                });
            }

            // Get the image data
            var imageData = await response.Content.ReadAsByteArrayAsync();

            // Check file size (max 10MB)
            if (imageData.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = "Image is too large (max 10MB)"
                });
            }

            // Determine file extension from content type
            var extension = contentType switch
            {
                "image/jpeg" => ".jpg",
                "image/png" => ".png",
                "image/gif" => ".gif",
                "image/webp" => ".webp",
                _ => ".jpg"
            };

            // Create a memory stream and form file
            using var stream = new MemoryStream(imageData);
            var fileName = $"thumbnail_{eventItem.EventId}_{DateTime.UtcNow.Ticks}{extension}";
            var formFile = new FormFile(stream, 0, imageData.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };

            // Delete old thumbnail asset if exists
            if (!string.IsNullOrEmpty(eventItem.ThumbnailUrl) && eventItem.ThumbnailUrl.StartsWith("/api/asset/"))
            {
                var oldFileIdStr = eventItem.ThumbnailUrl.Replace("/api/asset/", "");
                if (int.TryParse(oldFileIdStr, out var oldFileId))
                {
                    await _assetService.DeleteAssetAsync(oldFileId);
                }
            }

            // Upload using asset service
            var uploadResult = await _assetService.UploadAssetAsync(
                formFile,
                "events",
                objectType: "Event",
                objectId: eventItem.EventId,
                uploadedBy: currentUserId
            );

            if (!uploadResult.Success)
            {
                return BadRequest(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = uploadResult.Error ?? "Failed to save image"
                });
            }

            // Update event thumbnail URL
            eventItem.ThumbnailUrl = uploadResult.Url;
            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "EventThumbnailUpdated",
                Description = $"Updated thumbnail for event: {eventItem.Title} (from URL)"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<UploadResponse>
            {
                Success = true,
                Message = "Thumbnail saved successfully",
                Data = new UploadResponse { Url = uploadResult.Url }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving thumbnail from URL");
            return StatusCode(500, new ApiResponse<UploadResponse>
            {
                Success = false,
                Message = "An error occurred while saving thumbnail"
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
            if (eventItem.IsRegistrationRequired != true)
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

    // POST: api/Events/{id}/unregister
    [HttpPost("{id}/unregister")]
    public async Task<ActionResult<ApiResponse<object>>> UnregisterFromEvent(int id)
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

            // Check if event has already passed
            if (eventItem.EventDate < DateTime.UtcNow)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Cannot unregister from a past event"
                });
            }

            // Find existing registration
            var registration = await _context.EventRegistrations
                .FirstOrDefaultAsync(er => er.EventId == id && er.UserId == currentUserId);

            if (registration == null)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "You are not registered for this event"
                });
            }

            _context.EventRegistrations.Remove(registration);
            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "EventUnregistration",
                Description = $"Unregistered from event: {eventItem.Title}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Successfully unregistered from event"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unregistering from event");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while unregistering from event"
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

    // GET: api/Events/{id}/assets (Get event photos and documents - admin gets all, public gets only Public status)
    [AllowAnonymous]
    [HttpGet("{id}/assets")]
    public async Task<ActionResult<ApiResponse<EventAssetsDto>>> GetEventAssets(int id, [FromQuery] bool includePrivate = false)
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

            var currentUserId = GetCurrentUserId();
            var canManage = currentUserId > 0 && await CanManageEvent(currentUserId, eventItem);

            var assets = await _assetService.GetAssetsByObjectAsync("Event", id);

            // Filter by status if not admin or includePrivate not requested
            if (!canManage || !includePrivate)
            {
                assets = assets.Where(a => a.Status == "Public").ToList();
            }

            var photos = assets
                .Where(a => a.ContentType.StartsWith("image/"))
                .OrderBy(a => a.SortOrder)
                .ThenByDescending(a => a.CreatedAt)
                .Select(a => new EventAssetDto
                {
                    FileId = a.FileId,
                    FileName = a.OriginalFileName,
                    ContentType = a.ContentType,
                    FileSize = a.FileSize,
                    Url = $"/api/asset/{a.FileId}",
                    Status = a.Status,
                    SortOrder = a.SortOrder,
                    Caption = a.Caption,
                    UploadedAt = a.CreatedAt
                })
                .ToList();

            var documents = assets
                .Where(a => !a.ContentType.StartsWith("image/"))
                .OrderBy(a => a.SortOrder)
                .ThenByDescending(a => a.CreatedAt)
                .Select(a => new EventAssetDto
                {
                    FileId = a.FileId,
                    FileName = a.OriginalFileName,
                    ContentType = a.ContentType,
                    FileSize = a.FileSize,
                    Url = $"/api/asset/{a.FileId}",
                    Status = a.Status,
                    SortOrder = a.SortOrder,
                    Caption = a.Caption,
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

    // GET: api/Events/{id}/registrants (Get event registrants - members only)
    [Authorize]
    [HttpGet("{id}/registrants")]
    public async Task<ActionResult<ApiResponse<List<EventRegistrantDto>>>> GetEventRegistrants(int id)
    {
        try
        {
            var eventItem = await _context.Events.FindAsync(id);
            if (eventItem == null)
            {
                return NotFound(new ApiResponse<List<EventRegistrantDto>>
                {
                    Success = false,
                    Message = "Event not found"
                });
            }

            var registrants = await _context.EventRegistrations
                .Where(er => er.EventId == id)
                .Include(er => er.User)
                .OrderBy(er => er.RegistrationDate)
                .Select(er => new EventRegistrantDto
                {
                    UserId = er.UserId,
                    FirstName = er.User!.FirstName,
                    LastName = er.User!.LastName,
                    AvatarUrl = er.User!.AvatarUrl,
                    NumberOfGuests = er.NumberOfGuests,
                    RegistrationDate = er.RegistrationDate,
                    PaymentStatus = er.PaymentStatus
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<EventRegistrantDto>>
            {
                Success = true,
                Data = registrants
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching event registrants");
            return StatusCode(500, new ApiResponse<List<EventRegistrantDto>>
            {
                Success = false,
                Message = "An error occurred while fetching event registrants"
            });
        }
    }

    // GET: api/Events/{id}/detail (Get event with assets and registrants)
    [AllowAnonymous]
    [HttpGet("{id}/detail")]
    public async Task<ActionResult<ApiResponse<EventDetailDto>>> GetEventDetail(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var eventItem = await _context.Events
                .Include(e => e.HostClub)
                .FirstOrDefaultAsync(e => e.EventId == id);

            if (eventItem == null)
            {
                return NotFound(new ApiResponse<EventDetailDto>
                {
                    Success = false,
                    Message = "Event not found"
                });
            }

            var canManage = currentUserId > 0 && await CanManageEvent(currentUserId, eventItem);
            var isAuthenticated = currentUserId > 0;

            // Get public assets only for public view
            var assets = await _assetService.GetAssetsByObjectAsync("Event", id);
            var publicAssets = assets.Where(a => a.Status == "Public").ToList();

            var photos = publicAssets
                .Where(a => a.ContentType.StartsWith("image/"))
                .OrderBy(a => a.SortOrder)
                .ThenByDescending(a => a.CreatedAt)
                .Select(a => new EventAssetDto
                {
                    FileId = a.FileId,
                    FileName = a.OriginalFileName,
                    ContentType = a.ContentType,
                    FileSize = a.FileSize,
                    Url = $"/api/asset/{a.FileId}",
                    Status = a.Status,
                    SortOrder = a.SortOrder,
                    Caption = a.Caption,
                    UploadedAt = a.CreatedAt
                })
                .ToList();

            var documents = publicAssets
                .Where(a => !a.ContentType.StartsWith("image/"))
                .OrderBy(a => a.SortOrder)
                .ThenByDescending(a => a.CreatedAt)
                .Select(a => new EventAssetDto
                {
                    FileId = a.FileId,
                    FileName = a.OriginalFileName,
                    ContentType = a.ContentType,
                    FileSize = a.FileSize,
                    Url = $"/api/asset/{a.FileId}",
                    Status = a.Status,
                    SortOrder = a.SortOrder,
                    Caption = a.Caption,
                    UploadedAt = a.CreatedAt
                })
                .ToList();

            // Get registrants (only for authenticated users)
            var registrants = new List<EventRegistrantDto>();
            if (isAuthenticated)
            {
                registrants = await _context.EventRegistrations
                    .Where(er => er.EventId == id)
                    .Include(er => er.User)
                    .OrderBy(er => er.RegistrationDate)
                    .Select(er => new EventRegistrantDto
                    {
                        UserId = er.UserId,
                        FirstName = er.User!.FirstName,
                        LastName = er.User!.LastName,
                        AvatarUrl = er.User!.AvatarUrl,
                        NumberOfGuests = er.NumberOfGuests,
                        RegistrationDate = er.RegistrationDate,
                        PaymentStatus = er.PaymentStatus
                    })
                    .ToListAsync();
            }

            var totalRegistrations = await _context.EventRegistrations.CountAsync(er => er.EventId == id);

            var eventDetail = new EventDetailDto
            {
                EventId = eventItem.EventId,
                Title = eventItem.Title,
                Description = eventItem.Description,
                EventDate = eventItem.EventDate,
                Location = eventItem.Location,
                EventType = eventItem.EventType,
                EventCategory = eventItem.EventCategory,
                EventScope = eventItem.EventScope,
                HostClubId = eventItem.HostClubId,
                HostClubName = eventItem.HostClub?.Name,
                HostClubAvatar = eventItem.HostClub?.AvatarUrl,
                PartnerName = eventItem.PartnerName,
                PartnerLogo = eventItem.PartnerLogo,
                PartnerWebsite = eventItem.PartnerWebsite,
                RegistrationUrl = eventItem.RegistrationUrl,
                EventFee = eventItem.EventFee,
                MaxCapacity = eventItem.MaxCapacity,
                IsRegistrationRequired = eventItem.IsRegistrationRequired,
                IsFeatured = eventItem.IsFeatured,
                TotalRegistrations = totalRegistrations,
                SpotsRemaining = (eventItem.MaxCapacity ?? 0) - totalRegistrations,
                IsUserRegistered = currentUserId > 0 &&
                    await _context.EventRegistrations.AnyAsync(er => er.EventId == id && er.UserId == currentUserId),
                CreatedAt = eventItem.CreatedAt,
                Photos = photos,
                Documents = documents,
                Registrants = registrants
            };

            return Ok(new ApiResponse<EventDetailDto>
            {
                Success = true,
                Data = eventDetail
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching event detail");
            return StatusCode(500, new ApiResponse<EventDetailDto>
            {
                Success = false,
                Message = "An error occurred while fetching event detail"
            });
        }
    }

    // PUT: api/Events/{id}/assets/{fileId} (Update asset status, sortOrder, caption - Admin/Club Admin)
    [Authorize]
    [HttpPut("{id}/assets/{fileId}")]
    public async Task<ActionResult<ApiResponse<EventAssetDto>>> UpdateEventAsset(int id, int fileId, [FromBody] UpdateAssetRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var eventItem = await _context.Events.FindAsync(id);

            if (eventItem == null)
            {
                return NotFound(new ApiResponse<EventAssetDto>
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

            // Get asset and verify it belongs to this event
            var asset = await _context.Assets.FindAsync(fileId);
            if (asset == null || asset.ObjectType != "Event" || asset.ObjectId != id || asset.IsDeleted)
            {
                return NotFound(new ApiResponse<EventAssetDto>
                {
                    Success = false,
                    Message = "Asset not found for this event"
                });
            }

            // Update asset properties
            if (request.Status != null)
            {
                // Validate status
                var validStatuses = new[] { "Public", "Private", "MembersOnly" };
                if (!validStatuses.Contains(request.Status))
                {
                    return BadRequest(new ApiResponse<EventAssetDto>
                    {
                        Success = false,
                        Message = "Invalid status. Must be 'Public', 'Private', or 'MembersOnly'"
                    });
                }
                asset.Status = request.Status;
            }

            if (request.SortOrder.HasValue)
            {
                asset.SortOrder = request.SortOrder.Value;
            }

            if (request.Caption != null)
            {
                asset.Caption = request.Caption;
            }

            await _context.SaveChangesAsync();

            var updatedAsset = new EventAssetDto
            {
                FileId = asset.FileId,
                FileName = asset.OriginalFileName,
                ContentType = asset.ContentType,
                FileSize = asset.FileSize,
                Url = $"/api/asset/{asset.FileId}",
                Status = asset.Status,
                SortOrder = asset.SortOrder,
                Caption = asset.Caption,
                UploadedAt = asset.CreatedAt
            };

            return Ok(new ApiResponse<EventAssetDto>
            {
                Success = true,
                Message = "Asset updated successfully",
                Data = updatedAsset
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating event asset");
            return StatusCode(500, new ApiResponse<EventAssetDto>
            {
                Success = false,
                Message = "An error occurred while updating asset"
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
