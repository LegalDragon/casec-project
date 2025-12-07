using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using CasecApi.Data;
using CasecApi.Models.DTOs;
using UserEntity = CasecApi.Models.User;
using CasecApi.Models;

namespace CasecApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(CasecDbContext context, IConfiguration configuration, ILogger<AuthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new ApiResponse<LoginResponse>
                {
                    Success = false,
                    Message = "Email already registered"
                });
            }

            // Validate membership type
            var membershipType = await _context.MembershipTypes
                .FirstOrDefaultAsync(mt => mt.MembershipTypeId == request.MembershipTypeId && mt.IsActive);

            if (membershipType == null)
            {
                return BadRequest(new ApiResponse<LoginResponse>
                {
                    Success = false,
                    Message = "Invalid membership type"
                });
            }

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Create user
            var user = new UserEntity
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PasswordHash = passwordHash,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                City = request.City,
                State = request.State,
                ZipCode = request.ZipCode,
                Profession = request.Profession,
                Hobbies = request.Hobbies,
                Bio = request.Bio,
                Gender = request.Gender,
                DateOfBirth = request.DateOfBirth,
                MaritalStatus = request.MaritalStatus,
                MembershipTypeId = request.MembershipTypeId,
                IsAdmin = false,
                MemberSince = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Add family members if any
            if (request.FamilyMembers != null && request.FamilyMembers.Any())
            {
                foreach (var fm in request.FamilyMembers)
                {
                    var familyMember = new FamilyMember
                    {
                        UserId = user.UserId,
                        FirstName = fm.FirstName,
                        LastName = fm.LastName,
                        DateOfBirth = fm.DateOfBirth,
                        Relationship = fm.Relationship
                    };
                    _context.FamilyMembers.Add(familyMember);
                }
                await _context.SaveChangesAsync();
            }

            // Log activity
            await LogActivity(user.UserId, "Registration", "User registered successfully");

            // Generate token
            var token = GenerateJwtToken(user);

            var userDto = new UserDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
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
                MembershipTypeName = membershipType.Name,
                IsAdmin = user.IsAdmin,
                MemberSince = user.MemberSince
            };

            return Ok(new ApiResponse<LoginResponse>
            {
                Success = true,
                Message = "Registration successful",
                Data = new LoginResponse { Token = token, User = userDto }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = "An error occurred during registration"
            });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.MembershipType)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(new ApiResponse<LoginResponse>
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }

            if (!user.IsActive)
            {
                return Unauthorized(new ApiResponse<LoginResponse>
                {
                    Success = false,
                    Message = "Account is inactive. Please contact support."
                });
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Log activity
            await LogActivity(user.UserId, "Login", "User logged in successfully");

            // Generate token
            var token = GenerateJwtToken(user);

            var userDto = new UserDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
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
                MembershipTypeName = user.MembershipType?.Name ?? "",
                IsAdmin = user.IsAdmin,
                MemberSince = user.MemberSince
            };

            return Ok(new ApiResponse<LoginResponse>
            {
                Success = true,
                Message = "Login successful",
                Data = new LoginResponse { Token = token, User = userDto }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, new ApiResponse<LoginResponse>
            {
                Success = false,
                Message = "An error occurred during login"
            });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<object>>> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            // Always return success to prevent email enumeration attacks
            if (user == null)
            {
                _logger.LogWarning("Password reset requested for non-existent email: {Email}", request.Email);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "If an account with that email exists, a password reset link has been sent."
                });
            }

            // Invalidate any existing tokens for this user
            var existingTokens = await _context.PasswordResetTokens
                .Where(t => t.UserId == user.UserId && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var existingToken in existingTokens)
            {
                existingToken.IsUsed = true;
            }

            // Generate a new token
            var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
            var resetToken = new PasswordResetToken
            {
                UserId = user.UserId,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                IsUsed = false
            };

            _context.PasswordResetTokens.Add(resetToken);
            await _context.SaveChangesAsync();

            // Log activity
            await LogActivity(user.UserId, "PasswordResetRequested", "Password reset token generated");

            // Email is sent automatically via database trigger (TR_PasswordResetTokens_SendEmail)
            _logger.LogInformation("Password reset token generated for user {UserId}", user.UserId);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "If an account with that email exists, a password reset link has been sent."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred processing your request"
            });
        }
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<object>>> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            var resetToken = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Token == request.Token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

            if (resetToken == null)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid or expired reset token"
                });
            }

            // Validate password
            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Password must be at least 6 characters"
                });
            }

            // Update password
            var user = resetToken.User!;
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            // Mark token as used
            resetToken.IsUsed = true;

            await _context.SaveChangesAsync();

            // Log activity
            await LogActivity(user.UserId, "PasswordReset", "Password was reset successfully");

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Password has been reset successfully. You can now log in with your new password."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred processing your request"
            });
        }
    }

    [HttpGet("verify-reset-token/{token}")]
    public async Task<ActionResult<ApiResponse<object>>> VerifyResetToken(string token)
    {
        try
        {
            var resetToken = await _context.PasswordResetTokens
                .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

            if (resetToken == null)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid or expired reset token"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Token is valid"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying reset token");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred processing your request"
            });
        }
    }

    private string GenerateJwtToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Key"] ?? "DefaultSecretKeyForDevelopmentOnly123!"));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new Claim(ClaimTypes.Role, user.IsAdmin ? "Admin" : "User"),
            new Claim("MembershipTypeId", user.MembershipTypeId.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "CasecApi",
            audience: _configuration["Jwt:Audience"] ?? "CasecApp",
            claims: claims,
            expires: DateTime.Now.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task LogActivity(int userId, string activityType, string description)
    {
        try
        {
            var log = new ActivityLog
            {
                UserId = userId,
                ActivityType = activityType,
                Description = description,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging activity");
        }
    }
}
