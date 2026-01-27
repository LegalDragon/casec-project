using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CasecApi.Data;
using CasecApi.Models;
using CasecApi.Models.DTOs;
using System.Security.Claims;
using System.Text.Json;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
public class SurveysController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<SurveysController> _logger;
    private const string SessionCookieName = "survey_session_id";

    public SurveysController(CasecDbContext context, ILogger<SurveysController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // DTOs
    public class SurveyDto
    {
        public int SurveyId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Visibility { get; set; } = "Anyone";
        public bool AllowAnonymous { get; set; }
        public bool ShowResultsToRespondents { get; set; }
        public bool ShowProgressBar { get; set; }
        public bool RequireAllQuestions { get; set; }
        public string Status { get; set; } = "Draft";
        public bool IsFeatured { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? ThankYouMessage { get; set; }
        public int QuestionCount { get; set; }
        public int ResponseCount { get; set; }
        public List<SurveyQuestionDto> Questions { get; set; } = new();
    }

    public class SurveyQuestionDto
    {
        public int QuestionId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string? HelpText { get; set; }
        public string QuestionType { get; set; } = "SingleChoice";
        public bool IsRequired { get; set; }
        public List<string>? Options { get; set; }
        public int? MaxSelections { get; set; }
        public int? RatingMin { get; set; }
        public int? RatingMax { get; set; }
        public string? RatingMinLabel { get; set; }
        public string? RatingMaxLabel { get; set; }
        public int? MinLength { get; set; }
        public int? MaxLength { get; set; }
        public decimal? MinValue { get; set; }
        public decimal? MaxValue { get; set; }
        public string? Placeholder { get; set; }
        public int DisplayOrder { get; set; }
        public int? ConditionalOnQuestionId { get; set; }
        public List<string>? ConditionalOnValues { get; set; }
    }

    public class SurveyAdminDto : SurveyDto
    {
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? CreatedByName { get; set; }
        public bool AllowEditResponse { get; set; }
        public bool RandomizeQuestions { get; set; }
        public bool OneResponsePerUser { get; set; }
        public string? RedirectUrl { get; set; }
    }

    public class CreateSurveyDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Visibility { get; set; } = "Anyone";
        public bool AllowAnonymous { get; set; } = true;
        public bool ShowResultsToRespondents { get; set; } = false;
        public bool AllowEditResponse { get; set; } = false;
        public bool RequireAllQuestions { get; set; } = false;
        public bool ShowProgressBar { get; set; } = true;
        public bool RandomizeQuestions { get; set; } = false;
        public bool OneResponsePerUser { get; set; } = true;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = "Draft";
        public bool IsFeatured { get; set; } = false;
        public string? ThankYouMessage { get; set; }
        public string? RedirectUrl { get; set; }
        public List<CreateQuestionDto> Questions { get; set; } = new();
    }

    public class CreateQuestionDto
    {
        public string QuestionText { get; set; } = string.Empty;
        public string? HelpText { get; set; }
        public string QuestionType { get; set; } = "SingleChoice";
        public bool IsRequired { get; set; } = false;
        public List<string>? Options { get; set; }
        public int? MaxSelections { get; set; }
        public int? RatingMin { get; set; }
        public int? RatingMax { get; set; }
        public string? RatingMinLabel { get; set; }
        public string? RatingMaxLabel { get; set; }
        public int? MinLength { get; set; }
        public int? MaxLength { get; set; }
        public decimal? MinValue { get; set; }
        public decimal? MaxValue { get; set; }
        public string? Placeholder { get; set; }
        public int DisplayOrder { get; set; }
        public int? ConditionalOnQuestionIndex { get; set; }
        public List<string>? ConditionalOnValues { get; set; }
    }

    public class SubmitAnswerDto
    {
        public int QuestionId { get; set; }
        public string? SelectedOption { get; set; }
        public List<string>? SelectedOptions { get; set; }
        public int? RatingValue { get; set; }
        public string? TextValue { get; set; }
        public decimal? NumberValue { get; set; }
        public DateTime? DateValue { get; set; }
    }

    public class StartSurveyDto
    {
        public bool IsAnonymous { get; set; } = false;
    }

    public class SurveyResponseDto
    {
        public int ResponseId { get; set; }
        public int SurveyId { get; set; }
        public string Status { get; set; } = "InProgress";
        public int CurrentQuestionIndex { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public List<SurveyAnswerDto> Answers { get; set; } = new();
    }

    public class SurveyAnswerDto
    {
        public int QuestionId { get; set; }
        public string? SelectedOption { get; set; }
        public List<string>? SelectedOptions { get; set; }
        public int? RatingValue { get; set; }
        public string? TextValue { get; set; }
        public decimal? NumberValue { get; set; }
        public DateTime? DateValue { get; set; }
    }

    public class SurveyResultsDto
    {
        public int SurveyId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int TotalResponses { get; set; }
        public int CompletedResponses { get; set; }
        public List<QuestionResultDto> QuestionResults { get; set; } = new();
    }

    public class QuestionResultDto
    {
        public int QuestionId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string QuestionType { get; set; } = string.Empty;
        public int ResponseCount { get; set; }
        public List<OptionResultDto>? OptionResults { get; set; }
        public double? AverageRating { get; set; }
        public List<string>? TextResponses { get; set; }
        public double? AverageNumber { get; set; }
    }

    public class OptionResultDto
    {
        public string Option { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    // Helper methods
    private int? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private bool IsAdmin()
    {
        return User.IsInRole("Admin");
    }

    private string GetOrCreateSessionId()
    {
        if (Request.Cookies.TryGetValue(SessionCookieName, out var sessionId) && !string.IsNullOrEmpty(sessionId))
        {
            return sessionId;
        }

        sessionId = Guid.NewGuid().ToString();
        Response.Cookies.Append(SessionCookieName, sessionId, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddYears(1)
        });

        return sessionId;
    }

    private string? GetClientIpAddress()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString();
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

    private ActionResult<T> ForbiddenResponse<T>(string message = "You do not have permission to perform this action")
    {
        return StatusCode(403, new ApiResponse<T> { Success = false, Message = message });
    }

    private IQueryable<Survey> GetActiveSurveysQuery()
    {
        var now = DateTime.UtcNow;
        return _context.Surveys
            .Where(s => s.Status == "Active")
            .Where(s => !s.StartDate.HasValue || s.StartDate <= now)
            .Where(s => !s.EndDate.HasValue || s.EndDate >= now);
    }

    // Public endpoints

    // GET: api/surveys - Get active surveys for public
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<SurveyDto>>>> GetActiveSurveys()
    {
        try
        {
            var userId = GetUserId();
            var surveys = await GetActiveSurveysQuery()
                .Include(s => s.Questions)
                .OrderBy(s => s.DisplayOrder)
                .ThenByDescending(s => s.CreatedAt)
                .ToListAsync();

            // Filter by visibility
            var filteredSurveys = surveys.Where(s =>
                s.Visibility == "Anyone" || (s.Visibility == "MembersOnly" && userId.HasValue)
            ).ToList();

            var result = filteredSurveys.Select(s => new SurveyDto
            {
                SurveyId = s.SurveyId,
                Title = s.Title,
                Description = s.Description,
                Visibility = s.Visibility,
                AllowAnonymous = s.AllowAnonymous,
                ShowResultsToRespondents = s.ShowResultsToRespondents,
                ShowProgressBar = s.ShowProgressBar,
                RequireAllQuestions = s.RequireAllQuestions,
                Status = s.Status,
                IsFeatured = s.IsFeatured,
                StartDate = s.StartDate,
                EndDate = s.EndDate,
                ThankYouMessage = s.ThankYouMessage,
                QuestionCount = s.Questions.Count
            }).ToList();

            return Ok(new ApiResponse<List<SurveyDto>> { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active surveys");
            return StatusCode(500, new ApiResponse<List<SurveyDto>> { Success = false, Message = "Error getting surveys" });
        }
    }

    // GET: api/surveys/featured - Get featured survey
    [HttpGet("featured")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<SurveyDto>>> GetFeaturedSurvey()
    {
        try
        {
            var userId = GetUserId();
            var survey = await GetActiveSurveysQuery()
                .Where(s => s.IsFeatured)
                .Include(s => s.Questions.OrderBy(q => q.DisplayOrder))
                .OrderBy(s => s.DisplayOrder)
                .FirstOrDefaultAsync();

            if (survey == null)
            {
                return Ok(new ApiResponse<SurveyDto> { Success = true, Data = null });
            }

            // Check visibility
            if (survey.Visibility == "MembersOnly" && !userId.HasValue)
            {
                return Ok(new ApiResponse<SurveyDto> { Success = true, Data = null });
            }

            var result = MapToSurveyDto(survey);
            return Ok(new ApiResponse<SurveyDto> { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting featured survey");
            return StatusCode(500, new ApiResponse<SurveyDto> { Success = false, Message = "Error getting featured survey" });
        }
    }

    // GET: api/surveys/{id} - Get survey by ID
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<SurveyDto>>> GetSurvey(int id)
    {
        try
        {
            var userId = GetUserId();
            var survey = await _context.Surveys
                .Include(s => s.Questions.OrderBy(q => q.DisplayOrder))
                .FirstOrDefaultAsync(s => s.SurveyId == id);

            if (survey == null)
            {
                return NotFound(new ApiResponse<SurveyDto> { Success = false, Message = "Survey not found" });
            }

            // Check if survey is accessible
            if (survey.Status != "Active" && !IsAdmin())
            {
                return NotFound(new ApiResponse<SurveyDto> { Success = false, Message = "Survey not found" });
            }

            if (survey.Visibility == "MembersOnly" && !userId.HasValue)
            {
                return Unauthorized(new ApiResponse<SurveyDto> { Success = false, Message = "This survey is for members only" });
            }

            var result = MapToSurveyDto(survey);
            return Ok(new ApiResponse<SurveyDto> { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting survey {SurveyId}", id);
            return StatusCode(500, new ApiResponse<SurveyDto> { Success = false, Message = "Error getting survey" });
        }
    }

    // POST: api/surveys/{id}/start - Start a survey response
    [HttpPost("{id}/start")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<SurveyResponseDto>>> StartSurvey(int id, [FromBody] StartSurveyDto? dto)
    {
        try
        {
            var survey = await _context.Surveys
                .Include(s => s.Questions.OrderBy(q => q.DisplayOrder))
                .FirstOrDefaultAsync(s => s.SurveyId == id && s.Status == "Active");

            if (survey == null)
            {
                return NotFound(new ApiResponse<SurveyResponseDto> { Success = false, Message = "Survey not found" });
            }

            var userId = GetUserId();
            var sessionId = GetOrCreateSessionId();

            // Check visibility
            if (survey.Visibility == "MembersOnly" && !userId.HasValue)
            {
                return Unauthorized(new ApiResponse<SurveyResponseDto> { Success = false, Message = "This survey is for members only" });
            }

            // Check for existing response
            SurveyResponse? existingResponse = null;
            if (survey.OneResponsePerUser)
            {
                if (userId.HasValue)
                {
                    existingResponse = await _context.SurveyResponses
                        .Include(r => r.Answers)
                        .FirstOrDefaultAsync(r => r.SurveyId == id && r.UserId == userId);
                }
                else
                {
                    existingResponse = await _context.SurveyResponses
                        .Include(r => r.Answers)
                        .FirstOrDefaultAsync(r => r.SurveyId == id && r.SessionId == sessionId && r.UserId == null);
                }

                if (existingResponse != null)
                {
                    if (existingResponse.Status == "Completed" && !survey.AllowEditResponse)
                    {
                        return BadRequest(new ApiResponse<SurveyResponseDto> { Success = false, Message = "You have already completed this survey" });
                    }

                    // Return existing response
                    var existingDto = MapToResponseDto(existingResponse);
                    return Ok(new ApiResponse<SurveyResponseDto> { Success = true, Data = existingDto });
                }
            }

            // Create new response
            var response = new SurveyResponse
            {
                SurveyId = id,
                UserId = userId,
                IsAnonymous = dto?.IsAnonymous ?? false,
                SessionId = sessionId,
                IpAddress = GetClientIpAddress(),
                Status = "InProgress",
                CurrentQuestionIndex = 0,
                StartedAt = DateTime.UtcNow
            };

            _context.SurveyResponses.Add(response);
            await _context.SaveChangesAsync();

            var result = MapToResponseDto(response);
            return Ok(new ApiResponse<SurveyResponseDto> { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting survey {SurveyId}", id);
            return StatusCode(500, new ApiResponse<SurveyResponseDto> { Success = false, Message = "Error starting survey" });
        }
    }

    // POST: api/surveys/{id}/answer - Submit an answer
    [HttpPost("{id}/answer")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<SurveyResponseDto>>> SubmitAnswer(int id, [FromBody] SubmitAnswerDto dto)
    {
        try
        {
            var userId = GetUserId();
            var sessionId = GetOrCreateSessionId();

            // Find the response
            var response = await _context.SurveyResponses
                .Include(r => r.Answers)
                .Include(r => r.Survey)
                    .ThenInclude(s => s.Questions.OrderBy(q => q.DisplayOrder))
                .FirstOrDefaultAsync(r => r.SurveyId == id &&
                    (r.UserId == userId || (r.SessionId == sessionId && r.UserId == null)));

            if (response == null)
            {
                return NotFound(new ApiResponse<SurveyResponseDto> { Success = false, Message = "Survey response not found. Please start the survey first." });
            }

            if (response.Status == "Completed" && !response.Survey.AllowEditResponse)
            {
                return BadRequest(new ApiResponse<SurveyResponseDto> { Success = false, Message = "Survey already completed" });
            }

            // Validate question exists
            var question = response.Survey.Questions.FirstOrDefault(q => q.QuestionId == dto.QuestionId);
            if (question == null)
            {
                return BadRequest(new ApiResponse<SurveyResponseDto> { Success = false, Message = "Question not found" });
            }

            // Find or create answer
            var answer = response.Answers.FirstOrDefault(a => a.QuestionId == dto.QuestionId);
            if (answer == null)
            {
                answer = new SurveyAnswer
                {
                    ResponseId = response.ResponseId,
                    QuestionId = dto.QuestionId
                };
                _context.SurveyAnswers.Add(answer);
            }

            // Update answer based on question type
            answer.SelectedOption = dto.SelectedOption;
            answer.SelectedOptions = dto.SelectedOptions != null ? JsonSerializer.Serialize(dto.SelectedOptions) : null;
            answer.RatingValue = dto.RatingValue;
            answer.TextValue = dto.TextValue;
            answer.NumberValue = dto.NumberValue;
            answer.DateValue = dto.DateValue;
            answer.AnsweredAt = DateTime.UtcNow;

            // Update progress
            var questionIndex = response.Survey.Questions.ToList().FindIndex(q => q.QuestionId == dto.QuestionId);
            if (questionIndex >= response.CurrentQuestionIndex)
            {
                response.CurrentQuestionIndex = questionIndex + 1;
            }
            response.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Reload to get updated data
            await _context.Entry(response).ReloadAsync();
            response.Answers = await _context.SurveyAnswers
                .Where(a => a.ResponseId == response.ResponseId)
                .ToListAsync();

            var result = MapToResponseDto(response);
            return Ok(new ApiResponse<SurveyResponseDto> { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting answer for survey {SurveyId}", id);
            return StatusCode(500, new ApiResponse<SurveyResponseDto> { Success = false, Message = "Error submitting answer" });
        }
    }

    // POST: api/surveys/{id}/complete - Complete the survey
    [HttpPost("{id}/complete")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<SurveyResponseDto>>> CompleteSurvey(int id)
    {
        try
        {
            var userId = GetUserId();
            var sessionId = GetOrCreateSessionId();

            var response = await _context.SurveyResponses
                .Include(r => r.Answers)
                .Include(r => r.Survey)
                    .ThenInclude(s => s.Questions)
                .FirstOrDefaultAsync(r => r.SurveyId == id &&
                    (r.UserId == userId || (r.SessionId == sessionId && r.UserId == null)));

            if (response == null)
            {
                return NotFound(new ApiResponse<SurveyResponseDto> { Success = false, Message = "Survey response not found" });
            }

            if (response.Status == "Completed")
            {
                var existingDto = MapToResponseDto(response);
                return Ok(new ApiResponse<SurveyResponseDto> { Success = true, Data = existingDto });
            }

            // Check required questions
            if (response.Survey.RequireAllQuestions)
            {
                var requiredQuestions = response.Survey.Questions.Where(q => q.IsRequired).ToList();
                var answeredQuestionIds = response.Answers.Select(a => a.QuestionId).ToHashSet();
                var unansweredRequired = requiredQuestions.Where(q => !answeredQuestionIds.Contains(q.QuestionId)).ToList();

                if (unansweredRequired.Any())
                {
                    return BadRequest(new ApiResponse<SurveyResponseDto>
                    {
                        Success = false,
                        Message = $"Please answer all required questions. Missing: {string.Join(", ", unansweredRequired.Select(q => q.QuestionText.Substring(0, Math.Min(50, q.QuestionText.Length))))}"
                    });
                }
            }

            response.Status = "Completed";
            response.CompletedAt = DateTime.UtcNow;
            response.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var result = MapToResponseDto(response);
            return Ok(new ApiResponse<SurveyResponseDto> { Success = true, Data = result, Message = response.Survey.ThankYouMessage ?? "Thank you for completing the survey!" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing survey {SurveyId}", id);
            return StatusCode(500, new ApiResponse<SurveyResponseDto> { Success = false, Message = "Error completing survey" });
        }
    }

    // GET: api/surveys/{id}/my-response - Get current user's response
    [HttpGet("{id}/my-response")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<SurveyResponseDto>>> GetMyResponse(int id)
    {
        try
        {
            var userId = GetUserId();
            var sessionId = GetOrCreateSessionId();

            var response = await _context.SurveyResponses
                .Include(r => r.Answers)
                .FirstOrDefaultAsync(r => r.SurveyId == id &&
                    (r.UserId == userId || (r.SessionId == sessionId && r.UserId == null)));

            if (response == null)
            {
                return Ok(new ApiResponse<SurveyResponseDto> { Success = true, Data = null });
            }

            var result = MapToResponseDto(response);
            return Ok(new ApiResponse<SurveyResponseDto> { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting response for survey {SurveyId}", id);
            return StatusCode(500, new ApiResponse<SurveyResponseDto> { Success = false, Message = "Error getting response" });
        }
    }

    // Admin endpoints

    // GET: api/surveys/admin/all - Get all surveys (admin)
    [HttpGet("admin/all")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<SurveyAdminDto>>>> GetAllSurveysAdmin()
    {
        try
        {
            if (!await HasAreaPermissionAsync("surveys"))
                return ForbiddenResponse<List<SurveyAdminDto>>();

            var surveys = await _context.Surveys
                .Include(s => s.Questions)
                .Include(s => s.Responses)
                .Include(s => s.CreatedByUser)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            var result = surveys.Select(s => new SurveyAdminDto
            {
                SurveyId = s.SurveyId,
                Title = s.Title,
                Description = s.Description,
                Visibility = s.Visibility,
                AllowAnonymous = s.AllowAnonymous,
                ShowResultsToRespondents = s.ShowResultsToRespondents,
                AllowEditResponse = s.AllowEditResponse,
                RequireAllQuestions = s.RequireAllQuestions,
                ShowProgressBar = s.ShowProgressBar,
                RandomizeQuestions = s.RandomizeQuestions,
                OneResponsePerUser = s.OneResponsePerUser,
                Status = s.Status,
                IsFeatured = s.IsFeatured,
                StartDate = s.StartDate,
                EndDate = s.EndDate,
                ThankYouMessage = s.ThankYouMessage,
                RedirectUrl = s.RedirectUrl,
                QuestionCount = s.Questions.Count,
                ResponseCount = s.Responses.Count,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt,
                CreatedByName = s.CreatedByUser != null ? $"{s.CreatedByUser.FirstName} {s.CreatedByUser.LastName}" : null
            }).ToList();

            return Ok(new ApiResponse<List<SurveyAdminDto>> { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all surveys");
            return StatusCode(500, new ApiResponse<List<SurveyAdminDto>> { Success = false, Message = "Error getting surveys" });
        }
    }

    /// GET: api/surveys/{id}/results - Get survey results (admin)
    [HttpGet("{id}/results")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<SurveyResultsDto>>> GetSurveyResults(int id)
    {
        try
        {
            if (!await HasAreaPermissionAsync("surveys"))
                return ForbiddenResponse<SurveyResultsDto>();

            var survey = await _context.Surveys
                .Include(s => s.Questions.OrderBy(q => q.DisplayOrder))
                .Include(s => s.Responses)
                    .ThenInclude(r => r.Answers)
                .FirstOrDefaultAsync(s => s.SurveyId == id);

            if (survey == null)
            {
                return NotFound(new ApiResponse<SurveyResultsDto> { Success = false, Message = "Survey not found" });
            }

            var completedResponses = survey.Responses.Where(r => r.Status == "Completed").ToList();
            var allAnswers = completedResponses.SelectMany(r => r.Answers).ToList();

            var questionResults = new List<QuestionResultDto>();
            foreach (var question in survey.Questions)
            {
                var questionAnswers = allAnswers.Where(a => a.QuestionId == question.QuestionId).ToList();
                var questionResult = new QuestionResultDto
                {
                    QuestionId = question.QuestionId,
                    QuestionText = question.QuestionText,
                    QuestionType = question.QuestionType,
                    ResponseCount = questionAnswers.Count
                };

                switch (question.QuestionType)
                {
                    case "SingleChoice":
                        var options = !string.IsNullOrEmpty(question.Options)
                            ? JsonSerializer.Deserialize<List<string>>(question.Options) ?? new List<string>()
                            : new List<string>();
                        questionResult.OptionResults = options.Select(opt => new OptionResultDto
                        {
                            Option = opt,
                            Count = questionAnswers.Count(a => a.SelectedOption == opt),
                            Percentage = questionAnswers.Count > 0
                                ? Math.Round(questionAnswers.Count(a => a.SelectedOption == opt) * 100.0 / questionAnswers.Count, 1)
                                : 0
                        }).ToList();
                        break;

                    case "MultipleChoice":
                        var multiOptions = !string.IsNullOrEmpty(question.Options)
                            ? JsonSerializer.Deserialize<List<string>>(question.Options) ?? new List<string>()
                            : new List<string>();
                        var allSelectedOptions = questionAnswers
                            .Where(a => !string.IsNullOrEmpty(a.SelectedOptions))
                            .SelectMany(a => JsonSerializer.Deserialize<List<string>>(a.SelectedOptions!) ?? new List<string>())
                            .ToList();
                        questionResult.OptionResults = multiOptions.Select(opt => new OptionResultDto
                        {
                            Option = opt,
                            Count = allSelectedOptions.Count(s => s == opt),
                            Percentage = questionAnswers.Count > 0
                                ? Math.Round(allSelectedOptions.Count(s => s == opt) * 100.0 / questionAnswers.Count, 1)
                                : 0
                        }).ToList();
                        break;

                    case "Rating":
                        var ratings = questionAnswers.Where(a => a.RatingValue.HasValue).Select(a => a.RatingValue!.Value).ToList();
                        questionResult.AverageRating = ratings.Any() ? Math.Round(ratings.Average(), 2) : null;
                        // Distribution of ratings
                        var min = question.RatingMin ?? 1;
                        var max = question.RatingMax ?? 5;
                        questionResult.OptionResults = Enumerable.Range(min, max - min + 1).Select(r => new OptionResultDto
                        {
                            Option = r.ToString(),
                            Count = ratings.Count(rating => rating == r),
                            Percentage = ratings.Count > 0 ? Math.Round(ratings.Count(rating => rating == r) * 100.0 / ratings.Count, 1) : 0
                        }).ToList();
                        break;

                    case "Text":
                    case "TextArea":
                        questionResult.TextResponses = questionAnswers
                            .Where(a => !string.IsNullOrEmpty(a.TextValue))
                            .Select(a => a.TextValue!)
                            .ToList();
                        break;

                    case "Number":
                        var numbers = questionAnswers.Where(a => a.NumberValue.HasValue).Select(a => (double)a.NumberValue!.Value).ToList();
                        questionResult.AverageNumber = numbers.Any() ? Math.Round(numbers.Average(), 2) : null;
                        break;
                }

                questionResults.Add(questionResult);
            }

            var result = new SurveyResultsDto
            {
                SurveyId = survey.SurveyId,
                Title = survey.Title,
                TotalResponses = survey.Responses.Count,
                CompletedResponses = completedResponses.Count,
                QuestionResults = questionResults
            };

            return Ok(new ApiResponse<SurveyResultsDto> { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting results for survey {SurveyId}", id);
            return StatusCode(500, new ApiResponse<SurveyResultsDto> { Success = false, Message = "Error getting results" });
        }
    }

    /// POST: api/surveys - Create survey (admin)
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ApiResponse<SurveyAdminDto>>> CreateSurvey([FromBody] CreateSurveyDto dto)
    {
        try
        {
            if (!await HasAreaPermissionAsync("surveys", requireEdit: true))
                return ForbiddenResponse<SurveyAdminDto>();

            var userId = GetUserId();

            var survey = new Survey
            {
                Title = dto.Title,
                Description = dto.Description,
                Visibility = dto.Visibility,
                AllowAnonymous = dto.AllowAnonymous,
                ShowResultsToRespondents = dto.ShowResultsToRespondents,
                AllowEditResponse = dto.AllowEditResponse,
                RequireAllQuestions = dto.RequireAllQuestions,
                ShowProgressBar = dto.ShowProgressBar,
                RandomizeQuestions = dto.RandomizeQuestions,
                OneResponsePerUser = dto.OneResponsePerUser,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Status = dto.Status,
                IsFeatured = dto.IsFeatured,
                ThankYouMessage = dto.ThankYouMessage,
                RedirectUrl = dto.RedirectUrl,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Surveys.Add(survey);
            await _context.SaveChangesAsync();

            // Add questions
            var questionIdMap = new Dictionary<int, int>(); // Map from index to actual QuestionId
            for (int i = 0; i < dto.Questions.Count; i++)
            {
                var q = dto.Questions[i];
                var question = new SurveyQuestion
                {
                    SurveyId = survey.SurveyId,
                    QuestionText = q.QuestionText,
                    HelpText = q.HelpText,
                    QuestionType = q.QuestionType,
                    IsRequired = q.IsRequired,
                    Options = q.Options != null ? JsonSerializer.Serialize(q.Options) : null,
                    MaxSelections = q.MaxSelections,
                    RatingMin = q.RatingMin,
                    RatingMax = q.RatingMax,
                    RatingMinLabel = q.RatingMinLabel,
                    RatingMaxLabel = q.RatingMaxLabel,
                    MinLength = q.MinLength,
                    MaxLength = q.MaxLength,
                    MinValue = q.MinValue,
                    MaxValue = q.MaxValue,
                    Placeholder = q.Placeholder,
                    DisplayOrder = q.DisplayOrder > 0 ? q.DisplayOrder : i,
                    ConditionalOnValues = q.ConditionalOnValues != null ? JsonSerializer.Serialize(q.ConditionalOnValues) : null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.SurveyQuestions.Add(question);
                await _context.SaveChangesAsync();
                questionIdMap[i] = question.QuestionId;

                // Handle conditional question reference
                if (q.ConditionalOnQuestionIndex.HasValue && questionIdMap.ContainsKey(q.ConditionalOnQuestionIndex.Value))
                {
                    question.ConditionalOnQuestionId = questionIdMap[q.ConditionalOnQuestionIndex.Value];
                    await _context.SaveChangesAsync();
                }
            }

            // Reload survey with questions
            var createdSurvey = await _context.Surveys
                .Include(s => s.Questions)
                .Include(s => s.CreatedByUser)
                .FirstAsync(s => s.SurveyId == survey.SurveyId);

            var result = new SurveyAdminDto
            {
                SurveyId = createdSurvey.SurveyId,
                Title = createdSurvey.Title,
                Description = createdSurvey.Description,
                Visibility = createdSurvey.Visibility,
                AllowAnonymous = createdSurvey.AllowAnonymous,
                ShowResultsToRespondents = createdSurvey.ShowResultsToRespondents,
                AllowEditResponse = createdSurvey.AllowEditResponse,
                RequireAllQuestions = createdSurvey.RequireAllQuestions,
                ShowProgressBar = createdSurvey.ShowProgressBar,
                RandomizeQuestions = createdSurvey.RandomizeQuestions,
                OneResponsePerUser = createdSurvey.OneResponsePerUser,
                Status = createdSurvey.Status,
                IsFeatured = createdSurvey.IsFeatured,
                StartDate = createdSurvey.StartDate,
                EndDate = createdSurvey.EndDate,
                ThankYouMessage = createdSurvey.ThankYouMessage,
                RedirectUrl = createdSurvey.RedirectUrl,
                QuestionCount = createdSurvey.Questions.Count,
                ResponseCount = 0,
                CreatedAt = createdSurvey.CreatedAt,
                UpdatedAt = createdSurvey.UpdatedAt,
                CreatedByName = createdSurvey.CreatedByUser != null ? $"{createdSurvey.CreatedByUser.FirstName} {createdSurvey.CreatedByUser.LastName}" : null
            };

            return Ok(new ApiResponse<SurveyAdminDto> { Success = true, Data = result, Message = "Survey created successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating survey");
            return StatusCode(500, new ApiResponse<SurveyAdminDto> { Success = false, Message = "Error creating survey" });
        }
    }

    /// PUT: api/surveys/{id} - Update survey (admin)
    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<SurveyAdminDto>>> UpdateSurvey(int id, [FromBody] CreateSurveyDto dto)
    {
        try
        {
            if (!await HasAreaPermissionAsync("surveys", requireEdit: true))
                return ForbiddenResponse<SurveyAdminDto>();

            var survey = await _context.Surveys
                .Include(s => s.Questions)
                .FirstOrDefaultAsync(s => s.SurveyId == id);

            if (survey == null)
            {
                return NotFound(new ApiResponse<SurveyAdminDto> { Success = false, Message = "Survey not found" });
            }

            // Update survey properties
            survey.Title = dto.Title;
            survey.Description = dto.Description;
            survey.Visibility = dto.Visibility;
            survey.AllowAnonymous = dto.AllowAnonymous;
            survey.ShowResultsToRespondents = dto.ShowResultsToRespondents;
            survey.AllowEditResponse = dto.AllowEditResponse;
            survey.RequireAllQuestions = dto.RequireAllQuestions;
            survey.ShowProgressBar = dto.ShowProgressBar;
            survey.RandomizeQuestions = dto.RandomizeQuestions;
            survey.OneResponsePerUser = dto.OneResponsePerUser;
            survey.StartDate = dto.StartDate;
            survey.EndDate = dto.EndDate;
            survey.Status = dto.Status;
            survey.IsFeatured = dto.IsFeatured;
            survey.ThankYouMessage = dto.ThankYouMessage;
            survey.RedirectUrl = dto.RedirectUrl;
            survey.UpdatedAt = DateTime.UtcNow;

            // Remove old questions and add new ones
            _context.SurveyQuestions.RemoveRange(survey.Questions);

            var questionIdMap = new Dictionary<int, int>();
            for (int i = 0; i < dto.Questions.Count; i++)
            {
                var q = dto.Questions[i];
                var question = new SurveyQuestion
                {
                    SurveyId = survey.SurveyId,
                    QuestionText = q.QuestionText,
                    HelpText = q.HelpText,
                    QuestionType = q.QuestionType,
                    IsRequired = q.IsRequired,
                    Options = q.Options != null ? JsonSerializer.Serialize(q.Options) : null,
                    MaxSelections = q.MaxSelections,
                    RatingMin = q.RatingMin,
                    RatingMax = q.RatingMax,
                    RatingMinLabel = q.RatingMinLabel,
                    RatingMaxLabel = q.RatingMaxLabel,
                    MinLength = q.MinLength,
                    MaxLength = q.MaxLength,
                    MinValue = q.MinValue,
                    MaxValue = q.MaxValue,
                    Placeholder = q.Placeholder,
                    DisplayOrder = q.DisplayOrder > 0 ? q.DisplayOrder : i,
                    ConditionalOnValues = q.ConditionalOnValues != null ? JsonSerializer.Serialize(q.ConditionalOnValues) : null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.SurveyQuestions.Add(question);
                await _context.SaveChangesAsync();
                questionIdMap[i] = question.QuestionId;

                if (q.ConditionalOnQuestionIndex.HasValue && questionIdMap.ContainsKey(q.ConditionalOnQuestionIndex.Value))
                {
                    question.ConditionalOnQuestionId = questionIdMap[q.ConditionalOnQuestionIndex.Value];
                }
            }

            await _context.SaveChangesAsync();

            // Reload
            var updatedSurvey = await _context.Surveys
                .Include(s => s.Questions)
                .Include(s => s.Responses)
                .Include(s => s.CreatedByUser)
                .FirstAsync(s => s.SurveyId == id);

            var result = new SurveyAdminDto
            {
                SurveyId = updatedSurvey.SurveyId,
                Title = updatedSurvey.Title,
                Description = updatedSurvey.Description,
                Visibility = updatedSurvey.Visibility,
                AllowAnonymous = updatedSurvey.AllowAnonymous,
                ShowResultsToRespondents = updatedSurvey.ShowResultsToRespondents,
                AllowEditResponse = updatedSurvey.AllowEditResponse,
                RequireAllQuestions = updatedSurvey.RequireAllQuestions,
                ShowProgressBar = updatedSurvey.ShowProgressBar,
                RandomizeQuestions = updatedSurvey.RandomizeQuestions,
                OneResponsePerUser = updatedSurvey.OneResponsePerUser,
                Status = updatedSurvey.Status,
                IsFeatured = updatedSurvey.IsFeatured,
                StartDate = updatedSurvey.StartDate,
                EndDate = updatedSurvey.EndDate,
                ThankYouMessage = updatedSurvey.ThankYouMessage,
                RedirectUrl = updatedSurvey.RedirectUrl,
                QuestionCount = updatedSurvey.Questions.Count,
                ResponseCount = updatedSurvey.Responses.Count,
                CreatedAt = updatedSurvey.CreatedAt,
                UpdatedAt = updatedSurvey.UpdatedAt,
                CreatedByName = updatedSurvey.CreatedByUser != null ? $"{updatedSurvey.CreatedByUser.FirstName} {updatedSurvey.CreatedByUser.LastName}" : null
            };

            return Ok(new ApiResponse<SurveyAdminDto> { Success = true, Data = result, Message = "Survey updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating survey {SurveyId}", id);
            return StatusCode(500, new ApiResponse<SurveyAdminDto> { Success = false, Message = "Error updating survey" });
        }
    }

    /// DELETE: api/surveys/{id} - Delete survey (admin)
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSurvey(int id)
    {
        try
        {
            if (!await HasAreaPermissionAsync("surveys", requireDelete: true))
                return ForbiddenResponse<bool>();

            var survey = await _context.Surveys.FindAsync(id);
            if (survey == null)
            {
                return NotFound(new ApiResponse<bool> { Success = false, Message = "Survey not found" });
            }

            _context.Surveys.Remove(survey);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool> { Success = true, Data = true, Message = "Survey deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting survey {SurveyId}", id);
            return StatusCode(500, new ApiResponse<bool> { Success = false, Message = "Error deleting survey" });
        }
    }

    // Mapping helpers
    private SurveyDto MapToSurveyDto(Survey survey)
    {
        return new SurveyDto
        {
            SurveyId = survey.SurveyId,
            Title = survey.Title,
            Description = survey.Description,
            Visibility = survey.Visibility,
            AllowAnonymous = survey.AllowAnonymous,
            ShowResultsToRespondents = survey.ShowResultsToRespondents,
            ShowProgressBar = survey.ShowProgressBar,
            RequireAllQuestions = survey.RequireAllQuestions,
            Status = survey.Status,
            IsFeatured = survey.IsFeatured,
            StartDate = survey.StartDate,
            EndDate = survey.EndDate,
            ThankYouMessage = survey.ThankYouMessage,
            QuestionCount = survey.Questions.Count,
            Questions = survey.Questions.OrderBy(q => q.DisplayOrder).Select(q => new SurveyQuestionDto
            {
                QuestionId = q.QuestionId,
                QuestionText = q.QuestionText,
                HelpText = q.HelpText,
                QuestionType = q.QuestionType,
                IsRequired = q.IsRequired,
                Options = !string.IsNullOrEmpty(q.Options) ? JsonSerializer.Deserialize<List<string>>(q.Options) : null,
                MaxSelections = q.MaxSelections,
                RatingMin = q.RatingMin,
                RatingMax = q.RatingMax,
                RatingMinLabel = q.RatingMinLabel,
                RatingMaxLabel = q.RatingMaxLabel,
                MinLength = q.MinLength,
                MaxLength = q.MaxLength,
                MinValue = q.MinValue,
                MaxValue = q.MaxValue,
                Placeholder = q.Placeholder,
                DisplayOrder = q.DisplayOrder,
                ConditionalOnQuestionId = q.ConditionalOnQuestionId,
                ConditionalOnValues = !string.IsNullOrEmpty(q.ConditionalOnValues) ? JsonSerializer.Deserialize<List<string>>(q.ConditionalOnValues) : null
            }).ToList()
        };
    }

    private SurveyResponseDto MapToResponseDto(SurveyResponse response)
    {
        return new SurveyResponseDto
        {
            ResponseId = response.ResponseId,
            SurveyId = response.SurveyId,
            Status = response.Status,
            CurrentQuestionIndex = response.CurrentQuestionIndex,
            StartedAt = response.StartedAt,
            CompletedAt = response.CompletedAt,
            Answers = response.Answers.Select(a => new SurveyAnswerDto
            {
                QuestionId = a.QuestionId,
                SelectedOption = a.SelectedOption,
                SelectedOptions = !string.IsNullOrEmpty(a.SelectedOptions) ? JsonSerializer.Deserialize<List<string>>(a.SelectedOptions) : null,
                RatingValue = a.RatingValue,
                TextValue = a.TextValue,
                NumberValue = a.NumberValue,
                DateValue = a.DateValue
            }).ToList()
        };
    }
}
