using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CasecApi.Data;
using CasecApi.Models;
using CasecApi.Models.DTOs;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize(Roles = "Admin")]
public class RolesController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<RolesController> _logger;

    public RolesController(CasecDbContext context, ILogger<RolesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: /Roles - Get all roles
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<RoleDto>>>> GetRoles()
    {
        try
        {
            var roles = await _context.Roles
                .Include(r => r.AreaPermissions!)
                    .ThenInclude(ap => ap.Area)
                .Include(r => r.UserRoles)
                .OrderBy(r => r.Name)
                .ToListAsync();

            var dtos = roles.Select(r => new RoleDto
            {
                RoleId = r.RoleId,
                Name = r.Name,
                Description = r.Description,
                IsSystem = r.IsSystem,
                IsActive = r.IsActive,
                UserCount = r.UserRoles?.Count ?? 0,
                AreaPermissions = r.AreaPermissions?.Select(ap => new AreaPermissionDto
                {
                    AreaId = ap.AreaId,
                    AreaKey = ap.Area?.AreaKey ?? "",
                    AreaName = ap.Area?.Name ?? "",
                    Category = ap.Area?.Category,
                    CanView = ap.CanView,
                    CanEdit = ap.CanEdit,
                    CanDelete = ap.CanDelete
                }).ToList(),
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            }).ToList();

            return Ok(new ApiResponse<List<RoleDto>>
            {
                Success = true,
                Data = dtos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting roles");
            return StatusCode(500, new ApiResponse<List<RoleDto>>
            {
                Success = false,
                Message = "An error occurred while fetching roles"
            });
        }
    }

    // GET: /Roles/{id} - Get a specific role
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<RoleDto>>> GetRole(int id)
    {
        try
        {
            var role = await _context.Roles
                .Include(r => r.AreaPermissions!)
                    .ThenInclude(ap => ap.Area)
                .Include(r => r.UserRoles)
                .FirstOrDefaultAsync(r => r.RoleId == id);

            if (role == null)
            {
                return NotFound(new ApiResponse<RoleDto>
                {
                    Success = false,
                    Message = "Role not found"
                });
            }

            var dto = new RoleDto
            {
                RoleId = role.RoleId,
                Name = role.Name,
                Description = role.Description,
                IsSystem = role.IsSystem,
                IsActive = role.IsActive,
                UserCount = role.UserRoles?.Count ?? 0,
                AreaPermissions = role.AreaPermissions?.Select(ap => new AreaPermissionDto
                {
                    AreaId = ap.AreaId,
                    AreaKey = ap.Area?.AreaKey ?? "",
                    AreaName = ap.Area?.Name ?? "",
                    Category = ap.Area?.Category,
                    CanView = ap.CanView,
                    CanEdit = ap.CanEdit,
                    CanDelete = ap.CanDelete
                }).ToList(),
                CreatedAt = role.CreatedAt,
                UpdatedAt = role.UpdatedAt
            };

            return Ok(new ApiResponse<RoleDto>
            {
                Success = true,
                Data = dto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting role {Id}", id);
            return StatusCode(500, new ApiResponse<RoleDto>
            {
                Success = false,
                Message = "An error occurred while fetching the role"
            });
        }
    }

    // GET: /Roles/areas - Get all admin areas
    [HttpGet("areas")]
    public async Task<ActionResult<ApiResponse<List<AdminAreaDto>>>> GetAdminAreas()
    {
        try
        {
            var areas = await _context.AdminAreas
                .OrderBy(a => a.DisplayOrder)
                .Select(a => new AdminAreaDto
                {
                    AreaId = a.AreaId,
                    AreaKey = a.AreaKey,
                    Name = a.Name,
                    Description = a.Description,
                    Category = a.Category,
                    IconName = a.IconName,
                    Route = a.Route,
                    DisplayOrder = a.DisplayOrder
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<AdminAreaDto>>
            {
                Success = true,
                Data = areas
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin areas");
            return StatusCode(500, new ApiResponse<List<AdminAreaDto>>
            {
                Success = false,
                Message = "An error occurred while fetching admin areas"
            });
        }
    }

    // POST: /Roles - Create a new role
    [HttpPost]
    public async Task<ActionResult<ApiResponse<RoleDto>>> CreateRole([FromBody] CreateRoleRequest request)
    {
        try
        {
            // Check if role name already exists
            var exists = await _context.Roles.AnyAsync(r => r.Name == request.Name);
            if (exists)
            {
                return BadRequest(new ApiResponse<RoleDto>
                {
                    Success = false,
                    Message = "A role with this name already exists"
                });
            }

            var role = new Role
            {
                Name = request.Name,
                Description = request.Description,
                IsSystem = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            // Add area permissions if provided
            if (request.AreaPermissions != null && request.AreaPermissions.Count > 0)
            {
                foreach (var perm in request.AreaPermissions)
                {
                    _context.RoleAreaPermissions.Add(new RoleAreaPermission
                    {
                        RoleId = role.RoleId,
                        AreaId = perm.AreaId,
                        CanView = perm.CanView,
                        CanEdit = perm.CanEdit,
                        CanDelete = perm.CanDelete,
                        CreatedAt = DateTime.UtcNow
                    });
                }
                await _context.SaveChangesAsync();
            }

            // Reload with permissions
            var savedRole = await _context.Roles
                .Include(r => r.AreaPermissions!)
                    .ThenInclude(ap => ap.Area)
                .FirstAsync(r => r.RoleId == role.RoleId);

            var dto = MapToDto(savedRole);

            return CreatedAtAction(nameof(GetRole), new { id = role.RoleId }, new ApiResponse<RoleDto>
            {
                Success = true,
                Data = dto,
                Message = "Role created successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating role");
            return StatusCode(500, new ApiResponse<RoleDto>
            {
                Success = false,
                Message = "An error occurred while creating the role"
            });
        }
    }

    // PUT: /Roles/{id} - Update a role
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<RoleDto>>> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
    {
        try
        {
            var role = await _context.Roles
                .Include(r => r.AreaPermissions)
                .FirstOrDefaultAsync(r => r.RoleId == id);

            if (role == null)
            {
                return NotFound(new ApiResponse<RoleDto>
                {
                    Success = false,
                    Message = "Role not found"
                });
            }

            // Check name uniqueness if changing
            if (request.Name != null && request.Name != role.Name)
            {
                var exists = await _context.Roles.AnyAsync(r => r.Name == request.Name && r.RoleId != id);
                if (exists)
                {
                    return BadRequest(new ApiResponse<RoleDto>
                    {
                        Success = false,
                        Message = "A role with this name already exists"
                    });
                }
                role.Name = request.Name;
            }

            if (request.Description != null) role.Description = request.Description;
            if (request.IsActive.HasValue) role.IsActive = request.IsActive.Value;
            role.UpdatedAt = DateTime.UtcNow;

            // Update area permissions if provided
            if (request.AreaPermissions != null)
            {
                // Remove existing permissions
                if (role.AreaPermissions != null)
                {
                    _context.RoleAreaPermissions.RemoveRange(role.AreaPermissions);
                }

                // Add new permissions
                foreach (var perm in request.AreaPermissions)
                {
                    _context.RoleAreaPermissions.Add(new RoleAreaPermission
                    {
                        RoleId = role.RoleId,
                        AreaId = perm.AreaId,
                        CanView = perm.CanView,
                        CanEdit = perm.CanEdit,
                        CanDelete = perm.CanDelete,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();

            // Reload with permissions
            var updatedRole = await _context.Roles
                .Include(r => r.AreaPermissions!)
                    .ThenInclude(ap => ap.Area)
                .Include(r => r.UserRoles)
                .FirstAsync(r => r.RoleId == id);

            var dto = MapToDto(updatedRole);

            return Ok(new ApiResponse<RoleDto>
            {
                Success = true,
                Data = dto,
                Message = "Role updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role {Id}", id);
            return StatusCode(500, new ApiResponse<RoleDto>
            {
                Success = false,
                Message = "An error occurred while updating the role"
            });
        }
    }

    // DELETE: /Roles/{id} - Delete a role
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteRole(int id)
    {
        try
        {
            var role = await _context.Roles
                .Include(r => r.UserRoles)
                .FirstOrDefaultAsync(r => r.RoleId == id);

            if (role == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Role not found"
                });
            }

            if (role.IsSystem)
            {
                return BadRequest(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "System roles cannot be deleted"
                });
            }

            if (role.UserRoles?.Count > 0)
            {
                return BadRequest(new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Cannot delete role that is assigned to {role.UserRoles.Count} user(s). Remove assignments first."
                });
            }

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = true,
                Message = "Role deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting role {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting the role"
            });
        }
    }

    // GET: /Roles/{id}/users - Get users with a specific role
    [HttpGet("{id}/users")]
    public async Task<ActionResult<ApiResponse<List<UserRoleDto>>>> GetRoleUsers(int id)
    {
        try
        {
            var userRoles = await _context.UserRoles
                .Include(ur => ur.User)
                .Include(ur => ur.Role)
                .Include(ur => ur.AssignedByUser)
                .Where(ur => ur.RoleId == id)
                .OrderBy(ur => ur.User!.LastName)
                .ThenBy(ur => ur.User!.FirstName)
                .Select(ur => new UserRoleDto
                {
                    UserRoleId = ur.UserRoleId,
                    UserId = ur.UserId,
                    UserName = ur.User!.FirstName + " " + ur.User.LastName,
                    UserEmail = ur.User.Email,
                    RoleId = ur.RoleId,
                    RoleName = ur.Role!.Name,
                    AssignedAt = ur.AssignedAt,
                    AssignedByName = ur.AssignedByUser != null
                        ? ur.AssignedByUser.FirstName + " " + ur.AssignedByUser.LastName
                        : null
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<UserRoleDto>>
            {
                Success = true,
                Data = userRoles
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users for role {Id}", id);
            return StatusCode(500, new ApiResponse<List<UserRoleDto>>
            {
                Success = false,
                Message = "An error occurred while fetching role users"
            });
        }
    }

    // POST: /Roles/assign - Assign a role to a user
    [HttpPost("assign")]
    public async Task<ActionResult<ApiResponse<UserRoleDto>>> AssignRole([FromBody] AssignRoleRequest request)
    {
        try
        {
            // Check if already assigned
            var exists = await _context.UserRoles
                .AnyAsync(ur => ur.UserId == request.UserId && ur.RoleId == request.RoleId);

            if (exists)
            {
                return BadRequest(new ApiResponse<UserRoleDto>
                {
                    Success = false,
                    Message = "User already has this role"
                });
            }

            var userRole = new UserRole
            {
                UserId = request.UserId,
                RoleId = request.RoleId,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = GetCurrentUserId()
            };

            _context.UserRoles.Add(userRole);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            var saved = await _context.UserRoles
                .Include(ur => ur.User)
                .Include(ur => ur.Role)
                .Include(ur => ur.AssignedByUser)
                .FirstAsync(ur => ur.UserRoleId == userRole.UserRoleId);

            var dto = new UserRoleDto
            {
                UserRoleId = saved.UserRoleId,
                UserId = saved.UserId,
                UserName = saved.User!.FirstName + " " + saved.User.LastName,
                UserEmail = saved.User.Email,
                RoleId = saved.RoleId,
                RoleName = saved.Role!.Name,
                AssignedAt = saved.AssignedAt,
                AssignedByName = saved.AssignedByUser != null
                    ? saved.AssignedByUser.FirstName + " " + saved.AssignedByUser.LastName
                    : null
            };

            return Ok(new ApiResponse<UserRoleDto>
            {
                Success = true,
                Data = dto,
                Message = "Role assigned successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning role");
            return StatusCode(500, new ApiResponse<UserRoleDto>
            {
                Success = false,
                Message = "An error occurred while assigning the role"
            });
        }
    }

    // DELETE: /Roles/unassign/{userRoleId} - Remove a role from a user
    [HttpDelete("unassign/{userRoleId}")]
    public async Task<ActionResult<ApiResponse<bool>>> UnassignRole(int userRoleId)
    {
        try
        {
            var userRole = await _context.UserRoles.FindAsync(userRoleId);

            if (userRole == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "User role assignment not found"
                });
            }

            _context.UserRoles.Remove(userRole);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = true,
                Message = "Role unassigned successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unassigning role {UserRoleId}", userRoleId);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while unassigning the role"
            });
        }
    }

    // DELETE: /Roles/{roleId}/user/{userId} - Remove a role from a user by roleId and userId
    [HttpDelete("{roleId}/user/{userId}")]
    public async Task<ActionResult<ApiResponse<bool>>> UnassignRoleByIds(int roleId, int userId)
    {
        try
        {
            var userRole = await _context.UserRoles
                .FirstOrDefaultAsync(ur => ur.RoleId == roleId && ur.UserId == userId);

            if (userRole == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "User role assignment not found"
                });
            }

            _context.UserRoles.Remove(userRole);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Data = true,
                Message = "Role unassigned successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unassigning role {RoleId} from user {UserId}", roleId, userId);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while unassigning the role"
            });
        }
    }

    // GET: /Roles/user/{userId}/permissions - Get a user's permissions
    [HttpGet("user/{userId}/permissions")]
    public async Task<ActionResult<ApiResponse<UserPermissionsDto>>> GetUserPermissions(int userId)
    {
        try
        {
            var userRoles = await _context.UserRoles
                .Include(ur => ur.Role!)
                    .ThenInclude(r => r.AreaPermissions!)
                        .ThenInclude(ap => ap.Area)
                .Where(ur => ur.UserId == userId && ur.Role!.IsActive)
                .ToListAsync();

            var roleInfos = userRoles
                .Where(ur => ur.Role != null)
                .Select(ur => new UserRoleInfoDto
                {
                    RoleId = ur.Role!.RoleId,
                    Name = ur.Role.Name
                })
                .DistinctBy(r => r.RoleId)
                .ToList();

            // Merge permissions from all roles (take highest permission level)
            var permissionDict = new Dictionary<int, AreaPermissionDto>();

            foreach (var userRole in userRoles)
            {
                if (userRole.Role?.AreaPermissions == null) continue;

                foreach (var perm in userRole.Role.AreaPermissions)
                {
                    if (perm.Area == null) continue;

                    if (permissionDict.TryGetValue(perm.AreaId, out var existing))
                    {
                        // Merge: take the highest permission
                        existing.CanView = existing.CanView || perm.CanView;
                        existing.CanEdit = existing.CanEdit || perm.CanEdit;
                        existing.CanDelete = existing.CanDelete || perm.CanDelete;
                    }
                    else
                    {
                        permissionDict[perm.AreaId] = new AreaPermissionDto
                        {
                            AreaId = perm.AreaId,
                            AreaKey = perm.Area.AreaKey,
                            AreaName = perm.Area.Name,
                            Category = perm.Area.Category,
                            CanView = perm.CanView,
                            CanEdit = perm.CanEdit,
                            CanDelete = perm.CanDelete
                        };
                    }
                }
            }

            var result = new UserPermissionsDto
            {
                UserId = userId,
                Roles = roleInfos,
                Permissions = permissionDict.Values.ToList()
            };

            return Ok(new ApiResponse<UserPermissionsDto>
            {
                Success = true,
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting permissions for user {UserId}", userId);
            return StatusCode(500, new ApiResponse<UserPermissionsDto>
            {
                Success = false,
                Message = "An error occurred while fetching user permissions"
            });
        }
    }

    // GET: /Roles/my-permissions - Get current user's permissions
    [HttpGet("my-permissions")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<UserPermissionsDto>>> GetMyPermissions()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Ok(new ApiResponse<UserPermissionsDto>
                {
                    Success = true,
                    Data = new UserPermissionsDto
                    {
                        UserId = 0,
                        Roles = new List<string>(),
                        Permissions = new List<AreaPermissionDto>()
                    }
                });
            }

            // Check if user is admin (legacy support)
            var user = await _context.Users.FindAsync(userId.Value);
            if (user?.IsAdmin == true)
            {
                // Admin gets all permissions
                var allAreas = await _context.AdminAreas
                    .OrderBy(a => a.DisplayOrder)
                    .Select(a => new AreaPermissionDto
                    {
                        AreaId = a.AreaId,
                        AreaKey = a.AreaKey,
                        AreaName = a.Name,
                        Category = a.Category,
                        CanView = true,
                        CanEdit = true,
                        CanDelete = true
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<UserPermissionsDto>
                {
                    Success = true,
                    Data = new UserPermissionsDto
                    {
                        UserId = userId.Value,
                        Roles = new List<string> { "Admin" },
                        Permissions = allAreas
                    }
                });
            }

            // Get role-based permissions
            return await GetUserPermissions(userId.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user permissions");
            return StatusCode(500, new ApiResponse<UserPermissionsDto>
            {
                Success = false,
                Message = "An error occurred while fetching permissions"
            });
        }
    }

    private RoleDto MapToDto(Role role)
    {
        return new RoleDto
        {
            RoleId = role.RoleId,
            Name = role.Name,
            Description = role.Description,
            IsSystem = role.IsSystem,
            IsActive = role.IsActive,
            UserCount = role.UserRoles?.Count ?? 0,
            AreaPermissions = role.AreaPermissions?.Select(ap => new AreaPermissionDto
            {
                AreaId = ap.AreaId,
                AreaKey = ap.Area?.AreaKey ?? "",
                AreaName = ap.Area?.Name ?? "",
                Category = ap.Area?.Category,
                CanView = ap.CanView,
                CanEdit = ap.CanEdit,
                CanDelete = ap.CanDelete
            }).ToList(),
            CreatedAt = role.CreatedAt,
            UpdatedAt = role.UpdatedAt
        };
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
