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
                VideoUrl = request.VideoUrl,
                UseRandomVideo = request.UseRandomVideo,
                Layout = request.Layout,
                OverlayType = request.OverlayType,
                OverlayColor = request.OverlayColor,
                OverlayOpacity = request.OverlayOpacity,
                TitleText = request.TitleText,
                TitleAnimation = request.TitleAnimation,
                TitleDuration = request.TitleDuration,
                TitleDelay = request.TitleDelay,
                TitleSize = request.TitleSize,
                TitleColor = request.TitleColor,
                SubtitleText = request.SubtitleText,
                SubtitleAnimation = request.SubtitleAnimation,
                SubtitleDuration = request.SubtitleDuration,
                SubtitleDelay = request.SubtitleDelay,
                SubtitleSize = request.SubtitleSize,
                SubtitleColor = request.SubtitleColor
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
            slide.VideoUrl = request.VideoUrl;
            slide.UseRandomVideo = request.UseRandomVideo;
            slide.Layout = request.Layout;
            slide.OverlayType = request.OverlayType;
            slide.OverlayColor = request.OverlayColor;
            slide.OverlayOpacity = request.OverlayOpacity;
            slide.TitleText = request.TitleText;
            slide.TitleAnimation = request.TitleAnimation;
            slide.TitleDuration = request.TitleDuration;
            slide.TitleDelay = request.TitleDelay;
            slide.TitleSize = request.TitleSize;
            slide.TitleColor = request.TitleColor;
            slide.SubtitleText = request.SubtitleText;
            slide.SubtitleAnimation = request.SubtitleAnimation;
            slide.SubtitleDuration = request.SubtitleDuration;
            slide.SubtitleDelay = request.SubtitleDelay;
            slide.SubtitleSize = request.SubtitleSize;
            slide.SubtitleColor = request.SubtitleColor;
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
            VideoUrl = slide.VideoUrl,
            UseRandomVideo = slide.UseRandomVideo,
            Layout = slide.Layout,
            OverlayType = slide.OverlayType,
            OverlayColor = slide.OverlayColor,
            OverlayOpacity = slide.OverlayOpacity,
            TitleText = slide.TitleText,
            TitleAnimation = slide.TitleAnimation,
            TitleDuration = slide.TitleDuration,
            TitleDelay = slide.TitleDelay,
            TitleSize = slide.TitleSize,
            TitleColor = slide.TitleColor,
            SubtitleText = slide.SubtitleText,
            SubtitleAnimation = slide.SubtitleAnimation,
            SubtitleDuration = slide.SubtitleDuration,
            SubtitleDelay = slide.SubtitleDelay,
            SubtitleSize = slide.SubtitleSize,
            SubtitleColor = slide.SubtitleColor,
            Images = slide.Images?.Select(MapToSlideImageDto).ToList() ?? new List<SlideImageDto>()
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
            Animation = image.Animation,
            Duration = image.Duration,
            Delay = image.Delay,
            BorderRadius = image.BorderRadius,
            Shadow = image.Shadow,
            Opacity = image.Opacity
        };
    }
}
