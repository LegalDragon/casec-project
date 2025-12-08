using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using CasecApi.Data;
using CasecApi.Models.DTOs;
using UserEntity = CasecApi.Models.User;
using CasecApi.Models;
using CasecApi.Services;

namespace CasecApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<UsersController> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly IAssetService _assetService;

    public UsersController(CasecDbContext context, ILogger<UsersController> logger, IWebHostEnvironment environment, IAssetService assetService)
    {
        _context = context;
        _logger = logger;
        _environment = environment;
        _assetService = assetService;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    // GET: api/Users/profile
    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetProfile()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var user = await _context.Users
                .Include(u => u.MembershipType)
                .FirstOrDefaultAsync(u => u.UserId == currentUserId);

            if (user == null)
            {
                return NotFound(new ApiResponse<UserProfileDto>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            var profile = new UserProfileDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                ChineseName = user.ChineseName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Address = user.Address,
                City = user.City,
                State = user.State,
                ZipCode = user.ZipCode,
                Profession = user.Profession,
                Hobbies = user.Hobbies,
                Bio = user.Bio,
                Gender = user.Gender,
                DateOfBirth = user.DateOfBirth,
                MaritalStatus = user.MaritalStatus,
                AvatarUrl = user.AvatarUrl,
                MembershipTypeId = user.MembershipTypeId,
                MembershipTypeName = user.MembershipType?.Name,
                IsAdmin = user.IsAdmin,
                IsBoardMember = user.IsBoardMember,
                BoardTitle = user.BoardTitle,
                BoardBio = user.BoardBio,
                LinkedInUrl = user.LinkedInUrl,
                TwitterHandle = user.TwitterHandle,
                MemberSince = user.MemberSince
            };

            return Ok(new ApiResponse<UserProfileDto>
            {
                Success = true,
                Data = profile
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user profile");
            return StatusCode(500, new ApiResponse<UserProfileDto>
            {
                Success = false,
                Message = "An error occurred while fetching profile"
            });
        }
    }

    // GET: api/Users (Admin only - list all users)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<UserListDto>>>> GetAllUsers()
    {
        try
        {
            var users = await _context.Users
                .Include(u => u.MembershipType)
                .OrderBy(u => u.LastName)
                .ThenBy(u => u.FirstName)
                .Select(u => new UserListDto
                {
                    UserId = u.UserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    AvatarUrl = u.AvatarUrl,
                    MembershipTypeName = u.MembershipType != null ? u.MembershipType.Name : null,
                    IsAdmin = u.IsAdmin,
                    IsActive = u.IsActive,
                    MemberSince = u.MemberSince
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<UserListDto>>
            {
                Success = true,
                Data = users
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all users");
            return StatusCode(500, new ApiResponse<List<UserListDto>>
            {
                Success = false,
                Message = "An error occurred while fetching users"
            });
        }
    }

    // PUT: api/Users/profile
    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(currentUserId);

            if (user == null)
            {
                return NotFound(new ApiResponse<UserProfileDto>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            user.FirstName = request.FirstName ?? user.FirstName;
            user.LastName = request.LastName ?? user.LastName;
            user.ChineseName = request.ChineseName;
            user.PhoneNumber = request.PhoneNumber;
            user.Address = request.Address;
            user.City = request.City;
            user.State = request.State;
            user.ZipCode = request.ZipCode;
            user.Profession = request.Profession;
            user.Hobbies = request.Hobbies;
            user.Bio = request.Bio;
            user.Gender = request.Gender;
            user.DateOfBirth = request.DateOfBirth;
            user.MaritalStatus = request.MaritalStatus;
            user.LinkedInUrl = request.LinkedInUrl;
            user.TwitterHandle = request.TwitterHandle;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<UserProfileDto>
            {
                Success = true,
                Message = "Profile updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile");
            return StatusCode(500, new ApiResponse<UserProfileDto>
            {
                Success = false,
                Message = "An error occurred while updating profile"
            });
        }
    }

    // POST: api/Users/avatar
    [HttpPost("avatar")]
    public async Task<ActionResult<ApiResponse<AvatarResponse>>> UploadAvatar([FromForm] IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<AvatarResponse>
                {
                    Success = false,
                    Message = "No file uploaded"
                });
            }

            var currentUserId = GetCurrentUserId();
            var user = await _context.Users.FindAsync(currentUserId);

            if (user == null)
            {
                return NotFound(new ApiResponse<AvatarResponse>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Delete old avatar asset if exists (by parsing FileId from URL /api/asset/{id})
            if (!string.IsNullOrEmpty(user.AvatarUrl) && user.AvatarUrl.StartsWith("/api/asset/"))
            {
                var oldFileIdStr = user.AvatarUrl.Replace("/api/asset/", "");
                if (int.TryParse(oldFileIdStr, out var oldFileId))
                {
                    await _assetService.DeleteAssetAsync(oldFileId);
                }
            }

            // Upload new avatar using asset service (saves to database)
            var uploadResult = await _assetService.UploadAssetAsync(
                file,
                "avatars",
                objectType: "User",
                objectId: currentUserId,
                uploadedBy: currentUserId
            );

            if (!uploadResult.Success)
            {
                return BadRequest(new ApiResponse<AvatarResponse>
                {
                    Success = false,
                    Message = uploadResult.Error ?? "Failed to upload file"
                });
            }

            // Update user avatar URL (now saves as /api/asset/{id})
            user.AvatarUrl = uploadResult.Url;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<AvatarResponse>
            {
                Success = true,
                Message = "Avatar uploaded successfully",
                Data = new AvatarResponse { AvatarUrl = uploadResult.Url! }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading avatar");
            return StatusCode(500, new ApiResponse<AvatarResponse>
            {
                Success = false,
                Message = "An error occurred while uploading avatar"
            });
        }
    }

    // GET: api/Users/all (Admin only - detailed view)
    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetAllUsersDetailed()
    {
        try
        {
            var users = await _context.Users
                .Include(u => u.MembershipType)
                .Include(u => u.ClubMemberships)
                .Select(u => new UserDto
                {
                    UserId = u.UserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    ChineseName = u.ChineseName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    AvatarUrl = u.AvatarUrl,
                    MembershipTypeId = u.MembershipTypeId,
                    MembershipTypeName = u.MembershipType!.Name,
                    IsAdmin = u.IsAdmin,
                    IsBoardMember = u.IsBoardMember,
                    BoardTitle = u.BoardTitle,
                    BoardDisplayOrder = u.BoardDisplayOrder,
                    MemberSince = u.MemberSince,
                    IsActive = u.IsActive,
                    ClubIds = u.ClubMemberships.Select(cm => cm.ClubId).ToList()
                })
                .OrderBy(u => u.LastName)
                .ToListAsync();

            return Ok(new ApiResponse<List<UserDto>>
            {
                Success = true,
                Data = users
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all users");
            return StatusCode(500, new ApiResponse<List<UserDto>>
            {
                Success = false,
                Message = "An error occurred while fetching users"
            });
        }
    }

    // PUT: api/Users/{id}/admin-edit (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/admin-edit")]
    public async Task<ActionResult<ApiResponse<object>>> AdminEditUser(int id, [FromBody] AdminEditUserRequest request)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Update basic info (admin-editable fields only)
            if (!string.IsNullOrEmpty(request.FirstName))
                user.FirstName = request.FirstName;
            if (!string.IsNullOrEmpty(request.LastName))
                user.LastName = request.LastName;
            if (request.ChineseName != null)
                user.ChineseName = request.ChineseName;
            if (!string.IsNullOrEmpty(request.Email))
                user.Email = request.Email;
            if (request.PhoneNumber != null)
                user.PhoneNumber = request.PhoneNumber;

            // Note: Profile fields (address, city, profession, bio, etc.) are only
            // editable by the user themselves through UpdateProfile endpoint

            // Update membership type
            if (request.MembershipTypeId.HasValue)
                user.MembershipTypeId = request.MembershipTypeId.Value;

            // Update admin status
            if (request.IsAdmin.HasValue)
                user.IsAdmin = request.IsAdmin.Value;

            // Update board member information
            if (request.IsBoardMember.HasValue)
                user.IsBoardMember = request.IsBoardMember.Value;
            if (request.BoardTitle != null)
                user.BoardTitle = request.BoardTitle;
            if (request.BoardDisplayOrder.HasValue)
                user.BoardDisplayOrder = request.BoardDisplayOrder;
            if (request.BoardBio != null)
                user.BoardBio = request.BoardBio;
            
            // Update active status
            if (request.IsActive.HasValue)
                user.IsActive = request.IsActive.Value;

            // Update member since date
            if (request.MemberSince.HasValue)
                user.MemberSince = request.MemberSince.Value;

            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log activity
            var currentUserId = GetCurrentUserId();
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "AdminUserEdit",
                Description = $"Admin edited user: {user.FirstName} {user.LastName}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "User updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while updating user"
            });
        }
    }

    // GET: api/Users/search (Members can search other members)
    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<List<PublicProfileDto>>>> SearchMembers([FromQuery] string? query = null, [FromQuery] string? profession = null, [FromQuery] string? city = null)
    {
        try
        {
            var membersQuery = _context.Users
                .Where(u => u.IsActive)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(query))
            {
                var lowerQuery = query.ToLower();
                membersQuery = membersQuery.Where(u =>
                    u.FirstName.ToLower().Contains(lowerQuery) ||
                    u.LastName.ToLower().Contains(lowerQuery) ||
                    (u.Profession != null && u.Profession.ToLower().Contains(lowerQuery)) ||
                    (u.Hobbies != null && u.Hobbies.ToLower().Contains(lowerQuery)));
            }

            if (!string.IsNullOrWhiteSpace(profession))
            {
                membersQuery = membersQuery.Where(u => u.Profession == profession);
            }

            if (!string.IsNullOrWhiteSpace(city))
            {
                membersQuery = membersQuery.Where(u => u.City == city);
            }

            var members = await membersQuery
                .Include(u => u.MembershipType)
                .OrderBy(u => u.LastName)
                .ThenBy(u => u.FirstName)
                .Select(u => new PublicProfileDto
                {
                    UserId = u.UserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    ChineseName = u.ChineseName,
                    AvatarUrl = u.AvatarUrl,
                    Profession = u.Profession,
                    Hobbies = u.Hobbies,
                    Bio = u.Bio,
                    City = u.City,
                    State = u.State,
                    IsBoardMember = u.IsBoardMember,
                    BoardTitle = u.IsBoardMember ? u.BoardTitle : null,
                    LinkedInUrl = u.LinkedInUrl,
                    TwitterHandle = u.TwitterHandle,
                    MembershipTypeName = u.MembershipType != null ? u.MembershipType.Name : null,
                    MemberSince = u.MemberSince
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<PublicProfileDto>>
            {
                Success = true,
                Data = members
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching members");
            return StatusCode(500, new ApiResponse<List<PublicProfileDto>>
            {
                Success = false,
                Message = "An error occurred while searching members"
            });
        }
    }

    // GET: api/Users/board-members (Public - no auth required)
    [AllowAnonymous]
    [HttpGet("board-members")]
    public async Task<ActionResult<ApiResponse<List<BoardMemberDto>>>> GetBoardMembers()
    {
        try
        {
            var boardMembers = await _context.Users
                .Where(u => u.IsBoardMember && u.IsActive)
                .OrderBy(u => u.BoardDisplayOrder ?? int.MaxValue)
                .Select(u => new BoardMemberDto
                {
                    UserId = u.UserId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    ChineseName = u.ChineseName,
                    AvatarUrl = u.AvatarUrl,
                    BoardTitle = u.BoardTitle,
                    BoardBio = u.BoardBio,
                    Profession = u.Profession,
                    LinkedInUrl = u.LinkedInUrl,
                    TwitterHandle = u.TwitterHandle,
                    DisplayOrder = u.BoardDisplayOrder ?? int.MaxValue
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<BoardMemberDto>>
            {
                Success = true,
                Data = boardMembers
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching board members");
            return StatusCode(500, new ApiResponse<List<BoardMemberDto>>
            {
                Success = false,
                Message = "An error occurred while fetching board members"
            });
        }
    }

    // GET: api/Users/{id}/public-profile (Public - no auth required)
    [AllowAnonymous]
    [HttpGet("{id}/public-profile")]
    public async Task<ActionResult<ApiResponse<PublicProfileDto>>> GetPublicProfile(int id)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.MembershipType)
                .FirstOrDefaultAsync(u => u.UserId == id && u.IsActive);

            if (user == null)
            {
                return NotFound(new ApiResponse<PublicProfileDto>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Get user's clubs
            var clubs = await _context.ClubMemberships
                .Where(cm => cm.UserId == id)
                .Include(cm => cm.Club)
                .Select(cm => new ProfileClubDto
                {
                    ClubId = cm.Club.ClubId,
                    Name = cm.Club.Name,
                    AvatarUrl = cm.Club.AvatarUrl
                })
                .ToListAsync();

            var profile = new PublicProfileDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                ChineseName = user.ChineseName,
                AvatarUrl = user.AvatarUrl,
                Profession = user.Profession,
                Hobbies = user.Hobbies,
                Bio = user.Bio,
                City = user.City,
                State = user.State,
                IsBoardMember = user.IsBoardMember,
                BoardTitle = user.IsBoardMember ? user.BoardTitle : null,
                LinkedInUrl = user.LinkedInUrl,
                TwitterHandle = user.TwitterHandle,
                MemberSince = user.MemberSince,
                Clubs = clubs
            };

            return Ok(new ApiResponse<PublicProfileDto>
            {
                Success = true,
                Data = profile
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching public profile");
            return StatusCode(500, new ApiResponse<PublicProfileDto>
            {
                Success = false,
                Message = "An error occurred while fetching profile"
            });
        }
    }

    // GET: api/Users/dashboard
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<DashboardDto>>> GetDashboard()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var user = await _context.Users
                .Include(u => u.MembershipType)
                .FirstOrDefaultAsync(u => u.UserId == currentUserId);

            if (user == null)
            {
                return NotFound(new ApiResponse<DashboardDto>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            var clubCount = await _context.ClubMemberships
                .CountAsync(cm => cm.UserId == currentUserId && cm.IsActive);

            var eventCount = await _context.EventRegistrations
                .CountAsync(er => er.UserId == currentUserId);

            var recentActivities = await _context.ActivityLogs
                .Where(al => al.UserId == currentUserId)
                .OrderByDescending(al => al.CreatedAt)
                .Take(10)
                .Select(al => new ActivityLogDto
                {
                    LogId = al.LogId,
                    ActivityType = al.ActivityType,
                    Description = al.Description,
                    CreatedAt = al.CreatedAt
                })
                .ToListAsync();

            var dashboard = new DashboardDto
            {
                User = new UserDto
                {
                    UserId = user.UserId,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    MembershipTypeName = user.MembershipType?.Name,
                    AvatarUrl = user.AvatarUrl
                },
                ClubCount = clubCount,
                EventCount = eventCount,
                RecentActivities = recentActivities
            };

            return Ok(new ApiResponse<DashboardDto>
            {
                Success = true,
                Data = dashboard
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching dashboard");
            return StatusCode(500, new ApiResponse<DashboardDto>
            {
                Success = false,
                Message = "An error occurred while fetching dashboard"
            });
        }
    }
}
