using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using CasecApi.Data;
using UserEntity = CasecApi.Models.User;
using CasecApi.Models;
using CasecApi.Models.DTOs;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class FamilyController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<FamilyController> _logger;

    public FamilyController(CasecDbContext context, ILogger<FamilyController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    private int? GetCurrentUserIdNullable()
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private async Task<bool> HasAreaPermissionAsync(string areaKey, bool requireEdit = false, bool requireDelete = false)
    {
        if (User.IsInRole("Admin")) return true;
        var userId = GetCurrentUserIdNullable();
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

    // GET: api/Family/my-family
    [HttpGet("my-family")]
    public async Task<ActionResult<ApiResponse<FamilyGroupDto>>> GetMyFamily()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var user = await _context.Users
                .Include(u => u.FamilyGroup)
                .FirstOrDefaultAsync(u => u.UserId == currentUserId);

            if (user?.FamilyGroupId == null)
            {
                return Ok(new ApiResponse<FamilyGroupDto>
                {
                    Success = true,
                    Data = null,
                    Message = "User is not part of a family group"
                });
            }

            var familyGroup = await GetFamilyGroupDetails(user.FamilyGroupId.Value);

            return Ok(new ApiResponse<FamilyGroupDto>
            {
                Success = true,
                Data = familyGroup
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching family group");
            return StatusCode(500, new ApiResponse<FamilyGroupDto>
            {
                Success = false,
                Message = "An error occurred while fetching family group"
            });
        }
    }

    // GET: api/Family/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<FamilyGroupDto>>> GetFamily(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var familyGroup = await GetFamilyGroupDetails(id);

            if (familyGroup == null)
            {
                return NotFound(new ApiResponse<FamilyGroupDto>
                {
                    Success = false,
                    Message = "Family group not found"
                });
            }

            // Check if current user is part of this family or is admin
            var user = await _context.Users.FindAsync(currentUserId);
            var isAdmin = user != null && user.IsAdmin;
            var isFamilyMember = familyGroup.Members.Any(m => m.UserId == currentUserId);

            if (!isAdmin && !isFamilyMember)
            {
                return Forbid();
            }

            return Ok(new ApiResponse<FamilyGroupDto>
            {
                Success = true,
                Data = familyGroup
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching family group");
            return StatusCode(500, new ApiResponse<FamilyGroupDto>
            {
                Success = false,
                Message = "An error occurred while fetching family group"
            });
        }
    }

    // GET: api/Family (Admin only)
    [Authorize]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<FamilyGroupDto>>>> GetAllFamilies()
    {
        try
        {
            if (!await HasAreaPermissionAsync("users"))
                return ForbiddenResponse<List<FamilyGroupDto>>();

            var familyGroups = await _context.FamilyGroups
                .Include(fg => fg.PrimaryUser)
                .Include(fg => fg.Members)
                    .ThenInclude(u => u.MembershipType)
                .ToListAsync();

            var familyDtos = familyGroups.Select(fg => new FamilyGroupDto
            {
                FamilyGroupId = fg.FamilyGroupId,
                FamilyName = fg.FamilyName,
                PrimaryUserId = fg.PrimaryUserId,
                PrimaryUserName = $"{fg.PrimaryUser.FirstName} {fg.PrimaryUser.LastName}",
                PrimaryUserEmail = fg.PrimaryUser.Email,
                TotalMembers = fg.Members.Count,
                Members = fg.Members.Select(m => new FamilyMemberDto
                {
                    UserId = m.UserId,
                    FirstName = m.FirstName,
                    LastName = m.LastName,
                    Email = m.Email,
                    AvatarUrl = m.AvatarUrl,
                    RelationshipToPrimary = m.RelationshipToPrimary ?? "Member",
                    IsPrimary = m.UserId == fg.PrimaryUserId
                }).ToList(),
                CreatedAt = fg.CreatedAt
            }).ToList();

            return Ok(new ApiResponse<List<FamilyGroupDto>>
            {
                Success = true,
                Data = familyDtos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching family groups");
            return StatusCode(500, new ApiResponse<List<FamilyGroupDto>>
            {
                Success = false,
                Message = "An error occurred while fetching family groups"
            });
        }
    }

    // POST: api/Family (Admin only)
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<FamilyGroupDto>>> CreateFamilyGroup([FromBody] CreateFamilyGroupRequest request)
    {
        try
        {
            if (!await HasAreaPermissionAsync("users", requireEdit: true))
                return ForbiddenResponse<FamilyGroupDto>();

            // Check if primary user exists
            var primaryUser = await _context.Users.FindAsync(request.PrimaryUserId);
            if (primaryUser == null)
            {
                return NotFound(new ApiResponse<FamilyGroupDto>
                {
                    Success = false,
                    Message = "Primary user not found"
                });
            }

            // Check if user is already in a family group
            if (primaryUser.FamilyGroupId != null)
            {
                return BadRequest(new ApiResponse<FamilyGroupDto>
                {
                    Success = false,
                    Message = "User is already part of a family group"
                });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Create family group
                var familyGroup = new FamilyGroup
                {
                    FamilyName = request.FamilyName,
                    PrimaryUserId = request.PrimaryUserId
                };

                _context.FamilyGroups.Add(familyGroup);
                await _context.SaveChangesAsync();

                // Update primary user
                primaryUser.FamilyGroupId = familyGroup.FamilyGroupId;
                primaryUser.RelationshipToPrimary = "Primary";
                await _context.SaveChangesAsync();

                // Log activity
                var currentUserId = GetCurrentUserId();
                var log = new ActivityLog
                {
                    UserId = currentUserId,
                    ActivityType = "FamilyGroupCreated",
                    Description = $"Created family group: {familyGroup.FamilyName}"
                };
                _context.ActivityLogs.Add(log);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                var familyDto = await GetFamilyGroupDetails(familyGroup.FamilyGroupId);

                return Ok(new ApiResponse<FamilyGroupDto>
                {
                    Success = true,
                    Message = "Family group created successfully",
                    Data = familyDto
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating family group");
            return StatusCode(500, new ApiResponse<FamilyGroupDto>
            {
                Success = false,
                Message = "An error occurred while creating family group"
            });
        }
    }

    // POST: api/Family/{id}/members (Admin or Primary User)
    [HttpPost("{id}/members")]
    public async Task<ActionResult<ApiResponse<object>>> AddFamilyMember(int id, [FromBody] AddFamilyMemberRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var familyGroup = await _context.FamilyGroups.FindAsync(id);

            if (familyGroup == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Family group not found"
                });
            }

            // Check permissions: admin or primary user
            var user = await _context.Users.FindAsync(currentUserId);
            var isAdmin = user != null && user.IsAdmin;
            var isPrimaryUser = familyGroup.PrimaryUserId == currentUserId;

            if (!isAdmin && !isPrimaryUser)
            {
                return Forbid();
            }

            // Check if user to add exists
            var userToAdd = await _context.Users.FindAsync(request.UserId);
            if (userToAdd == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            // Check if user is already in a family group
            if (userToAdd.FamilyGroupId != null)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User is already part of a family group"
                });
            }

            // Add to family
            userToAdd.FamilyGroupId = id;
            userToAdd.RelationshipToPrimary = request.Relationship ?? "Member";
            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "FamilyMemberAdded",
                Description = $"Added {userToAdd.FirstName} {userToAdd.LastName} to family group {familyGroup.FamilyName}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Family member added successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding family member");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while adding family member"
            });
        }
    }

    // DELETE: api/Family/{id}/members/{userId} (Admin or Primary User)
    [HttpDelete("{id}/members/{userId}")]
    public async Task<ActionResult<ApiResponse<object>>> RemoveFamilyMember(int id, int userId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var familyGroup = await _context.FamilyGroups.FindAsync(id);

            if (familyGroup == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Family group not found"
                });
            }

            // Cannot remove primary user
            if (familyGroup.PrimaryUserId == userId)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Cannot remove primary user from family group"
                });
            }

            // Check permissions: admin or primary user
            var user = await _context.Users.FindAsync(currentUserId);
            var isAdmin = user != null && user.IsAdmin;
            var isPrimaryUser = familyGroup.PrimaryUserId == currentUserId;

            if (!isAdmin && !isPrimaryUser)
            {
                return Forbid();
            }

            var userToRemove = await _context.Users.FindAsync(userId);
            if (userToRemove == null || userToRemove.FamilyGroupId != id)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User not found in this family group"
                });
            }

            // Remove from family
            userToRemove.FamilyGroupId = null;
            userToRemove.RelationshipToPrimary = null;
            await _context.SaveChangesAsync();

            // Log activity
            var log = new ActivityLog
            {
                UserId = currentUserId,
                ActivityType = "FamilyMemberRemoved",
                Description = $"Removed {userToRemove.FirstName} {userToRemove.LastName} from family group {familyGroup.FamilyName}"
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Family member removed successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing family member");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while removing family member"
            });
        }
    }

    // DELETE: api/Family/{id} (Admin only)
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteFamilyGroup(int id)
    {
        try
        {
            if (!await HasAreaPermissionAsync("users", requireDelete: true))
                return ForbiddenResponse<object>();

            var familyGroup = await _context.FamilyGroups
                .Include(fg => fg.Members)
                .FirstOrDefaultAsync(fg => fg.FamilyGroupId == id);

            if (familyGroup == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Family group not found"
                });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Remove family group reference from all members
                foreach (var member in familyGroup.Members)
                {
                    member.FamilyGroupId = null;
                    member.RelationshipToPrimary = null;
                }

                // Delete family group
                _context.FamilyGroups.Remove(familyGroup);
                await _context.SaveChangesAsync();

                // Log activity
                var currentUserId = GetCurrentUserId();
                var log = new ActivityLog
                {
                    UserId = currentUserId,
                    ActivityType = "FamilyGroupDeleted",
                    Description = $"Deleted family group: {familyGroup.FamilyName}"
                };
                _context.ActivityLogs.Add(log);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Family group deleted successfully"
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting family group");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting family group"
            });
        }
    }

    // Helper method
    private async Task<FamilyGroupDto?> GetFamilyGroupDetails(int familyGroupId)
    {
        var familyGroup = await _context.FamilyGroups
            .Include(fg => fg.PrimaryUser)
            .Include(fg => fg.Members)
                .ThenInclude(u => u.MembershipType)
            .FirstOrDefaultAsync(fg => fg.FamilyGroupId == familyGroupId);

        if (familyGroup == null)
            return null;

        return new FamilyGroupDto
        {
            FamilyGroupId = familyGroup.FamilyGroupId,
            FamilyName = familyGroup.FamilyName,
            PrimaryUserId = familyGroup.PrimaryUserId,
            PrimaryUserName = $"{familyGroup.PrimaryUser.FirstName} {familyGroup.PrimaryUser.LastName}",
            PrimaryUserEmail = familyGroup.PrimaryUser.Email,
            TotalMembers = familyGroup.Members.Count,
            Members = familyGroup.Members.Select(m => new FamilyMemberDto
            {
                UserId = m.UserId,
                FirstName = m.FirstName,
                LastName = m.LastName,
                Email = m.Email,
                AvatarUrl = m.AvatarUrl,
                RelationshipToPrimary = m.RelationshipToPrimary ?? "Member",
                IsPrimary = m.UserId == familyGroup.PrimaryUserId,
                MembershipType = m.MembershipType?.Name
            }).ToList(),
            CreatedAt = familyGroup.CreatedAt
        };
    }
}
