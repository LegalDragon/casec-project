using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CasecApi.Data;
using UserEntity = CasecApi.Models.User;
using CasecApi.Models;
using CasecApi.Models.DTOs;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
public class MembershipTypesController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<MembershipTypesController> _logger;

    public MembershipTypesController(CasecDbContext context, ILogger<MembershipTypesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/MembershipTypes
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<MembershipTypeDto>>>> GetMembershipTypes([FromQuery] bool includeInactive = false)
    {
        try
        {
            var query = _context.MembershipTypes.AsQueryable();

            if (!includeInactive)
            {
                query = query.Where(mt => mt.IsActive);
            }

            var membershipTypes = await query
                .OrderBy(mt => mt.DisplayOrder)
                .Select(mt => new MembershipTypeDto
                {
                    MembershipTypeId = mt.MembershipTypeId,
                    Name = mt.Name,
                    Description = mt.Description,
                    AnnualFee = mt.AnnualFee,
                    MaxFamilyMembers = mt.MaxFamilyMembers,
                    CanManageClubs = mt.CanManageClubs,
                    CanManageEvents = mt.CanManageEvents,
                    HasBoardVotingRights = mt.HasBoardVotingRights,
                    IsActive = mt.IsActive,
                    DisplayOrder = mt.DisplayOrder,
                    Icon = mt.Icon
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<MembershipTypeDto>>
            {
                Success = true,
                Data = membershipTypes
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching membership types");
            return StatusCode(500, new ApiResponse<List<MembershipTypeDto>>
            {
                Success = false,
                Message = "An error occurred while fetching membership types"
            });
        }
    }

    // GET: api/MembershipTypes/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<MembershipTypeDto>>> GetMembershipType(int id)
    {
        try
        {
            var membershipType = await _context.MembershipTypes
                .Where(mt => mt.MembershipTypeId == id)
                .Select(mt => new MembershipTypeDto
                {
                    MembershipTypeId = mt.MembershipTypeId,
                    Name = mt.Name,
                    Description = mt.Description,
                    AnnualFee = mt.AnnualFee,
                    MaxFamilyMembers = mt.MaxFamilyMembers,
                    CanManageClubs = mt.CanManageClubs,
                    CanManageEvents = mt.CanManageEvents,
                    HasBoardVotingRights = mt.HasBoardVotingRights,
                    IsActive = mt.IsActive,
                    DisplayOrder = mt.DisplayOrder,
                    Icon = mt.Icon
                })
                .FirstOrDefaultAsync();

            if (membershipType == null)
            {
                return NotFound(new ApiResponse<MembershipTypeDto>
                {
                    Success = false,
                    Message = "Membership type not found"
                });
            }

            return Ok(new ApiResponse<MembershipTypeDto>
            {
                Success = true,
                Data = membershipType
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching membership type");
            return StatusCode(500, new ApiResponse<MembershipTypeDto>
            {
                Success = false,
                Message = "An error occurred while fetching membership type"
            });
        }
    }

    // POST: api/MembershipTypes
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<MembershipTypeDto>>> CreateMembershipType([FromBody] CreateMembershipTypeRequest request)
    {
        try
        {
            // Check if name already exists
            if (await _context.MembershipTypes.AnyAsync(mt => mt.Name == request.Name))
            {
                return BadRequest(new ApiResponse<MembershipTypeDto>
                {
                    Success = false,
                    Message = "Membership type with this name already exists"
                });
            }

            var membershipType = new MembershipType
            {
                Name = request.Name,
                Description = request.Description,
                AnnualFee = request.AnnualFee,
                MaxFamilyMembers = request.MaxFamilyMembers,
                CanManageClubs = request.CanManageClubs,
                CanManageEvents = request.CanManageEvents,
                HasBoardVotingRights = request.HasBoardVotingRights,
                DisplayOrder = request.DisplayOrder,
                Icon = request.Icon
            };

            _context.MembershipTypes.Add(membershipType);
            await _context.SaveChangesAsync();

            var dto = new MembershipTypeDto
            {
                MembershipTypeId = membershipType.MembershipTypeId,
                Name = membershipType.Name,
                Description = membershipType.Description,
                AnnualFee = membershipType.AnnualFee,
                MaxFamilyMembers = membershipType.MaxFamilyMembers,
                CanManageClubs = membershipType.CanManageClubs,
                CanManageEvents = membershipType.CanManageEvents,
                HasBoardVotingRights = membershipType.HasBoardVotingRights,
                IsActive = membershipType.IsActive,
                DisplayOrder = membershipType.DisplayOrder,
                Icon = membershipType.Icon
            };

            return CreatedAtAction(nameof(GetMembershipType), new { id = membershipType.MembershipTypeId },
                new ApiResponse<MembershipTypeDto>
                {
                    Success = true,
                    Message = "Membership type created successfully",
                    Data = dto
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating membership type");
            return StatusCode(500, new ApiResponse<MembershipTypeDto>
            {
                Success = false,
                Message = "An error occurred while creating membership type"
            });
        }
    }

    // PUT: api/MembershipTypes/{id}
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<MembershipTypeDto>>> UpdateMembershipType(int id, [FromBody] UpdateMembershipTypeRequest request)
    {
        try
        {
            var membershipType = await _context.MembershipTypes.FindAsync(id);
            if (membershipType == null)
            {
                return NotFound(new ApiResponse<MembershipTypeDto>
                {
                    Success = false,
                    Message = "Membership type not found"
                });
            }

            // Check if new name already exists
            if (request.Name != null && request.Name != membershipType.Name)
            {
                if (await _context.MembershipTypes.AnyAsync(mt => mt.Name == request.Name))
                {
                    return BadRequest(new ApiResponse<MembershipTypeDto>
                    {
                        Success = false,
                        Message = "Membership type with this name already exists"
                    });
                }
                membershipType.Name = request.Name;
            }

            if (request.Description != null) membershipType.Description = request.Description;
            if (request.AnnualFee.HasValue) membershipType.AnnualFee = request.AnnualFee.Value;
            if (request.MaxFamilyMembers.HasValue) membershipType.MaxFamilyMembers = request.MaxFamilyMembers.Value;
            if (request.CanManageClubs.HasValue) membershipType.CanManageClubs = request.CanManageClubs.Value;
            if (request.CanManageEvents.HasValue) membershipType.CanManageEvents = request.CanManageEvents.Value;
            if (request.HasBoardVotingRights.HasValue) membershipType.HasBoardVotingRights = request.HasBoardVotingRights.Value;
            if (request.IsActive.HasValue) membershipType.IsActive = request.IsActive.Value;
            if (request.DisplayOrder.HasValue) membershipType.DisplayOrder = request.DisplayOrder.Value;
            if (request.Icon != null) membershipType.Icon = request.Icon;

            membershipType.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var dto = new MembershipTypeDto
            {
                MembershipTypeId = membershipType.MembershipTypeId,
                Name = membershipType.Name,
                Description = membershipType.Description,
                AnnualFee = membershipType.AnnualFee,
                MaxFamilyMembers = membershipType.MaxFamilyMembers,
                CanManageClubs = membershipType.CanManageClubs,
                CanManageEvents = membershipType.CanManageEvents,
                HasBoardVotingRights = membershipType.HasBoardVotingRights,
                IsActive = membershipType.IsActive,
                DisplayOrder = membershipType.DisplayOrder,
                Icon = membershipType.Icon
            };

            return Ok(new ApiResponse<MembershipTypeDto>
            {
                Success = true,
                Message = "Membership type updated successfully",
                Data = dto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating membership type");
            return StatusCode(500, new ApiResponse<MembershipTypeDto>
            {
                Success = false,
                Message = "An error occurred while updating membership type"
            });
        }
    }

    // DELETE: api/MembershipTypes/{id}
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteMembershipType(int id)
    {
        try
        {
            var membershipType = await _context.MembershipTypes.FindAsync(id);
            if (membershipType == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Membership type not found"
                });
            }

            // Check if any users have this membership type
            var hasUsers = await _context.Users.AnyAsync(u => u.MembershipTypeId == id);
            if (hasUsers)
            {
                return BadRequest(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Cannot delete membership type that is assigned to users. Deactivate it instead."
                });
            }

            _context.MembershipTypes.Remove(membershipType);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Membership type deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting membership type");
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting membership type"
            });
        }
    }
}
