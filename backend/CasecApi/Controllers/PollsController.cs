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
public class PollsController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<PollsController> _logger;

    public PollsController(CasecDbContext context, ILogger<PollsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private string GetClientIp()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    // GET: /Polls (Public - returns active polls)
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<PollDto>>>> GetActivePolls()
    {
        try
        {
            var now = DateTime.UtcNow;
            var userId = GetCurrentUserId();
            var sessionId = HttpContext.Request.Cookies["poll_session"] ?? Guid.NewGuid().ToString();

            // Set session cookie if not exists
            if (!HttpContext.Request.Cookies.ContainsKey("poll_session"))
            {
                HttpContext.Response.Cookies.Append("poll_session", sessionId, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTimeOffset.UtcNow.AddYears(1)
                });
            }

            var polls = await _context.Polls
                .Include(p => p.Options)
                .Include(p => p.Responses)
                .Where(p => p.Status == "Active" &&
                    (p.StartDate == null || p.StartDate <= now) &&
                    (p.EndDate == null || p.EndDate >= now))
                .OrderByDescending(p => p.IsFeatured)
                .ThenBy(p => p.DisplayOrder)
                .ThenByDescending(p => p.CreatedAt)
                .ToListAsync();

            // Filter by visibility
            if (userId == null)
            {
                polls = polls.Where(p => p.Visibility == "Anyone").ToList();
            }

            var pollDtos = polls.Select(p => MapToPollDto(p, userId, sessionId)).ToList();

            return Ok(new ApiResponse<List<PollDto>>
            {
                Success = true,
                Data = pollDtos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching active polls");
            return StatusCode(500, new ApiResponse<List<PollDto>>
            {
                Success = false,
                Message = "An error occurred while fetching polls"
            });
        }
    }

    // GET: /Polls/featured (Public - returns featured active poll)
    [AllowAnonymous]
    [HttpGet("featured")]
    public async Task<ActionResult<ApiResponse<PollDto>>> GetFeaturedPoll()
    {
        try
        {
            var now = DateTime.UtcNow;
            var userId = GetCurrentUserId();
            var sessionId = HttpContext.Request.Cookies["poll_session"] ?? Guid.NewGuid().ToString();

            var query = _context.Polls
                .Include(p => p.Options)
                .Include(p => p.Responses)
                .Where(p => p.Status == "Active" && p.IsFeatured &&
                    (p.StartDate == null || p.StartDate <= now) &&
                    (p.EndDate == null || p.EndDate >= now));

            if (userId == null)
            {
                query = query.Where(p => p.Visibility == "Anyone");
            }

            var poll = await query.FirstOrDefaultAsync();

            if (poll == null)
            {
                return Ok(new ApiResponse<PollDto>
                {
                    Success = true,
                    Data = null
                });
            }

            return Ok(new ApiResponse<PollDto>
            {
                Success = true,
                Data = MapToPollDto(poll, userId, sessionId)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching featured poll");
            return StatusCode(500, new ApiResponse<PollDto>
            {
                Success = false,
                Message = "An error occurred while fetching featured poll"
            });
        }
    }

    // GET: /Polls/{id} (Public for active polls)
    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PollDto>>> GetPoll(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var sessionId = HttpContext.Request.Cookies["poll_session"] ?? Guid.NewGuid().ToString();

            var poll = await _context.Polls
                .Include(p => p.Options)
                .Include(p => p.Responses)
                .FirstOrDefaultAsync(p => p.PollId == id);

            if (poll == null)
            {
                return NotFound(new ApiResponse<PollDto>
                {
                    Success = false,
                    Message = "Poll not found"
                });
            }

            // Check visibility for non-admin users
            if (poll.Status != "Active" || (poll.Visibility == "MembersOnly" && userId == null))
            {
                var currentUser = userId != null ? await _context.Users.FindAsync(userId) : null;
                if (currentUser == null || !currentUser.IsAdmin)
                {
                    return NotFound(new ApiResponse<PollDto>
                    {
                        Success = false,
                        Message = "Poll not found"
                    });
                }
            }

            return Ok(new ApiResponse<PollDto>
            {
                Success = true,
                Data = MapToPollDto(poll, userId, sessionId)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching poll {PollId}", id);
            return StatusCode(500, new ApiResponse<PollDto>
            {
                Success = false,
                Message = "An error occurred while fetching poll"
            });
        }
    }

    // GET: /Polls/admin/all (Admin only - includes all polls)
    [Authorize(Roles = "Admin")]
    [HttpGet("admin/all")]
    public async Task<ActionResult<ApiResponse<List<PollAdminDto>>>> GetAllPolls()
    {
        try
        {
            var polls = await _context.Polls
                .Include(p => p.Options)
                .Include(p => p.Responses)
                .Include(p => p.CreatedByUser)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var pollDtos = polls.Select(p => new PollAdminDto
            {
                PollId = p.PollId,
                Question = p.Question,
                Description = p.Description,
                PollType = p.PollType,
                Visibility = p.Visibility,
                AllowAnonymous = p.AllowAnonymous,
                ShowResultsToVoters = p.ShowResultsToVoters,
                AllowChangeVote = p.AllowChangeVote,
                MaxSelections = p.MaxSelections,
                RatingMin = p.RatingMin,
                RatingMax = p.RatingMax,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                Status = p.Status,
                IsFeatured = p.IsFeatured,
                DisplayOrder = p.DisplayOrder,
                CreatedBy = p.CreatedBy,
                CreatedByName = p.CreatedByUser != null ? $"{p.CreatedByUser.FirstName} {p.CreatedByUser.LastName}" : null,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                TotalResponses = p.Responses.Count,
                Options = p.Options.OrderBy(o => o.DisplayOrder).Select(o => new PollOptionDto
                {
                    OptionId = o.OptionId,
                    OptionText = o.OptionText,
                    ImageUrl = o.ImageUrl,
                    DisplayOrder = o.DisplayOrder,
                    VoteCount = p.Responses.Count(r => r.SelectedOptionIds != null &&
                        r.SelectedOptionIds.Split(',').Contains(o.OptionId.ToString()))
                }).ToList()
            }).ToList();

            return Ok(new ApiResponse<List<PollAdminDto>>
            {
                Success = true,
                Data = pollDtos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all polls");
            return StatusCode(500, new ApiResponse<List<PollAdminDto>>
            {
                Success = false,
                Message = "An error occurred while fetching polls"
            });
        }
    }

    // GET: /Polls/{id}/results (Admin only - detailed results)
    [Authorize(Roles = "Admin")]
    [HttpGet("{id}/results")]
    public async Task<ActionResult<ApiResponse<PollResultsDto>>> GetPollResults(int id)
    {
        try
        {
            var poll = await _context.Polls
                .Include(p => p.Options)
                .Include(p => p.Responses)
                    .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(p => p.PollId == id);

            if (poll == null)
            {
                return NotFound(new ApiResponse<PollResultsDto>
                {
                    Success = false,
                    Message = "Poll not found"
                });
            }

            var results = new PollResultsDto
            {
                PollId = poll.PollId,
                Question = poll.Question,
                PollType = poll.PollType,
                TotalResponses = poll.Responses.Count,
                Options = poll.Options.OrderBy(o => o.DisplayOrder).Select(o => new PollOptionResultDto
                {
                    OptionId = o.OptionId,
                    OptionText = o.OptionText,
                    VoteCount = poll.Responses.Count(r => r.SelectedOptionIds != null &&
                        r.SelectedOptionIds.Split(',').Contains(o.OptionId.ToString())),
                    Percentage = poll.Responses.Count > 0
                        ? Math.Round((double)poll.Responses.Count(r => r.SelectedOptionIds != null &&
                            r.SelectedOptionIds.Split(',').Contains(o.OptionId.ToString())) / poll.Responses.Count * 100, 1)
                        : 0
                }).ToList(),
                Responses = poll.Responses.OrderByDescending(r => r.RespondedAt).Select(r => new PollResponseDetailDto
                {
                    ResponseId = r.ResponseId,
                    SelectedOptionIds = r.SelectedOptionIds,
                    RatingValue = r.RatingValue,
                    TextResponse = r.TextResponse,
                    IsAnonymous = r.IsAnonymous,
                    RespondedAt = r.RespondedAt,
                    UserName = r.IsAnonymous || r.User == null ? null : $"{r.User.FirstName} {r.User.LastName}",
                    IsGuest = r.UserId == null
                }).ToList()
            };

            // Calculate average for rating polls
            if (poll.PollType == "Rating" && poll.Responses.Any(r => r.RatingValue.HasValue))
            {
                results.AverageRating = Math.Round(poll.Responses
                    .Where(r => r.RatingValue.HasValue)
                    .Average(r => r.RatingValue!.Value), 2);
            }

            return Ok(new ApiResponse<PollResultsDto>
            {
                Success = true,
                Data = results
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching poll results {PollId}", id);
            return StatusCode(500, new ApiResponse<PollResultsDto>
            {
                Success = false,
                Message = "An error occurred while fetching poll results"
            });
        }
    }

    // POST: /Polls (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<PollAdminDto>>> CreatePoll([FromBody] CreatePollRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();

            var poll = new Poll
            {
                Question = request.Question,
                Description = request.Description,
                PollType = request.PollType ?? "SingleChoice",
                Visibility = request.Visibility ?? "Anyone",
                AllowAnonymous = request.AllowAnonymous ?? true,
                ShowResultsToVoters = request.ShowResultsToVoters ?? true,
                AllowChangeVote = request.AllowChangeVote ?? false,
                MaxSelections = request.MaxSelections,
                RatingMin = request.RatingMin ?? 1,
                RatingMax = request.RatingMax ?? 5,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Status = request.Status ?? "Draft",
                IsFeatured = request.IsFeatured ?? false,
                DisplayOrder = request.DisplayOrder ?? 0,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Polls.Add(poll);
            await _context.SaveChangesAsync();

            // Add options
            if (request.Options != null && request.Options.Any())
            {
                var displayOrder = 0;
                foreach (var optionText in request.Options)
                {
                    var option = new PollOption
                    {
                        PollId = poll.PollId,
                        OptionText = optionText,
                        DisplayOrder = displayOrder++,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.PollOptions.Add(option);
                }
                await _context.SaveChangesAsync();
            }

            // Log activity
            if (userId.HasValue)
            {
                var log = new ActivityLog
                {
                    UserId = userId.Value,
                    ActivityType = "PollCreated",
                    Description = $"Created poll: {poll.Question}"
                };
                _context.ActivityLogs.Add(log);
                await _context.SaveChangesAsync();
            }

            // Reload with options
            poll = await _context.Polls
                .Include(p => p.Options)
                .Include(p => p.CreatedByUser)
                .FirstOrDefaultAsync(p => p.PollId == poll.PollId);

            return Ok(new ApiResponse<PollAdminDto>
            {
                Success = true,
                Message = "Poll created successfully",
                Data = MapToAdminDto(poll!)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating poll");
            return StatusCode(500, new ApiResponse<PollAdminDto>
            {
                Success = false,
                Message = "An error occurred while creating poll"
            });
        }
    }

    // PUT: /Polls/{id} (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<PollAdminDto>>> UpdatePoll(int id, [FromBody] UpdatePollRequest request)
    {
        try
        {
            var poll = await _context.Polls
                .Include(p => p.Options)
                .FirstOrDefaultAsync(p => p.PollId == id);

            if (poll == null)
            {
                return NotFound(new ApiResponse<PollAdminDto>
                {
                    Success = false,
                    Message = "Poll not found"
                });
            }

            // Update poll fields
            if (!string.IsNullOrEmpty(request.Question))
                poll.Question = request.Question;
            if (request.Description != null)
                poll.Description = request.Description;
            if (!string.IsNullOrEmpty(request.PollType))
                poll.PollType = request.PollType;
            if (!string.IsNullOrEmpty(request.Visibility))
                poll.Visibility = request.Visibility;
            if (request.AllowAnonymous.HasValue)
                poll.AllowAnonymous = request.AllowAnonymous.Value;
            if (request.ShowResultsToVoters.HasValue)
                poll.ShowResultsToVoters = request.ShowResultsToVoters.Value;
            if (request.AllowChangeVote.HasValue)
                poll.AllowChangeVote = request.AllowChangeVote.Value;
            if (request.MaxSelections.HasValue)
                poll.MaxSelections = request.MaxSelections;
            if (request.RatingMin.HasValue)
                poll.RatingMin = request.RatingMin;
            if (request.RatingMax.HasValue)
                poll.RatingMax = request.RatingMax;
            if (request.StartDate.HasValue)
                poll.StartDate = request.StartDate;
            if (request.EndDate.HasValue)
                poll.EndDate = request.EndDate;
            if (!string.IsNullOrEmpty(request.Status))
                poll.Status = request.Status;
            if (request.IsFeatured.HasValue)
                poll.IsFeatured = request.IsFeatured.Value;
            if (request.DisplayOrder.HasValue)
                poll.DisplayOrder = request.DisplayOrder.Value;

            poll.UpdatedAt = DateTime.UtcNow;

            // Update options if provided
            if (request.Options != null)
            {
                // Remove old options
                _context.PollOptions.RemoveRange(poll.Options);

                // Add new options
                var displayOrder = 0;
                foreach (var optionText in request.Options)
                {
                    var option = new PollOption
                    {
                        PollId = poll.PollId,
                        OptionText = optionText,
                        DisplayOrder = displayOrder++,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.PollOptions.Add(option);
                }
            }

            await _context.SaveChangesAsync();

            // Reload with updated options
            poll = await _context.Polls
                .Include(p => p.Options)
                .Include(p => p.Responses)
                .Include(p => p.CreatedByUser)
                .FirstOrDefaultAsync(p => p.PollId == poll.PollId);

            return Ok(new ApiResponse<PollAdminDto>
            {
                Success = true,
                Message = "Poll updated successfully",
                Data = MapToAdminDto(poll!)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating poll {PollId}", id);
            return StatusCode(500, new ApiResponse<PollAdminDto>
            {
                Success = false,
                Message = "An error occurred while updating poll"
            });
        }
    }

    // DELETE: /Polls/{id} (Admin only)
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePoll(int id)
    {
        try
        {
            var poll = await _context.Polls
                .Include(p => p.Options)
                .Include(p => p.Responses)
                .FirstOrDefaultAsync(p => p.PollId == id);

            if (poll == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Poll not found"
                });
            }

            // Delete responses, options, and poll (cascade should handle this, but being explicit)
            _context.PollResponses.RemoveRange(poll.Responses);
            _context.PollOptions.RemoveRange(poll.Options);
            _context.Polls.Remove(poll);
            await _context.SaveChangesAsync();

            // Log activity
            var userId = GetCurrentUserId();
            if (userId.HasValue)
            {
                var log = new ActivityLog
                {
                    UserId = userId.Value,
                    ActivityType = "PollDeleted",
                    Description = $"Deleted poll: {poll.Question}"
                };
                _context.ActivityLogs.Add(log);
                await _context.SaveChangesAsync();
            }

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Poll deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting poll {PollId}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting poll"
            });
        }
    }

    // POST: /Polls/{id}/vote (Public - anyone can vote based on poll settings)
    [AllowAnonymous]
    [HttpPost("{id}/vote")]
    public async Task<ActionResult<ApiResponse<PollDto>>> Vote(int id, [FromBody] VotePollRequest request)
    {
        try
        {
            var now = DateTime.UtcNow;
            var userId = GetCurrentUserId();
            var sessionId = HttpContext.Request.Cookies["poll_session"] ?? Guid.NewGuid().ToString();
            var ipAddress = GetClientIp();

            // Set session cookie if not exists
            if (!HttpContext.Request.Cookies.ContainsKey("poll_session"))
            {
                HttpContext.Response.Cookies.Append("poll_session", sessionId, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTimeOffset.UtcNow.AddYears(1)
                });
            }

            var poll = await _context.Polls
                .Include(p => p.Options)
                .Include(p => p.Responses)
                .FirstOrDefaultAsync(p => p.PollId == id);

            if (poll == null)
            {
                return NotFound(new ApiResponse<PollDto>
                {
                    Success = false,
                    Message = "Poll not found"
                });
            }

            // Check if poll is active
            if (poll.Status != "Active")
            {
                return BadRequest(new ApiResponse<PollDto>
                {
                    Success = false,
                    Message = "This poll is not currently active"
                });
            }

            // Check date range
            if ((poll.StartDate.HasValue && poll.StartDate > now) ||
                (poll.EndDate.HasValue && poll.EndDate < now))
            {
                return BadRequest(new ApiResponse<PollDto>
                {
                    Success = false,
                    Message = "This poll is not open for voting"
                });
            }

            // Check visibility
            if (poll.Visibility == "MembersOnly" && userId == null)
            {
                return BadRequest(new ApiResponse<PollDto>
                {
                    Success = false,
                    Message = "You must be logged in to vote on this poll"
                });
            }

            // Check for existing vote
            PollResponse? existingResponse = null;
            if (userId.HasValue)
            {
                existingResponse = poll.Responses.FirstOrDefault(r => r.UserId == userId);
            }
            else
            {
                existingResponse = poll.Responses.FirstOrDefault(r => r.SessionId == sessionId);
            }

            if (existingResponse != null && !poll.AllowChangeVote)
            {
                return BadRequest(new ApiResponse<PollDto>
                {
                    Success = false,
                    Message = "You have already voted on this poll"
                });
            }

            // Validate vote based on poll type
            if (poll.PollType == "SingleChoice" || poll.PollType == "MultipleChoice")
            {
                if (request.SelectedOptionIds == null || !request.SelectedOptionIds.Any())
                {
                    return BadRequest(new ApiResponse<PollDto>
                    {
                        Success = false,
                        Message = "Please select at least one option"
                    });
                }

                // Validate option IDs exist
                var validOptionIds = poll.Options.Select(o => o.OptionId).ToHashSet();
                if (!request.SelectedOptionIds.All(id => validOptionIds.Contains(id)))
                {
                    return BadRequest(new ApiResponse<PollDto>
                    {
                        Success = false,
                        Message = "Invalid option selected"
                    });
                }

                // Check max selections for multiple choice
                if (poll.PollType == "MultipleChoice" && poll.MaxSelections.HasValue &&
                    request.SelectedOptionIds.Count > poll.MaxSelections.Value)
                {
                    return BadRequest(new ApiResponse<PollDto>
                    {
                        Success = false,
                        Message = $"You can select up to {poll.MaxSelections.Value} options"
                    });
                }

                // Single choice validation
                if (poll.PollType == "SingleChoice" && request.SelectedOptionIds.Count > 1)
                {
                    return BadRequest(new ApiResponse<PollDto>
                    {
                        Success = false,
                        Message = "You can only select one option"
                    });
                }
            }
            else if (poll.PollType == "Rating")
            {
                if (!request.RatingValue.HasValue)
                {
                    return BadRequest(new ApiResponse<PollDto>
                    {
                        Success = false,
                        Message = "Please provide a rating"
                    });
                }

                if (request.RatingValue < poll.RatingMin || request.RatingValue > poll.RatingMax)
                {
                    return BadRequest(new ApiResponse<PollDto>
                    {
                        Success = false,
                        Message = $"Rating must be between {poll.RatingMin} and {poll.RatingMax}"
                    });
                }
            }
            else if (poll.PollType == "Text")
            {
                if (string.IsNullOrWhiteSpace(request.TextResponse))
                {
                    return BadRequest(new ApiResponse<PollDto>
                    {
                        Success = false,
                        Message = "Please provide a response"
                    });
                }
            }

            // Create or update response
            if (existingResponse != null)
            {
                // Update existing response
                existingResponse.SelectedOptionIds = request.SelectedOptionIds != null
                    ? string.Join(",", request.SelectedOptionIds)
                    : null;
                existingResponse.RatingValue = request.RatingValue;
                existingResponse.TextResponse = request.TextResponse;
                existingResponse.IsAnonymous = request.IsAnonymous ?? false;
                existingResponse.RespondedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new response
                var response = new PollResponse
                {
                    PollId = poll.PollId,
                    SelectedOptionIds = request.SelectedOptionIds != null
                        ? string.Join(",", request.SelectedOptionIds)
                        : null,
                    RatingValue = request.RatingValue,
                    TextResponse = request.TextResponse,
                    UserId = userId,
                    IsAnonymous = request.IsAnonymous ?? false,
                    SessionId = sessionId,
                    IpAddress = ipAddress,
                    RespondedAt = DateTime.UtcNow
                };
                _context.PollResponses.Add(response);
            }

            await _context.SaveChangesAsync();

            // Reload poll with updated responses
            poll = await _context.Polls
                .Include(p => p.Options)
                .Include(p => p.Responses)
                .FirstOrDefaultAsync(p => p.PollId == id);

            return Ok(new ApiResponse<PollDto>
            {
                Success = true,
                Message = existingResponse != null ? "Vote updated successfully" : "Vote recorded successfully",
                Data = MapToPollDto(poll!, userId, sessionId)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error voting on poll {PollId}", id);
            return StatusCode(500, new ApiResponse<PollDto>
            {
                Success = false,
                Message = "An error occurred while recording your vote"
            });
        }
    }

    // Helper method to map Poll to PollDto
    private PollDto MapToPollDto(Poll poll, int? userId, string sessionId)
    {
        // Check if user has voted
        var hasVoted = false;
        PollResponse? userResponse = null;

        if (userId.HasValue)
        {
            userResponse = poll.Responses.FirstOrDefault(r => r.UserId == userId);
            hasVoted = userResponse != null;
        }
        else
        {
            userResponse = poll.Responses.FirstOrDefault(r => r.SessionId == sessionId);
            hasVoted = userResponse != null;
        }

        // Determine if results should be shown
        var showResults = hasVoted && poll.ShowResultsToVoters;

        return new PollDto
        {
            PollId = poll.PollId,
            Question = poll.Question,
            Description = poll.Description,
            PollType = poll.PollType,
            Visibility = poll.Visibility,
            AllowAnonymous = poll.AllowAnonymous,
            ShowResultsToVoters = poll.ShowResultsToVoters,
            AllowChangeVote = poll.AllowChangeVote,
            MaxSelections = poll.MaxSelections,
            RatingMin = poll.RatingMin,
            RatingMax = poll.RatingMax,
            StartDate = poll.StartDate,
            EndDate = poll.EndDate,
            IsFeatured = poll.IsFeatured,
            TotalResponses = showResults ? poll.Responses.Count : null,
            HasVoted = hasVoted,
            UserResponse = userResponse != null ? new UserPollResponseDto
            {
                SelectedOptionIds = userResponse.SelectedOptionIds?.Split(',')
                    .Where(s => !string.IsNullOrEmpty(s))
                    .Select(int.Parse)
                    .ToList(),
                RatingValue = userResponse.RatingValue,
                TextResponse = userResponse.TextResponse,
                IsAnonymous = userResponse.IsAnonymous
            } : null,
            Options = poll.Options.OrderBy(o => o.DisplayOrder).Select(o => new PollOptionDto
            {
                OptionId = o.OptionId,
                OptionText = o.OptionText,
                ImageUrl = o.ImageUrl,
                DisplayOrder = o.DisplayOrder,
                VoteCount = showResults ? poll.Responses.Count(r => r.SelectedOptionIds != null &&
                    r.SelectedOptionIds.Split(',').Contains(o.OptionId.ToString())) : null,
                Percentage = showResults && poll.Responses.Count > 0
                    ? Math.Round((double)poll.Responses.Count(r => r.SelectedOptionIds != null &&
                        r.SelectedOptionIds.Split(',').Contains(o.OptionId.ToString())) / poll.Responses.Count * 100, 1)
                    : null
            }).ToList()
        };
    }

    // Helper method to map Poll to PollAdminDto
    private PollAdminDto MapToAdminDto(Poll poll)
    {
        return new PollAdminDto
        {
            PollId = poll.PollId,
            Question = poll.Question,
            Description = poll.Description,
            PollType = poll.PollType,
            Visibility = poll.Visibility,
            AllowAnonymous = poll.AllowAnonymous,
            ShowResultsToVoters = poll.ShowResultsToVoters,
            AllowChangeVote = poll.AllowChangeVote,
            MaxSelections = poll.MaxSelections,
            RatingMin = poll.RatingMin,
            RatingMax = poll.RatingMax,
            StartDate = poll.StartDate,
            EndDate = poll.EndDate,
            Status = poll.Status,
            IsFeatured = poll.IsFeatured,
            DisplayOrder = poll.DisplayOrder,
            CreatedBy = poll.CreatedBy,
            CreatedByName = poll.CreatedByUser != null ? $"{poll.CreatedByUser.FirstName} {poll.CreatedByUser.LastName}" : null,
            CreatedAt = poll.CreatedAt,
            UpdatedAt = poll.UpdatedAt,
            TotalResponses = poll.Responses?.Count ?? 0,
            Options = poll.Options?.OrderBy(o => o.DisplayOrder).Select(o => new PollOptionDto
            {
                OptionId = o.OptionId,
                OptionText = o.OptionText,
                ImageUrl = o.ImageUrl,
                DisplayOrder = o.DisplayOrder,
                VoteCount = poll.Responses?.Count(r => r.SelectedOptionIds != null &&
                    r.SelectedOptionIds.Split(',').Contains(o.OptionId.ToString())) ?? 0
            }).ToList() ?? new List<PollOptionDto>()
        };
    }
}

// DTOs for Polls
public class PollDto
{
    public int PollId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string PollType { get; set; } = string.Empty;
    public string Visibility { get; set; } = string.Empty;
    public bool AllowAnonymous { get; set; }
    public bool ShowResultsToVoters { get; set; }
    public bool AllowChangeVote { get; set; }
    public int? MaxSelections { get; set; }
    public int? RatingMin { get; set; }
    public int? RatingMax { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsFeatured { get; set; }
    public int? TotalResponses { get; set; }
    public bool HasVoted { get; set; }
    public UserPollResponseDto? UserResponse { get; set; }
    public List<PollOptionDto> Options { get; set; } = new();
}

public class PollAdminDto : PollDto
{
    public string Status { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public int? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public new int TotalResponses { get; set; }
}

public class PollOptionDto
{
    public int OptionId { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int DisplayOrder { get; set; }
    public int? VoteCount { get; set; }
    public double? Percentage { get; set; }
}

public class UserPollResponseDto
{
    public List<int>? SelectedOptionIds { get; set; }
    public int? RatingValue { get; set; }
    public string? TextResponse { get; set; }
    public bool IsAnonymous { get; set; }
}

public class PollResultsDto
{
    public int PollId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string PollType { get; set; } = string.Empty;
    public int TotalResponses { get; set; }
    public double? AverageRating { get; set; }
    public List<PollOptionResultDto> Options { get; set; } = new();
    public List<PollResponseDetailDto> Responses { get; set; } = new();
}

public class PollOptionResultDto
{
    public int OptionId { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public int VoteCount { get; set; }
    public double Percentage { get; set; }
}

public class PollResponseDetailDto
{
    public int ResponseId { get; set; }
    public string? SelectedOptionIds { get; set; }
    public int? RatingValue { get; set; }
    public string? TextResponse { get; set; }
    public bool IsAnonymous { get; set; }
    public DateTime RespondedAt { get; set; }
    public string? UserName { get; set; }
    public bool IsGuest { get; set; }
}

public class CreatePollRequest
{
    public string Question { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PollType { get; set; }
    public string? Visibility { get; set; }
    public bool? AllowAnonymous { get; set; }
    public bool? ShowResultsToVoters { get; set; }
    public bool? AllowChangeVote { get; set; }
    public int? MaxSelections { get; set; }
    public int? RatingMin { get; set; }
    public int? RatingMax { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Status { get; set; }
    public bool? IsFeatured { get; set; }
    public int? DisplayOrder { get; set; }
    public List<string>? Options { get; set; }
}

public class UpdatePollRequest
{
    public string? Question { get; set; }
    public string? Description { get; set; }
    public string? PollType { get; set; }
    public string? Visibility { get; set; }
    public bool? AllowAnonymous { get; set; }
    public bool? ShowResultsToVoters { get; set; }
    public bool? AllowChangeVote { get; set; }
    public int? MaxSelections { get; set; }
    public int? RatingMin { get; set; }
    public int? RatingMax { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Status { get; set; }
    public bool? IsFeatured { get; set; }
    public int? DisplayOrder { get; set; }
    public List<string>? Options { get; set; }
}

public class VotePollRequest
{
    public List<int>? SelectedOptionIds { get; set; }
    public int? RatingValue { get; set; }
    public string? TextResponse { get; set; }
    public bool? IsAnonymous { get; set; }
}
