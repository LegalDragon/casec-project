using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using CasecApi.Data;
using CasecApi.Models;
using CasecApi.Models.DTOs;
using CasecApi.Services;

namespace CasecApi.Controllers;

[ApiController]
[Route("[controller]")]
public class SlideShowsController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<SlideShowsController> _logger;
    private readonly IAssetService _assetService;

    public SlideShowsController(CasecDbContext context, ILogger<SlideShowsController> logger, IAssetService assetService)
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

    // ============ PUBLIC ENDPOINTS ============

    // GET: /slideshows/code/{code}
    // Get a slideshow by code (for frontend to load)
    [HttpGet("code/{code}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<SlideShowDto>>> GetSlideShowByCode(string code)
    {
        try
        {
            var slideShow = await _context.SlideShows
                .Include(s => s.Slides.OrderBy(sl => sl.DisplayOrder))
                    .ThenInclude(sl => sl.Images.OrderBy(i => i.DisplayOrder))
                .Include(s => s.Slides)
                    .ThenInclude(sl => sl.Texts.OrderBy(t => t.DisplayOrder))
                .Include(s => s.Slides)
                    .ThenInclude(sl => sl.Objects.OrderBy(o => o.SortOrder))
                .Include(s => s.Slides)
                    .ThenInclude(sl => sl.BackgroundVideos.OrderBy(bv => bv.SortOrder))
                        .ThenInclude(bv => bv.Video)
                .Include(s => s.CreatedByUser)
                .FirstOrDefaultAsync(s => s.Code == code && s.IsActive);

            if (slideShow == null)
            {
                return NotFound(new ApiResponse<SlideShowDto>
                {
                    Success = false,
                    Message = "Slideshow not found"
                });
            }

            return Ok(new ApiResponse<SlideShowDto>
            {
                Success = true,
                Data = MapToSlideShowDto(slideShow)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching slideshow by code {Code}", code);
            return StatusCode(500, new ApiResponse<SlideShowDto>
            {
                Success = false,
                Message = "An error occurred while fetching slideshow"
            });
        }
    }

    // GET: /slideshows/{id}
    // Get a slideshow by ID (for frontend to load)
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<SlideShowDto>>> GetSlideShowById(int id)
    {
        try
        {
            var slideShow = await _context.SlideShows
                .Include(s => s.Slides.OrderBy(sl => sl.DisplayOrder))
                    .ThenInclude(sl => sl.Images.OrderBy(i => i.DisplayOrder))
                .Include(s => s.Slides)
                    .ThenInclude(sl => sl.Texts.OrderBy(t => t.DisplayOrder))
                .Include(s => s.Slides)
                    .ThenInclude(sl => sl.Objects.OrderBy(o => o.SortOrder))
                .Include(s => s.Slides)
                    .ThenInclude(sl => sl.BackgroundVideos.OrderBy(bv => bv.SortOrder))
                        .ThenInclude(bv => bv.Video)
                .Include(s => s.CreatedByUser)
                .FirstOrDefaultAsync(s => s.SlideShowId == id && s.IsActive);

            if (slideShow == null)
            {
                return NotFound(new ApiResponse<SlideShowDto>
                {
                    Success = false,
                    Message = "Slideshow not found"
                });
            }

            return Ok(new ApiResponse<SlideShowDto>
            {
                Success = true,
                Data = MapToSlideShowDto(slideShow)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching slideshow by id {Id}", id);
            return StatusCode(500, new ApiResponse<SlideShowDto>
            {
                Success = false,
                Message = "An error occurred while fetching slideshow"
            });
        }
    }

    // GET: /slideshows/videos
    // Get all active shared videos (for random selection in frontend)
    [HttpGet("videos")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<SharedVideoDto>>>> GetSharedVideos([FromQuery] string? category = null)
    {
        try
        {
            var query = _context.SharedVideos
                .Where(v => v.IsActive)
                .OrderBy(v => v.DisplayOrder)
                .AsQueryable();

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(v => v.Category == category);
            }

            var videos = await query
                .Select(v => new SharedVideoDto
                {
                    VideoId = v.VideoId,
                    Url = v.Url,
                    Title = v.Title,
                    ThumbnailUrl = v.ThumbnailUrl,
                    Category = v.Category,
                    IsActive = v.IsActive,
                    DisplayOrder = v.DisplayOrder
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<SharedVideoDto>>
            {
                Success = true,
                Data = videos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching shared videos");
            return StatusCode(500, new ApiResponse<List<SharedVideoDto>>
            {
                Success = false,
                Message = "An error occurred while fetching videos"
            });
        }
    }

    // GET: /slideshows/images
    // Get all active shared images (for selection in frontend)
    [HttpGet("images")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<SharedImageDto>>>> GetSharedImages([FromQuery] string? category = null)
    {
        try
        {
            var query = _context.SharedImages
                .Where(i => i.IsActive)
                .OrderBy(i => i.DisplayOrder)
                .AsQueryable();

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(i => i.Category == category);
            }

            var images = await query
                .Select(i => new SharedImageDto
                {
                    ImageId = i.ImageId,
                    Url = i.Url,
                    Title = i.Title,
                    ThumbnailUrl = i.ThumbnailUrl,
                    Category = i.Category,
                    IsActive = i.IsActive,
                    DisplayOrder = i.DisplayOrder
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<SharedImageDto>>
            {
                Success = true,
                Data = images
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching shared images");
            return StatusCode(500, new ApiResponse<List<SharedImageDto>>
            {
                Success = false,
                Message = "An error occurred while fetching images"
            });
        }
    }

    // ============ ADMIN SLIDESHOW ENDPOINTS ============

    // GET: /slideshows/admin/all
    // Get all slideshows (admin)
    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<SlideShowSummaryDto>>>> GetAllSlideShows()
    {
        try
        {
            var slideShows = await _context.SlideShows
                .Include(s => s.Slides)
                .OrderBy(s => s.Name)
                .Select(s => new SlideShowSummaryDto
                {
                    SlideShowId = s.SlideShowId,
                    Code = s.Code,
                    Name = s.Name,
                    Description = s.Description,
                    IsActive = s.IsActive,
                    SlideCount = s.Slides.Count,
                    UpdatedAt = s.UpdatedAt
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<SlideShowSummaryDto>>
            {
                Success = true,
                Data = slideShows
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all slideshows");
            return StatusCode(500, new ApiResponse<List<SlideShowSummaryDto>>
            {
                Success = false,
                Message = "An error occurred while fetching slideshows"
            });
        }
    }

    // GET: /slideshows/admin/{id}
    // Get slideshow details (admin)
    [HttpGet("admin/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SlideShowDto>>> GetSlideShowAdmin(int id)
    {
        try
        {
            var slideShow = await _context.SlideShows
                .Include(s => s.Slides.OrderBy(sl => sl.DisplayOrder))
                    .ThenInclude(sl => sl.Images.OrderBy(i => i.DisplayOrder))
                .Include(s => s.Slides)
                    .ThenInclude(sl => sl.Texts.OrderBy(t => t.DisplayOrder))
                .Include(s => s.Slides)
                    .ThenInclude(sl => sl.Objects.OrderBy(o => o.SortOrder))
                .Include(s => s.Slides)
                    .ThenInclude(sl => sl.BackgroundVideos.OrderBy(bv => bv.SortOrder))
                        .ThenInclude(bv => bv.Video)
                .Include(s => s.CreatedByUser)
                .FirstOrDefaultAsync(s => s.SlideShowId == id);

            if (slideShow == null)
            {
                return NotFound(new ApiResponse<SlideShowDto>
                {
                    Success = false,
                    Message = "Slideshow not found"
                });
            }

            return Ok(new ApiResponse<SlideShowDto>
            {
                Success = true,
                Data = MapToSlideShowDto(slideShow)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching slideshow {Id}", id);
            return StatusCode(500, new ApiResponse<SlideShowDto>
            {
                Success = false,
                Message = "An error occurred while fetching slideshow"
            });
        }
    }

    // POST: /slideshows/admin
    // Create a new slideshow
    [HttpPost("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SlideShowDto>>> CreateSlideShow([FromBody] CreateSlideShowRequest request)
    {
        try
        {
            // Check if code already exists
            if (await _context.SlideShows.AnyAsync(s => s.Code == request.Code))
            {
                return BadRequest(new ApiResponse<SlideShowDto>
                {
                    Success = false,
                    Message = "A slideshow with this code already exists"
                });
            }

            var slideShow = new SlideShow
            {
                Code = request.Code,
                Name = request.Name,
                Description = request.Description,
                IsActive = request.IsActive,
                TransitionType = request.TransitionType,
                TransitionDuration = request.TransitionDuration,
                ShowProgress = request.ShowProgress,
                AllowSkip = request.AllowSkip,
                Loop = request.Loop,
                AutoPlay = request.AutoPlay,
                CreatedBy = GetCurrentUserId()
            };

            _context.SlideShows.Add(slideShow);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SlideShowDto>
            {
                Success = true,
                Message = "Slideshow created successfully",
                Data = MapToSlideShowDto(slideShow)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating slideshow");
            return StatusCode(500, new ApiResponse<SlideShowDto>
            {
                Success = false,
                Message = "An error occurred while creating slideshow"
            });
        }
    }

    // PUT: /slideshows/admin/{id}
    // Update a slideshow
    [HttpPut("admin/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SlideShowDto>>> UpdateSlideShow(int id, [FromBody] UpdateSlideShowRequest request)
    {
        try
        {
            var slideShow = await _context.SlideShows.FindAsync(id);
            if (slideShow == null)
            {
                return NotFound(new ApiResponse<SlideShowDto>
                {
                    Success = false,
                    Message = "Slideshow not found"
                });
            }

            // Check if code already exists (if changed)
            if (request.Code != slideShow.Code && await _context.SlideShows.AnyAsync(s => s.Code == request.Code))
            {
                return BadRequest(new ApiResponse<SlideShowDto>
                {
                    Success = false,
                    Message = "A slideshow with this code already exists"
                });
            }

            slideShow.Code = request.Code;
            slideShow.Name = request.Name;
            slideShow.Description = request.Description;
            slideShow.IsActive = request.IsActive;
            slideShow.TransitionType = request.TransitionType;
            slideShow.TransitionDuration = request.TransitionDuration;
            slideShow.ShowProgress = request.ShowProgress;
            slideShow.AllowSkip = request.AllowSkip;
            slideShow.Loop = request.Loop;
            slideShow.AutoPlay = request.AutoPlay;
            slideShow.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SlideShowDto>
            {
                Success = true,
                Message = "Slideshow updated successfully",
                Data = MapToSlideShowDto(slideShow)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating slideshow {Id}", id);
            return StatusCode(500, new ApiResponse<SlideShowDto>
            {
                Success = false,
                Message = "An error occurred while updating slideshow"
            });
        }
    }

    // DELETE: /slideshows/admin/{id}
    // Delete a slideshow
    [HttpDelete("admin/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSlideShow(int id)
    {
        try
        {
            var slideShow = await _context.SlideShows.FindAsync(id);
            if (slideShow == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Slideshow not found"
                });
            }

            _context.SlideShows.Remove(slideShow);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Slideshow deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting slideshow {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting slideshow"
            });
        }
    }

    // ============ ADMIN SLIDE ENDPOINTS ============

    // POST: /slideshows/admin/slides
    // Create a new slide
    [HttpPost("admin/slides")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SlideDto>>> CreateSlide([FromBody] CreateSlideRequest request)
    {
        try
        {
            var slideShow = await _context.SlideShows.FindAsync(request.SlideShowId);
            if (slideShow == null)
            {
                return NotFound(new ApiResponse<SlideDto>
                {
                    Success = false,
                    Message = "Slideshow not found"
                });
            }

            var slide = new Slide
            {
                SlideShowId = request.SlideShowId,
                DisplayOrder = request.DisplayOrder,
                Duration = request.Duration,
                // NEW: Background settings
                BackgroundType = request.BackgroundType,
                BackgroundColor = request.BackgroundColor,
                BackgroundImageUrl = request.BackgroundImageUrl,
                UseRandomHeroVideos = request.UseRandomHeroVideos,
                // Legacy fields
                VideoUrl = request.VideoUrl,
                UseRandomVideo = request.UseRandomVideo,
                Layout = request.Layout,
                OverlayType = request.OverlayType,
                OverlayColor = request.OverlayColor,
                OverlayOpacity = request.OverlayOpacity
            };

            _context.Slides.Add(slide);
            slideShow.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SlideDto>
            {
                Success = true,
                Message = "Slide created successfully",
                Data = MapToSlideDto(slide)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating slide");
            return StatusCode(500, new ApiResponse<SlideDto>
            {
                Success = false,
                Message = "An error occurred while creating slide"
            });
        }
    }

    // PUT: /slideshows/admin/slides/{id}
    // Update a slide
    [HttpPut("admin/slides/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SlideDto>>> UpdateSlide(int id, [FromBody] UpdateSlideRequest request)
    {
        try
        {
            var slide = await _context.Slides
                .Include(s => s.SlideShow)
                .FirstOrDefaultAsync(s => s.SlideId == id);

            if (slide == null)
            {
                return NotFound(new ApiResponse<SlideDto>
                {
                    Success = false,
                    Message = "Slide not found"
                });
            }

            slide.DisplayOrder = request.DisplayOrder;
            slide.Duration = request.Duration;
            // NEW: Background settings
            slide.BackgroundType = request.BackgroundType;
            slide.BackgroundColor = request.BackgroundColor;
            slide.BackgroundImageUrl = request.BackgroundImageUrl;
            slide.UseRandomHeroVideos = request.UseRandomHeroVideos;
            // Legacy fields
            slide.VideoUrl = request.VideoUrl;
            slide.UseRandomVideo = request.UseRandomVideo;
            slide.Layout = request.Layout;
            slide.OverlayType = request.OverlayType;
            slide.OverlayColor = request.OverlayColor;
            slide.OverlayOpacity = request.OverlayOpacity;
            slide.UpdatedAt = DateTime.UtcNow;

            if (slide.SlideShow != null)
            {
                slide.SlideShow.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SlideDto>
            {
                Success = true,
                Message = "Slide updated successfully",
                Data = MapToSlideDto(slide)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating slide {Id}", id);
            return StatusCode(500, new ApiResponse<SlideDto>
            {
                Success = false,
                Message = "An error occurred while updating slide"
            });
        }
    }

    // DELETE: /slideshows/admin/slides/{id}
    // Delete a slide
    [HttpDelete("admin/slides/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSlide(int id)
    {
        try
        {
            var slide = await _context.Slides
                .Include(s => s.SlideShow)
                .FirstOrDefaultAsync(s => s.SlideId == id);

            if (slide == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Slide not found"
                });
            }

            if (slide.SlideShow != null)
            {
                slide.SlideShow.UpdatedAt = DateTime.UtcNow;
            }

            _context.Slides.Remove(slide);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Slide deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting slide {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting slide"
            });
        }
    }

    // PUT: /slideshows/admin/slides/reorder
    // Reorder slides within a slideshow
    [HttpPut("admin/slides/reorder")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> ReorderSlides([FromBody] List<int> slideIds)
    {
        try
        {
            for (int i = 0; i < slideIds.Count; i++)
            {
                var slide = await _context.Slides.FindAsync(slideIds[i]);
                if (slide != null)
                {
                    slide.DisplayOrder = i;
                    slide.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Slides reordered successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering slides");
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while reordering slides"
            });
        }
    }

    // ============ ADMIN SLIDE IMAGE ENDPOINTS ============

    // POST: /slideshows/admin/slide-images
    // Add an image to a slide
    [HttpPost("admin/slide-images")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SlideImageDto>>> CreateSlideImage([FromBody] CreateSlideImageRequest request)
    {
        try
        {
            var slide = await _context.Slides.FindAsync(request.SlideId);
            if (slide == null)
            {
                return NotFound(new ApiResponse<SlideImageDto>
                {
                    Success = false,
                    Message = "Slide not found"
                });
            }

            var slideImage = new SlideImage
            {
                SlideId = request.SlideId,
                ImageUrl = request.ImageUrl,
                DisplayOrder = request.DisplayOrder,
                Position = request.Position,
                Size = request.Size,
                Orientation = request.Orientation,
                Animation = request.Animation,
                Duration = request.Duration,
                Delay = request.Delay,
                BorderRadius = request.BorderRadius,
                Shadow = request.Shadow,
                Opacity = request.Opacity
            };

            _context.SlideImages.Add(slideImage);
            slide.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SlideImageDto>
            {
                Success = true,
                Message = "Image added to slide successfully",
                Data = MapToSlideImageDto(slideImage)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding image to slide");
            return StatusCode(500, new ApiResponse<SlideImageDto>
            {
                Success = false,
                Message = "An error occurred while adding image"
            });
        }
    }

    // PUT: /slideshows/admin/slide-images/{id}
    // Update a slide image
    [HttpPut("admin/slide-images/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SlideImageDto>>> UpdateSlideImage(int id, [FromBody] UpdateSlideImageRequest request)
    {
        try
        {
            var slideImage = await _context.SlideImages.FindAsync(id);
            if (slideImage == null)
            {
                return NotFound(new ApiResponse<SlideImageDto>
                {
                    Success = false,
                    Message = "Slide image not found"
                });
            }

            slideImage.ImageUrl = request.ImageUrl;
            slideImage.DisplayOrder = request.DisplayOrder;
            slideImage.Position = request.Position;
            slideImage.Size = request.Size;
            slideImage.Orientation = request.Orientation;
            slideImage.Animation = request.Animation;
            slideImage.Duration = request.Duration;
            slideImage.Delay = request.Delay;
            slideImage.BorderRadius = request.BorderRadius;
            slideImage.Shadow = request.Shadow;
            slideImage.Opacity = request.Opacity;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SlideImageDto>
            {
                Success = true,
                Message = "Slide image updated successfully",
                Data = MapToSlideImageDto(slideImage)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating slide image {Id}", id);
            return StatusCode(500, new ApiResponse<SlideImageDto>
            {
                Success = false,
                Message = "An error occurred while updating slide image"
            });
        }
    }

    // DELETE: /slideshows/admin/slide-images/{id}
    // Delete a slide image
    [HttpDelete("admin/slide-images/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSlideImage(int id)
    {
        try
        {
            var slideImage = await _context.SlideImages.FindAsync(id);
            if (slideImage == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Slide image not found"
                });
            }

            _context.SlideImages.Remove(slideImage);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Slide image deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting slide image {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting slide image"
            });
        }
    }

    // ============ ADMIN SLIDE TEXT ENDPOINTS ============

    // POST: /slideshows/admin/slide-texts
    // Add a text element to a slide
    [HttpPost("admin/slide-texts")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SlideTextDto>>> CreateSlideText([FromBody] CreateSlideTextRequest request)
    {
        try
        {
            var slide = await _context.Slides.FindAsync(request.SlideId);
            if (slide == null)
            {
                return NotFound(new ApiResponse<SlideTextDto>
                {
                    Success = false,
                    Message = "Slide not found"
                });
            }

            var slideText = new SlideText
            {
                SlideId = request.SlideId,
                Text = request.Text,
                DisplayOrder = request.DisplayOrder,
                HorizontalPosition = request.HorizontalPosition,
                VerticalPosition = request.VerticalPosition,
                Size = request.Size,
                Color = request.Color,
                FontFamily = request.FontFamily,
                Animation = request.Animation,
                Duration = request.Duration,
                Delay = request.Delay
            };

            _context.SlideTexts.Add(slideText);
            slide.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SlideTextDto>
            {
                Success = true,
                Message = "Text added to slide successfully",
                Data = MapToSlideTextDto(slideText)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding text to slide");
            return StatusCode(500, new ApiResponse<SlideTextDto>
            {
                Success = false,
                Message = "An error occurred while adding text"
            });
        }
    }

    // PUT: /slideshows/admin/slide-texts/{id}
    // Update a slide text
    [HttpPut("admin/slide-texts/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SlideTextDto>>> UpdateSlideText(int id, [FromBody] UpdateSlideTextRequest request)
    {
        try
        {
            var slideText = await _context.SlideTexts.FindAsync(id);
            if (slideText == null)
            {
                return NotFound(new ApiResponse<SlideTextDto>
                {
                    Success = false,
                    Message = "Slide text not found"
                });
            }

            slideText.Text = request.Text;
            slideText.DisplayOrder = request.DisplayOrder;
            slideText.HorizontalPosition = request.HorizontalPosition;
            slideText.VerticalPosition = request.VerticalPosition;
            slideText.Size = request.Size;
            slideText.Color = request.Color;
            slideText.FontFamily = request.FontFamily;
            slideText.Animation = request.Animation;
            slideText.Duration = request.Duration;
            slideText.Delay = request.Delay;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SlideTextDto>
            {
                Success = true,
                Message = "Slide text updated successfully",
                Data = MapToSlideTextDto(slideText)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating slide text {Id}", id);
            return StatusCode(500, new ApiResponse<SlideTextDto>
            {
                Success = false,
                Message = "An error occurred while updating slide text"
            });
        }
    }

    // DELETE: /slideshows/admin/slide-texts/{id}
    // Delete a slide text
    [HttpDelete("admin/slide-texts/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSlideText(int id)
    {
        try
        {
            var slideText = await _context.SlideTexts.FindAsync(id);
            if (slideText == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Slide text not found"
                });
            }

            _context.SlideTexts.Remove(slideText);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Slide text deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting slide text {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting slide text"
            });
        }
    }

    // ============ ADMIN SLIDE OBJECT ENDPOINTS (NEW OO System) ============

    // POST: /slideshows/admin/slide-objects
    // Add an object to a slide
    [HttpPost("admin/slide-objects")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SlideObjectDto>>> CreateSlideObject([FromBody] CreateSlideObjectRequest request)
    {
        try
        {
            var slide = await _context.Slides.FindAsync(request.SlideId);
            if (slide == null)
            {
                return NotFound(new ApiResponse<SlideObjectDto>
                {
                    Success = false,
                    Message = "Slide not found"
                });
            }

            var slideObject = new SlideObject
            {
                SlideId = request.SlideId,
                ObjectType = request.ObjectType,
                SortOrder = request.SortOrder,
                Name = request.Name,
                HorizontalAlign = request.HorizontalAlign,
                VerticalAlign = request.VerticalAlign,
                OffsetX = request.OffsetX,
                OffsetY = request.OffsetY,
                AnimationIn = request.AnimationIn,
                AnimationInDelay = request.AnimationInDelay,
                AnimationInDuration = request.AnimationInDuration,
                AnimationOut = request.AnimationOut,
                AnimationOutDelay = request.AnimationOutDelay,
                AnimationOutDuration = request.AnimationOutDuration,
                StayOnScreen = request.StayOnScreen,
                Properties = request.Properties
            };

            _context.SlideObjects.Add(slideObject);
            slide.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SlideObjectDto>
            {
                Success = true,
                Message = "Object added to slide successfully",
                Data = MapToSlideObjectDto(slideObject)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding object to slide");
            return StatusCode(500, new ApiResponse<SlideObjectDto>
            {
                Success = false,
                Message = "An error occurred while adding object"
            });
        }
    }

    // PUT: /slideshows/admin/slide-objects/{id}
    // Update a slide object
    [HttpPut("admin/slide-objects/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SlideObjectDto>>> UpdateSlideObject(int id, [FromBody] UpdateSlideObjectRequest request)
    {
        try
        {
            var slideObject = await _context.SlideObjects.FindAsync(id);
            if (slideObject == null)
            {
                return NotFound(new ApiResponse<SlideObjectDto>
                {
                    Success = false,
                    Message = "Slide object not found"
                });
            }

            slideObject.ObjectType = request.ObjectType;
            slideObject.SortOrder = request.SortOrder;
            slideObject.Name = request.Name;
            slideObject.HorizontalAlign = request.HorizontalAlign;
            slideObject.VerticalAlign = request.VerticalAlign;
            slideObject.OffsetX = request.OffsetX;
            slideObject.OffsetY = request.OffsetY;
            slideObject.AnimationIn = request.AnimationIn;
            slideObject.AnimationInDelay = request.AnimationInDelay;
            slideObject.AnimationInDuration = request.AnimationInDuration;
            slideObject.AnimationOut = request.AnimationOut;
            slideObject.AnimationOutDelay = request.AnimationOutDelay;
            slideObject.AnimationOutDuration = request.AnimationOutDuration;
            slideObject.StayOnScreen = request.StayOnScreen;
            slideObject.Properties = request.Properties;
            slideObject.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SlideObjectDto>
            {
                Success = true,
                Message = "Slide object updated successfully",
                Data = MapToSlideObjectDto(slideObject)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating slide object {Id}", id);
            return StatusCode(500, new ApiResponse<SlideObjectDto>
            {
                Success = false,
                Message = "An error occurred while updating slide object"
            });
        }
    }

    // DELETE: /slideshows/admin/slide-objects/{id}
    // Delete a slide object
    [HttpDelete("admin/slide-objects/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSlideObject(int id)
    {
        try
        {
            var slideObject = await _context.SlideObjects.FindAsync(id);
            if (slideObject == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Slide object not found"
                });
            }

            _context.SlideObjects.Remove(slideObject);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Slide object deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting slide object {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting slide object"
            });
        }
    }

    // PUT: /slideshows/admin/slide-objects/reorder
    // Reorder objects within a slide
    [HttpPut("admin/slide-objects/reorder")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> ReorderSlideObjects([FromBody] List<int> objectIds)
    {
        try
        {
            for (int i = 0; i < objectIds.Count; i++)
            {
                var obj = await _context.SlideObjects.FindAsync(objectIds[i]);
                if (obj != null)
                {
                    obj.SortOrder = i;
                    obj.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Objects reordered successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering slide objects");
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while reordering objects"
            });
        }
    }

    // ============ ADMIN SLIDE BACKGROUND VIDEO ENDPOINTS ============

    // POST: /slideshows/admin/slide-background-videos
    // Add a background video to a slide
    [HttpPost("admin/slide-background-videos")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SlideBackgroundVideoDto>>> CreateSlideBackgroundVideo([FromBody] CreateSlideBackgroundVideoRequest request)
    {
        try
        {
            var slide = await _context.Slides.FindAsync(request.SlideId);
            if (slide == null)
            {
                return NotFound(new ApiResponse<SlideBackgroundVideoDto>
                {
                    Success = false,
                    Message = "Slide not found"
                });
            }

            var bgVideo = new SlideBackgroundVideo
            {
                SlideId = request.SlideId,
                VideoId = request.VideoId,
                VideoUrl = request.VideoUrl,
                Duration = request.Duration,
                SortOrder = request.SortOrder,
                UseRandom = request.UseRandom
            };

            _context.SlideBackgroundVideos.Add(bgVideo);
            slide.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Reload with video info
            await _context.Entry(bgVideo).Reference(b => b.Video).LoadAsync();

            return Ok(new ApiResponse<SlideBackgroundVideoDto>
            {
                Success = true,
                Message = "Background video added successfully",
                Data = MapToSlideBackgroundVideoDto(bgVideo)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding background video to slide");
            return StatusCode(500, new ApiResponse<SlideBackgroundVideoDto>
            {
                Success = false,
                Message = "An error occurred while adding background video"
            });
        }
    }

    // PUT: /slideshows/admin/slide-background-videos/{id}
    // Update a slide background video
    [HttpPut("admin/slide-background-videos/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SlideBackgroundVideoDto>>> UpdateSlideBackgroundVideo(int id, [FromBody] UpdateSlideBackgroundVideoRequest request)
    {
        try
        {
            var bgVideo = await _context.SlideBackgroundVideos
                .Include(b => b.Video)
                .FirstOrDefaultAsync(b => b.SlideBackgroundVideoId == id);

            if (bgVideo == null)
            {
                return NotFound(new ApiResponse<SlideBackgroundVideoDto>
                {
                    Success = false,
                    Message = "Background video not found"
                });
            }

            bgVideo.VideoId = request.VideoId;
            bgVideo.VideoUrl = request.VideoUrl;
            bgVideo.Duration = request.Duration;
            bgVideo.SortOrder = request.SortOrder;
            bgVideo.UseRandom = request.UseRandom;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SlideBackgroundVideoDto>
            {
                Success = true,
                Message = "Background video updated successfully",
                Data = MapToSlideBackgroundVideoDto(bgVideo)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating background video {Id}", id);
            return StatusCode(500, new ApiResponse<SlideBackgroundVideoDto>
            {
                Success = false,
                Message = "An error occurred while updating background video"
            });
        }
    }

    // DELETE: /slideshows/admin/slide-background-videos/{id}
    // Delete a slide background video
    [HttpDelete("admin/slide-background-videos/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSlideBackgroundVideo(int id)
    {
        try
        {
            var bgVideo = await _context.SlideBackgroundVideos.FindAsync(id);
            if (bgVideo == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Background video not found"
                });
            }

            _context.SlideBackgroundVideos.Remove(bgVideo);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Background video deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting background video {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting background video"
            });
        }
    }

    // PUT: /slideshows/admin/slide-background-videos/reorder
    // Reorder background videos within a slide
    [HttpPut("admin/slide-background-videos/reorder")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> ReorderSlideBackgroundVideos([FromBody] List<int> videoIds)
    {
        try
        {
            for (int i = 0; i < videoIds.Count; i++)
            {
                var video = await _context.SlideBackgroundVideos.FindAsync(videoIds[i]);
                if (video != null)
                {
                    video.SortOrder = i;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Background videos reordered successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering background videos");
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while reordering background videos"
            });
        }
    }

    // ============ ADMIN SHARED VIDEO ENDPOINTS ============

    // GET: /slideshows/admin/videos
    // Get all shared videos (admin)
    [HttpGet("admin/videos")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<SharedVideoDto>>>> GetAllSharedVideos()
    {
        try
        {
            var videos = await _context.SharedVideos
                .OrderBy(v => v.DisplayOrder)
                .Select(v => new SharedVideoDto
                {
                    VideoId = v.VideoId,
                    Url = v.Url,
                    Title = v.Title,
                    ThumbnailUrl = v.ThumbnailUrl,
                    Category = v.Category,
                    IsActive = v.IsActive,
                    DisplayOrder = v.DisplayOrder
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<SharedVideoDto>>
            {
                Success = true,
                Data = videos
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all shared videos");
            return StatusCode(500, new ApiResponse<List<SharedVideoDto>>
            {
                Success = false,
                Message = "An error occurred while fetching videos"
            });
        }
    }

    // POST: /slideshows/admin/videos
    // Create a shared video
    [HttpPost("admin/videos")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SharedVideoDto>>> CreateSharedVideo([FromBody] CreateSharedVideoRequest request)
    {
        try
        {
            var video = new SharedVideo
            {
                Url = request.Url,
                Title = request.Title,
                ThumbnailUrl = request.ThumbnailUrl,
                Category = request.Category,
                IsActive = request.IsActive,
                DisplayOrder = request.DisplayOrder
            };

            _context.SharedVideos.Add(video);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SharedVideoDto>
            {
                Success = true,
                Message = "Video added successfully",
                Data = new SharedVideoDto
                {
                    VideoId = video.VideoId,
                    Url = video.Url,
                    Title = video.Title,
                    ThumbnailUrl = video.ThumbnailUrl,
                    Category = video.Category,
                    IsActive = video.IsActive,
                    DisplayOrder = video.DisplayOrder
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating shared video");
            return StatusCode(500, new ApiResponse<SharedVideoDto>
            {
                Success = false,
                Message = "An error occurred while creating video"
            });
        }
    }

    // PUT: /slideshows/admin/videos/{id}
    // Update a shared video
    [HttpPut("admin/videos/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SharedVideoDto>>> UpdateSharedVideo(int id, [FromBody] UpdateSharedVideoRequest request)
    {
        try
        {
            var video = await _context.SharedVideos.FindAsync(id);
            if (video == null)
            {
                return NotFound(new ApiResponse<SharedVideoDto>
                {
                    Success = false,
                    Message = "Video not found"
                });
            }

            video.Url = request.Url;
            video.Title = request.Title;
            video.ThumbnailUrl = request.ThumbnailUrl;
            video.Category = request.Category;
            video.IsActive = request.IsActive;
            video.DisplayOrder = request.DisplayOrder;
            video.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SharedVideoDto>
            {
                Success = true,
                Message = "Video updated successfully",
                Data = new SharedVideoDto
                {
                    VideoId = video.VideoId,
                    Url = video.Url,
                    Title = video.Title,
                    ThumbnailUrl = video.ThumbnailUrl,
                    Category = video.Category,
                    IsActive = video.IsActive,
                    DisplayOrder = video.DisplayOrder
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating shared video {Id}", id);
            return StatusCode(500, new ApiResponse<SharedVideoDto>
            {
                Success = false,
                Message = "An error occurred while updating video"
            });
        }
    }

    // DELETE: /slideshows/admin/videos/{id}
    // Delete a shared video
    [HttpDelete("admin/videos/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSharedVideo(int id)
    {
        try
        {
            var video = await _context.SharedVideos.FindAsync(id);
            if (video == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Video not found"
                });
            }

            _context.SharedVideos.Remove(video);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Video deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting shared video {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting video"
            });
        }
    }

    // ============ ADMIN SHARED IMAGE ENDPOINTS ============

    // GET: /slideshows/admin/images
    // Get all shared images (admin)
    [HttpGet("admin/images")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<List<SharedImageDto>>>> GetAllSharedImages()
    {
        try
        {
            var images = await _context.SharedImages
                .OrderBy(i => i.DisplayOrder)
                .Select(i => new SharedImageDto
                {
                    ImageId = i.ImageId,
                    Url = i.Url,
                    Title = i.Title,
                    ThumbnailUrl = i.ThumbnailUrl,
                    Category = i.Category,
                    IsActive = i.IsActive,
                    DisplayOrder = i.DisplayOrder
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<SharedImageDto>>
            {
                Success = true,
                Data = images
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all shared images");
            return StatusCode(500, new ApiResponse<List<SharedImageDto>>
            {
                Success = false,
                Message = "An error occurred while fetching images"
            });
        }
    }

    // POST: /slideshows/admin/images
    // Create a shared image
    [HttpPost("admin/images")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SharedImageDto>>> CreateSharedImage([FromBody] CreateSharedImageRequest request)
    {
        try
        {
            var image = new SharedImage
            {
                Url = request.Url,
                Title = request.Title,
                ThumbnailUrl = request.ThumbnailUrl,
                Category = request.Category,
                IsActive = request.IsActive,
                DisplayOrder = request.DisplayOrder
            };

            _context.SharedImages.Add(image);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SharedImageDto>
            {
                Success = true,
                Message = "Image added successfully",
                Data = new SharedImageDto
                {
                    ImageId = image.ImageId,
                    Url = image.Url,
                    Title = image.Title,
                    ThumbnailUrl = image.ThumbnailUrl,
                    Category = image.Category,
                    IsActive = image.IsActive,
                    DisplayOrder = image.DisplayOrder
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating shared image");
            return StatusCode(500, new ApiResponse<SharedImageDto>
            {
                Success = false,
                Message = "An error occurred while creating image"
            });
        }
    }

    // PUT: /slideshows/admin/images/{id}
    // Update a shared image
    [HttpPut("admin/images/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<SharedImageDto>>> UpdateSharedImage(int id, [FromBody] UpdateSharedImageRequest request)
    {
        try
        {
            var image = await _context.SharedImages.FindAsync(id);
            if (image == null)
            {
                return NotFound(new ApiResponse<SharedImageDto>
                {
                    Success = false,
                    Message = "Image not found"
                });
            }

            image.Url = request.Url;
            image.Title = request.Title;
            image.ThumbnailUrl = request.ThumbnailUrl;
            image.Category = request.Category;
            image.IsActive = request.IsActive;
            image.DisplayOrder = request.DisplayOrder;
            image.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SharedImageDto>
            {
                Success = true,
                Message = "Image updated successfully",
                Data = new SharedImageDto
                {
                    ImageId = image.ImageId,
                    Url = image.Url,
                    Title = image.Title,
                    ThumbnailUrl = image.ThumbnailUrl,
                    Category = image.Category,
                    IsActive = image.IsActive,
                    DisplayOrder = image.DisplayOrder
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating shared image {Id}", id);
            return StatusCode(500, new ApiResponse<SharedImageDto>
            {
                Success = false,
                Message = "An error occurred while updating image"
            });
        }
    }

    // DELETE: /slideshows/admin/images/{id}
    // Delete a shared image
    [HttpDelete("admin/images/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSharedImage(int id)
    {
        try
        {
            var image = await _context.SharedImages.FindAsync(id);
            if (image == null)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Image not found"
                });
            }

            _context.SharedImages.Remove(image);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Image deleted successfully",
                Data = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting shared image {Id}", id);
            return StatusCode(500, new ApiResponse<bool>
            {
                Success = false,
                Message = "An error occurred while deleting image"
            });
        }
    }

    // ============ ADMIN UPLOAD ENDPOINTS ============

    // POST: /slideshows/admin/videos/upload
    // Upload a video file and create a shared video entry
    [HttpPost("admin/videos/upload")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(110 * 1024 * 1024)] // 110MB for videos
    [RequestFormLimits(MultipartBodyLengthLimit = 110 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<SharedVideoDto>>> UploadSharedVideo(
        IFormFile file,
        [FromForm] string? title = null,
        [FromForm] string? category = null)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<SharedVideoDto>
                {
                    Success = false,
                    Message = "No file provided"
                });
            }

            // Validate file type
            var allowedTypes = new[] { "video/mp4", "video/webm", "video/ogg", "video/quicktime" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
            {
                return BadRequest(new ApiResponse<SharedVideoDto>
                {
                    Success = false,
                    Message = "Invalid file type. Allowed types: MP4, WebM, OGG, MOV"
                });
            }

            var currentUserId = GetCurrentUserId();

            // Upload using asset service
            var uploadResult = await _assetService.UploadAssetAsync(
                file,
                "slideshows/videos",
                objectType: "SharedVideo",
                uploadedBy: currentUserId
            );

            if (!uploadResult.Success)
            {
                return BadRequest(new ApiResponse<SharedVideoDto>
                {
                    Success = false,
                    Message = uploadResult.Error ?? "Failed to upload file"
                });
            }

            // Create shared video entry
            var video = new SharedVideo
            {
                Url = uploadResult.Url!,
                Title = title ?? file.FileName,
                Category = category,
                IsActive = true,
                DisplayOrder = await _context.SharedVideos.CountAsync()
            };

            _context.SharedVideos.Add(video);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SharedVideoDto>
            {
                Success = true,
                Message = "Video uploaded successfully",
                Data = new SharedVideoDto
                {
                    VideoId = video.VideoId,
                    Url = video.Url,
                    Title = video.Title,
                    Category = video.Category,
                    IsActive = video.IsActive,
                    DisplayOrder = video.DisplayOrder
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading shared video");
            return StatusCode(500, new ApiResponse<SharedVideoDto>
            {
                Success = false,
                Message = "An error occurred while uploading video"
            });
        }
    }

    // POST: /slideshows/admin/images/upload
    // Upload an image file and create a shared image entry
    [HttpPost("admin/images/upload")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(25 * 1024 * 1024)] // 25MB for images
    [RequestFormLimits(MultipartBodyLengthLimit = 25 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<SharedImageDto>>> UploadSharedImage(
        IFormFile file,
        [FromForm] string? title = null,
        [FromForm] string? category = null)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<SharedImageDto>
                {
                    Success = false,
                    Message = "No file provided"
                });
            }

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
            {
                return BadRequest(new ApiResponse<SharedImageDto>
                {
                    Success = false,
                    Message = "Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, SVG"
                });
            }

            var currentUserId = GetCurrentUserId();

            // Upload using asset service
            var uploadResult = await _assetService.UploadAssetAsync(
                file,
                "slideshows/images",
                objectType: "SharedImage",
                uploadedBy: currentUserId
            );

            if (!uploadResult.Success)
            {
                return BadRequest(new ApiResponse<SharedImageDto>
                {
                    Success = false,
                    Message = uploadResult.Error ?? "Failed to upload file"
                });
            }

            // Create shared image entry
            var image = new SharedImage
            {
                Url = uploadResult.Url!,
                Title = title ?? file.FileName,
                Category = category,
                IsActive = true,
                DisplayOrder = await _context.SharedImages.CountAsync()
            };

            _context.SharedImages.Add(image);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SharedImageDto>
            {
                Success = true,
                Message = "Image uploaded successfully",
                Data = new SharedImageDto
                {
                    ImageId = image.ImageId,
                    Url = image.Url,
                    Title = image.Title,
                    Category = image.Category,
                    IsActive = image.IsActive,
                    DisplayOrder = image.DisplayOrder
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading shared image");
            return StatusCode(500, new ApiResponse<SharedImageDto>
            {
                Success = false,
                Message = "An error occurred while uploading image"
            });
        }
    }

    // ============ HELPER METHODS ============

    private SlideShowDto MapToSlideShowDto(SlideShow slideShow)
    {
        return new SlideShowDto
        {
            SlideShowId = slideShow.SlideShowId,
            Code = slideShow.Code,
            Name = slideShow.Name,
            Description = slideShow.Description,
            IsActive = slideShow.IsActive,
            TransitionType = slideShow.TransitionType,
            TransitionDuration = slideShow.TransitionDuration,
            ShowProgress = slideShow.ShowProgress,
            AllowSkip = slideShow.AllowSkip,
            Loop = slideShow.Loop,
            AutoPlay = slideShow.AutoPlay,
            CreatedBy = slideShow.CreatedBy,
            CreatedByName = slideShow.CreatedByUser != null
                ? $"{slideShow.CreatedByUser.FirstName} {slideShow.CreatedByUser.LastName}"
                : null,
            CreatedAt = slideShow.CreatedAt,
            UpdatedAt = slideShow.UpdatedAt,
            Slides = slideShow.Slides?.Select(MapToSlideDto).ToList() ?? new List<SlideDto>()
        };
    }

    private SlideDto MapToSlideDto(Slide slide)
    {
        return new SlideDto
        {
            SlideId = slide.SlideId,
            SlideShowId = slide.SlideShowId,
            DisplayOrder = slide.DisplayOrder,
            Duration = slide.Duration,
            // NEW: Background settings
            BackgroundType = slide.BackgroundType,
            BackgroundColor = slide.BackgroundColor,
            BackgroundImageUrl = slide.BackgroundImageUrl,
            UseRandomHeroVideos = slide.UseRandomHeroVideos,
            // Legacy fields
            VideoUrl = slide.VideoUrl,
            UseRandomVideo = slide.UseRandomVideo,
            Layout = slide.Layout,
            OverlayType = slide.OverlayType,
            OverlayColor = slide.OverlayColor,
            OverlayOpacity = slide.OverlayOpacity,
            // Legacy collections
            Images = slide.Images?.Select(MapToSlideImageDto).ToList() ?? new List<SlideImageDto>(),
            Texts = slide.Texts?.Select(MapToSlideTextDto).ToList() ?? new List<SlideTextDto>(),
            // NEW: Object-oriented collections
            Objects = slide.Objects?.Select(MapToSlideObjectDto).ToList() ?? new List<SlideObjectDto>(),
            BackgroundVideos = slide.BackgroundVideos?.Select(MapToSlideBackgroundVideoDto).ToList() ?? new List<SlideBackgroundVideoDto>()
        };
    }

    private SlideImageDto MapToSlideImageDto(SlideImage image)
    {
        return new SlideImageDto
        {
            SlideImageId = image.SlideImageId,
            SlideId = image.SlideId,
            ImageUrl = image.ImageUrl,
            DisplayOrder = image.DisplayOrder,
            Position = image.Position,
            Size = image.Size,
            Orientation = image.Orientation,
            Animation = image.Animation,
            Duration = image.Duration,
            Delay = image.Delay,
            BorderRadius = image.BorderRadius,
            Shadow = image.Shadow,
            Opacity = image.Opacity
        };
    }

    private SlideTextDto MapToSlideTextDto(SlideText text)
    {
        return new SlideTextDto
        {
            SlideTextId = text.SlideTextId,
            SlideId = text.SlideId,
            Text = text.Text,
            DisplayOrder = text.DisplayOrder,
            HorizontalPosition = text.HorizontalPosition,
            VerticalPosition = text.VerticalPosition,
            Size = text.Size,
            Color = text.Color,
            FontFamily = text.FontFamily,
            Animation = text.Animation,
            Duration = text.Duration,
            Delay = text.Delay
        };
    }

    private SlideObjectDto MapToSlideObjectDto(SlideObject obj)
    {
        return new SlideObjectDto
        {
            SlideObjectId = obj.SlideObjectId,
            SlideId = obj.SlideId,
            ObjectType = obj.ObjectType,
            SortOrder = obj.SortOrder,
            Name = obj.Name,
            HorizontalAlign = obj.HorizontalAlign,
            VerticalAlign = obj.VerticalAlign,
            OffsetX = obj.OffsetX,
            OffsetY = obj.OffsetY,
            AnimationIn = obj.AnimationIn,
            AnimationInDelay = obj.AnimationInDelay,
            AnimationInDuration = obj.AnimationInDuration,
            AnimationOut = obj.AnimationOut,
            AnimationOutDelay = obj.AnimationOutDelay,
            AnimationOutDuration = obj.AnimationOutDuration,
            StayOnScreen = obj.StayOnScreen,
            Properties = obj.Properties,
            CreatedAt = obj.CreatedAt,
            UpdatedAt = obj.UpdatedAt
        };
    }

    private SlideBackgroundVideoDto MapToSlideBackgroundVideoDto(SlideBackgroundVideo bgVideo)
    {
        return new SlideBackgroundVideoDto
        {
            SlideBackgroundVideoId = bgVideo.SlideBackgroundVideoId,
            SlideId = bgVideo.SlideId,
            VideoId = bgVideo.VideoId,
            VideoUrl = bgVideo.VideoUrl,
            Duration = bgVideo.Duration,
            SortOrder = bgVideo.SortOrder,
            UseRandom = bgVideo.UseRandom,
            Video = bgVideo.Video != null ? new SharedVideoDto
            {
                VideoId = bgVideo.Video.VideoId,
                Url = bgVideo.Video.Url,
                Title = bgVideo.Video.Title,
                ThumbnailUrl = bgVideo.Video.ThumbnailUrl,
                Category = bgVideo.Video.Category,
                IsActive = bgVideo.Video.IsActive,
                DisplayOrder = bgVideo.Video.DisplayOrder
            } : null
        };
    }
}
