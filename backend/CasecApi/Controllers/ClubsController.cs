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
[Route("[controller]")]
public class ClubsController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly IAssetService _assetService;
    private readonly ILogger<ClubsController> _logger;

    public ClubsController(CasecDbContext context, IAssetService assetService, ILogger<ClubsController> logger)
    {
        _context = context;
        _assetService = assetService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    private async Task<bool> IsClubAdmin(int userId, int clubId)
    {
        return await _context.ClubAdmins.AnyAsync(ca => ca.UserId == userId && ca.ClubId == clubId);
    }

    private async Task<bool> IsSystemAdmin(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user != null && user.IsAdmin;
    }

    // GET: api/Clubs
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ClubDetailDto>>>> GetClubs()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            var clubs = await _context.Clubs
                .Where(club => club.IsActive)
                .ToListAsync();

            var clubDtos = new List<ClubDetailDto>();
            
            foreach (var club in clubs)
            {
                var totalMembers = await _context.ClubMemberships
                    .Where(cm => cm.ClubId == club.ClubId)
                    .CountAsync();
                
                var admins = await _context.ClubAdmins
                    .Where(ca => ca.ClubId == club.ClubId)
                    .Include(ca => ca.User)
                    .Select(ca => new ClubAdminDto
                    {
                        UserId = ca.User!.UserId,
                        UserName = ca.User.FirstName + " " + ca.User.LastName,
                        Email = ca.User.Email,
                        AvatarUrl = ca.User.AvatarUrl,
                        AssignedDate = ca.AssignedDate
                    })
                    .ToListAsync();
                
                var isUserMember = currentUserId > 0 && 
                    await _context.ClubMemberships.AnyAsync(cm => cm.ClubId == club.ClubId && cm.UserId == currentUserId);
                
                var isUserAdmin = currentUserId > 0 && 
                    await _context.ClubAdmins.AnyAsync(ca => ca.ClubId == club.ClubId && ca.UserId == currentUserId);

                clubDtos.Add(new ClubDetailDto
                {
                    ClubId = club.ClubId,
                    Name = club.Name,
                    Description = club.Description,
                    AvatarUrl = club.AvatarUrl,
                    FoundedDate = club.FoundedDate,
                    MeetingSchedule = club.MeetingSchedule,
                    ContactEmail = club.ContactEmail,
                    IsActive = club.IsActive,
                    TotalMembers = totalMembers,
                    Admins = admins,
                    IsUserMember = isUserMember,
                    IsUserAdmin = isUserAdmin,
                    CreatedAt = club.CreatedAt
                });
            }

            return Ok(new ApiResponse<List<ClubDetailDto>>
            {
                Success = true,
                Data = clubDtos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching clubs");
            return StatusCode(500, new ApiResponse<List<ClubDetailDto>>
            {
                Success = false,
                Message = "An error occurred while fetching clubs"
            });
        }
    }

    // GET: api/Clubs/{id}
    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ClubDetailDto>>> GetClub(int id)
    {
        try
        {
            var club = await _context.Clubs.FindAsync(id);
            if (club == null)
            {
                return NotFound(new ApiResponse<ClubDetailDto>
                {
                    Success = false,
                    Message = "Club not found"
                });
            }

            var currentUserId = GetCurrentUserId();

            var totalMembers = await _context.ClubMemberships
                .Where(cm => cm.ClubId == club.ClubId)
                .CountAsync();

            var admins = await _context.ClubAdmins
                .Where(ca => ca.ClubId == club.ClubId)
                .Include(ca => ca.User)
                .Select(ca => new ClubAdminDto
                {
                    UserId = ca.User!.UserId,
                    UserName = ca.User.FirstName + " " + ca.User.LastName,
                    Email = ca.User.Email,
                    AvatarUrl = ca.User.AvatarUrl,
                    AssignedDate = ca.AssignedDate
                })
                .ToListAsync();

            var members = await _context.ClubMemberships
                .Where(cm => cm.ClubId == club.ClubId)
                .Include(cm => cm.User)
                .OrderBy(cm => cm.User!.FirstName)
                .ThenBy(cm => cm.User!.LastName)
                .Select(cm => new ClubMemberDto
                {
                    UserId = cm.User!.UserId,
                    FirstName = cm.User.FirstName,
                    LastName = cm.User.LastName,
                    Email = cm.User.Email,
                    AvatarUrl = cm.User.AvatarUrl,
                    JoinedDate = cm.JoinedDate,
                    IsAdmin = _context.ClubAdmins.Any(ca => ca.ClubId == club.ClubId && ca.UserId == cm.UserId)
                })
                .ToListAsync();

            var isUserMember = currentUserId > 0 &&
                await _context.ClubMemberships.AnyAsync(cm => cm.ClubId == club.ClubId && cm.UserId == currentUserId);

            var isUserAdmin = currentUserId > 0 &&
                await _context.ClubAdmins.AnyAsync(ca => ca.ClubId == club.ClubId && ca.UserId == currentUserId);

            var clubDto = new ClubDetailDto
            {
                ClubId = club.ClubId,
                Name = club.Name,
                Description = club.Description,
                AvatarUrl = club.AvatarUrl,
                FoundedDate = club.FoundedDate,
                MeetingSchedule = club.MeetingSchedule,
                ContactEmail = club.ContactEmail,
                IsActive = club.IsActive,
                TotalMembers = totalMembers,
                Admins = admins,
                Members = members,
                IsUserMember = isUserMember,
                IsUserAdmin = isUserAdmin,
                CreatedAt = club.CreatedAt
            };

            return Ok(new ApiResponse<ClubDetailDto>
            {
                Success = true,
                Data = clubDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching club");
            return StatusCode(500, new ApiResponse<ClubDetailDto>
            {
                Success = false,
                Message = "An error occurred while fetching club"
            });
        }
    }

    // GET: api/Clubs/my-clubs
    [Authorize]
    [HttpGet("my-clubs")]
    public async Task<ActionResult<ApiResponse<List<ClubDetailDto>>>> GetMyClubs()
    {
        try
        {
            var currentUserId = GetCurrentUserId();

            var myClubIds = await _context.ClubMemberships
                .Where(cm => cm.UserId == currentUserId)
                .Select(cm => cm.ClubId)
                .ToListAsync();

            var clubs = await _context.Clubs
                .Where(club => myClubIds.Contains(club.ClubId) && club.IsActive)
                .ToListAsync();

            var clubDtos = new List<ClubDetailDto>();

            foreach (var club in clubs)
            {
                var totalMembers = await _context.ClubMemberships
                    .Where(cm => cm.ClubId == club.ClubId)
                    .CountAsync();

                var admins = await _context.ClubAdmins
                    .Where(ca => ca.ClubId == club.ClubId)
                    .Include(ca => ca.User)
                    .Select(ca => new ClubAdminDto
                    {
                        UserId = ca.User!.UserId,
                        UserName = ca.User.FirstName + " " + ca.User.LastName,
                        Email = ca.User.Email,
                        AvatarUrl = ca.User.AvatarUrl,
                        AssignedDate = ca.AssignedDate
                    })
                    .ToListAsync();

                var isUserAdmin = await _context.ClubAdmins.AnyAsync(ca => ca.ClubId == club.ClubId && ca.UserId == currentUserId);

                clubDtos.Add(new ClubDetailDto
                {
                    ClubId = club.ClubId,
                    Name = club.Name,
                    Description = club.Description,
                    AvatarUrl = club.AvatarUrl,
                    FoundedDate = club.FoundedDate,
                    MeetingSchedule = club.MeetingSchedule,
                    ContactEmail = club.ContactEmail,
                    IsActive = club.IsActive,
                    TotalMembers = totalMembers,
                    Admins = admins,
                    IsUserMember = true,
                    IsUserAdmin = isUserAdmin,
                    CreatedAt = club.CreatedAt
                });
            }

            return Ok(new ApiResponse<List<ClubDetailDto>>
            {
                Success = true,
                Data = clubDtos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user clubs");
            return StatusCode(500, new ApiResponse<List<ClubDetailDto>>
            {
                Success = false,
                Message = "An error occurred while fetching your clubs"
            });
        }
    }

    // POST: api/Clubs/{id}/join
    [Authorize]
    [HttpPost("{id}/join")]
    public async Task<ActionResult<ApiResponse<string>>> JoinClub(int id)
    {
        try
        {
            var club = await _context.Clubs.FindAsync(id);
            if (club == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Club not found"
                });
            }

            if (!club.IsActive)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Success = false,
                    Message = "This club is not active"
                });
            }

            var currentUserId = GetCurrentUserId();

            // Check if already a member
            var existingMembership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == id && cm.UserId == currentUserId);

            if (existingMembership != null)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Success = false,
                    Message = "You are already a member of this club"
                });
            }

            var membership = new ClubMembership
            {
                ClubId = id,
                UserId = currentUserId,
                JoinedDate = DateTime.UtcNow
            };

            _context.ClubMemberships.Add(membership);
            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "ClubJoined",
                Description = $"Joined club: {club.Name}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string>
            {
                Success = true,
                Message = $"Successfully joined {club.Name}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining club");
            return StatusCode(500, new ApiResponse<string>
            {
                Success = false,
                Message = "An error occurred while joining the club"
            });
        }
    }

    // POST: api/Clubs/{id}/leave
    [Authorize]
    [HttpPost("{id}/leave")]
    public async Task<ActionResult<ApiResponse<string>>> LeaveClub(int id)
    {
        try
        {
            var club = await _context.Clubs.FindAsync(id);
            if (club == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Club not found"
                });
            }

            var currentUserId = GetCurrentUserId();

            // Check if user is a member
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == id && cm.UserId == currentUserId);

            if (membership == null)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Success = false,
                    Message = "You are not a member of this club"
                });
            }

            // Check if user is a club admin - remove admin role first
            var adminRole = await _context.ClubAdmins
                .FirstOrDefaultAsync(ca => ca.ClubId == id && ca.UserId == currentUserId);

            if (adminRole != null)
            {
                _context.ClubAdmins.Remove(adminRole);
            }

            _context.ClubMemberships.Remove(membership);
            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "ClubLeft",
                Description = $"Left club: {club.Name}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string>
            {
                Success = true,
                Message = $"Successfully left {club.Name}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving club");
            return StatusCode(500, new ApiResponse<string>
            {
                Success = false,
                Message = "An error occurred while leaving the club"
            });
        }
    }

    // POST: api/Clubs (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ClubDetailDto>>> CreateClub([FromBody] CreateClubRequest request)
    {
        try
        {
            var club = new Club
            {
                Name = request.Name,
                Description = request.Description,
                FoundedDate = request.FoundedDate,
                MeetingSchedule = request.MeetingSchedule,
                ContactEmail = request.ContactEmail,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Clubs.Add(club);
            await _context.SaveChangesAsync();

            // Log activity
            var currentUserId = GetCurrentUserId();
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "ClubCreated",
                Description = $"Created club: {club.Name}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            var clubDto = new ClubDetailDto
            {
                ClubId = club.ClubId,
                Name = club.Name,
                Description = club.Description,
                AvatarUrl = club.AvatarUrl,
                FoundedDate = club.FoundedDate,
                MeetingSchedule = club.MeetingSchedule,
                ContactEmail = club.ContactEmail,
                IsActive = club.IsActive,
                TotalMembers = 0,
                Admins = new List<ClubAdminDto>(),
                IsUserMember = false,
                IsUserAdmin = false,
                CreatedAt = club.CreatedAt
            };

            return Ok(new ApiResponse<ClubDetailDto>
            {
                Success = true,
                Message = "Club created successfully",
                Data = clubDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating club");
            return StatusCode(500, new ApiResponse<ClubDetailDto>
            {
                Success = false,
                Message = "An error occurred while creating club"
            });
        }
    }

    // PUT: api/Clubs/{id} (Admin or Club Admin)
    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ClubDetailDto>>> UpdateClub(int id, [FromBody] UpdateClubRequest request)
    {
        try
        {
            var club = await _context.Clubs.FindAsync(id);
            if (club == null)
            {
                return NotFound(new ApiResponse<ClubDetailDto>
                {
                    Success = false,
                    Message = "Club not found"
                });
            }

            var currentUserId = GetCurrentUserId();
            var isSystemAdminUser = await IsSystemAdmin(currentUserId);
            var isClubAdminUser = await IsClubAdmin(currentUserId, id);

            if (!isSystemAdminUser && !isClubAdminUser)
            {
                return Forbid();
            }

            // Update fields
            if (!string.IsNullOrEmpty(request.Name))
                club.Name = request.Name;
            
            if (request.Description != null)
                club.Description = request.Description;
            
            if (request.FoundedDate.HasValue)
                club.FoundedDate = request.FoundedDate;
            
            if (request.MeetingSchedule != null)
                club.MeetingSchedule = request.MeetingSchedule;
            
            if (request.ContactEmail != null)
                club.ContactEmail = request.ContactEmail;

            // Only system admin can change IsActive
            if (request.IsActive.HasValue && isSystemAdminUser)
                club.IsActive = request.IsActive.Value;

            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "ClubUpdated",
                Description = $"Updated club: {club.Name}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            var totalMembers = await _context.ClubMemberships
                .Where(cm => cm.ClubId == club.ClubId)
                .CountAsync();
            
            var admins = await _context.ClubAdmins
                .Where(ca => ca.ClubId == club.ClubId)
                .Include(ca => ca.User)
                .Select(ca => new ClubAdminDto
                {
                    UserId = ca.User!.UserId,
                    UserName = ca.User.FirstName + " " + ca.User.LastName,
                    Email = ca.User.Email,
                    AvatarUrl = ca.User.AvatarUrl,
                    AssignedDate = ca.AssignedDate
                })
                .ToListAsync();

            var clubDto = new ClubDetailDto
            {
                ClubId = club.ClubId,
                Name = club.Name,
                Description = club.Description,
                AvatarUrl = club.AvatarUrl,
                FoundedDate = club.FoundedDate,
                MeetingSchedule = club.MeetingSchedule,
                ContactEmail = club.ContactEmail,
                IsActive = club.IsActive,
                TotalMembers = totalMembers,
                Admins = admins,
                IsUserMember = await _context.ClubMemberships.AnyAsync(cm => cm.ClubId == club.ClubId && cm.UserId == currentUserId),
                IsUserAdmin = await _context.ClubAdmins.AnyAsync(ca => ca.ClubId == club.ClubId && ca.UserId == currentUserId),
                CreatedAt = club.CreatedAt
            };

            return Ok(new ApiResponse<ClubDetailDto>
            {
                Success = true,
                Message = "Club updated successfully",
                Data = clubDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating club");
            return StatusCode(500, new ApiResponse<ClubDetailDto>
            {
                Success = false,
                Message = "An error occurred while updating club"
            });
        }
    }

    // POST: api/Clubs/{id}/avatar (Admin or Club Admin)
    [Authorize]
    [HttpPost("{id}/avatar")]
    public async Task<ActionResult<ApiResponse<UploadResponse>>> UploadClubAvatar(int id, IFormFile file)
    {
        try
        {
            var club = await _context.Clubs.FindAsync(id);
            if (club == null)
            {
                return NotFound(new ApiResponse<UploadResponse>
                {
                    Success = false,
                    Message = "Club not found"
                });
            }

            var currentUserId = GetCurrentUserId();
            var isSystemAdminUser = await IsSystemAdmin(currentUserId);
            var isClubAdminUser = await IsClubAdmin(currentUserId, id);

            if (!isSystemAdminUser && !isClubAdminUser)
            {
                return Forbid();
            }

            // Delete old avatar asset if exists (by parsing FileId from URL /asset/{id})
            if (!string.IsNullOrEmpty(club.AvatarUrl) && club.AvatarUrl.StartsWith("/asset/"))
            {
                var oldFileIdStr = club.AvatarUrl.Replace("/asset/", "");
                if (int.TryParse(oldFileIdStr, out var oldFileId))
                {
                    await _assetService.DeleteAssetAsync(oldFileId);
                }
            }

            // Upload new avatar using asset service (saves to database)
            var uploadResult = await _assetService.UploadAssetAsync(
                file,
                "clubs",
                objectType: "Club",
                objectId: club.ClubId,
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

            club.AvatarUrl = uploadResult.Url; // Now saves as /asset/{id}
            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "ClubAvatarUpdated",
                Description = $"Updated avatar for club: {club.Name}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<UploadResponse>
            {
                Success = true,
                Message = "Avatar uploaded successfully",
                Data = new UploadResponse { Url = club.AvatarUrl }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading club avatar");
            return StatusCode(500, new ApiResponse<UploadResponse>
            {
                Success = false,
                Message = "An error occurred while uploading avatar"
            });
        }
    }

    // POST: api/Clubs/{id}/admins (System Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/admins")]
    public async Task<ActionResult<ApiResponse<string>>> AssignClubAdmin(int id, [FromBody] AssignClubAdminRequest request)
    {
        try
        {
            var club = await _context.Clubs.FindAsync(id);
            if (club == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Club not found"
                });
            }

            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Check if already admin
            var existingAdmin = await _context.ClubAdmins
                .FirstOrDefaultAsync(ca => ca.ClubId == id && ca.UserId == request.UserId);
            
            if (existingAdmin != null)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Success = false,
                    Message = "User is already a club admin"
                });
            }

            // Check if user is a member
            var isMember = await _context.ClubMemberships
                .AnyAsync(cm => cm.ClubId == id && cm.UserId == request.UserId);
            
            if (!isMember)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Success = false,
                    Message = "User must be a club member before being assigned as admin"
                });
            }

            var currentUserId = GetCurrentUserId();
            var clubAdmin = new ClubAdmin
            {
                ClubId = id,
                UserId = request.UserId,
                AssignedDate = DateTime.UtcNow,
                AssignedBy = currentUserId
            };

            _context.ClubAdmins.Add(clubAdmin);
            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "ClubAdminAssigned",
                Description = $"Assigned {user.FirstName} {user.LastName} as admin of {club.Name}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string>
            {
                Success = true,
                Message = "Club admin assigned successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning club admin");
            return StatusCode(500, new ApiResponse<string>
            {
                Success = false,
                Message = "An error occurred while assigning club admin"
            });
        }
    }

    // DELETE: api/Clubs/{id}/admins/{userId} (System Admin only)
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}/admins/{userId}")]
    public async Task<ActionResult<ApiResponse<string>>> RemoveClubAdmin(int id, int userId)
    {
        try
        {
            var clubAdmin = await _context.ClubAdmins
                .FirstOrDefaultAsync(ca => ca.ClubId == id && ca.UserId == userId);
            
            if (clubAdmin == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Club admin assignment not found"
                });
            }

            _context.ClubAdmins.Remove(clubAdmin);
            await _context.SaveChangesAsync();

            // Log activity
            var currentUserId = GetCurrentUserId();
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "ClubAdminRemoved",
                Description = $"Removed club admin (UserId: {userId}) from club (ClubId: {id})"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string>
            {
                Success = true,
                Message = "Club admin removed successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing club admin");
            return StatusCode(500, new ApiResponse<string>
            {
                Success = false,
                Message = "An error occurred while removing club admin"
            });
        }
    }

    // GET: api/Clubs/{id}/events
    [AllowAnonymous]
    [HttpGet("{id}/events")]
    public async Task<ActionResult<ApiResponse<List<EventDto>>>> GetClubEvents(int id)
    {
        try
        {
            var club = await _context.Clubs.FindAsync(id);
            if (club == null)
            {
                return NotFound(new ApiResponse<List<EventDto>>
                {
                    Success = false,
                    Message = "Club not found"
                });
            }

            var events = await _context.Events
                .Where(e => e.HostClubId == id)
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
                    RegistrationUrl = e.RegistrationUrl,
                    EventFee = e.EventFee,
                    MaxCapacity = e.MaxCapacity,
                    IsFeatured = e.IsFeatured,
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
            _logger.LogError(ex, "Error fetching club events");
            return StatusCode(500, new ApiResponse<List<EventDto>>
            {
                Success = false,
                Message = "An error occurred while fetching club events"
            });
        }
    }

    // GET: api/Clubs/{id}/members
    [AllowAnonymous]
    [HttpGet("{id}/members")]
    public async Task<ActionResult<ApiResponse<List<ClubMemberDto>>>> GetClubMembers(int id)
    {
        try
        {
            var club = await _context.Clubs.FindAsync(id);
            if (club == null)
            {
                return NotFound(new ApiResponse<List<ClubMemberDto>>
                {
                    Success = false,
                    Message = "Club not found"
                });
            }

            var members = await _context.ClubMemberships
                .Where(cm => cm.ClubId == id)
                .Include(cm => cm.User)
                .OrderBy(cm => cm.User!.FirstName)
                .ThenBy(cm => cm.User!.LastName)
                .Select(cm => new ClubMemberDto
                {
                    UserId = cm.User!.UserId,
                    FirstName = cm.User.FirstName,
                    LastName = cm.User.LastName,
                    Email = cm.User.Email,
                    AvatarUrl = cm.User.AvatarUrl,
                    JoinedDate = cm.JoinedDate,
                    IsAdmin = _context.ClubAdmins.Any(ca => ca.ClubId == id && ca.UserId == cm.UserId)
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<ClubMemberDto>>
            {
                Success = true,
                Data = members
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching club members");
            return StatusCode(500, new ApiResponse<List<ClubMemberDto>>
            {
                Success = false,
                Message = "An error occurred while fetching club members"
            });
        }
    }
}
