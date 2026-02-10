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
public class SeatingChartsController : ControllerBase
{
    private readonly CasecDbContext _context;
    private readonly ILogger<SeatingChartsController> _logger;

    public SeatingChartsController(CasecDbContext context, ILogger<SeatingChartsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    // ==================== SEATING CHARTS ====================

    // GET: /SeatingCharts - List all charts (admin)
    [Authorize]
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<SeatingChartDto>>>> GetCharts()
    {
        try
        {
            var charts = await _context.SeatingCharts
                .Include(c => c.Sections)
                .Include(c => c.Event)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var dtos = charts.Select(c => new SeatingChartDto
            {
                ChartId = c.ChartId,
                Name = c.Name,
                Description = c.Description,
                EventId = c.EventId,
                EventName = c.Event?.Title,
                Status = c.Status,
                TotalSeats = c.TotalSeats,
                OccupiedSeats = c.OccupiedSeats,
                SectionCount = c.Sections.Count,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }).ToList();

            return Ok(new ApiResponse<List<SeatingChartDto>> { Success = true, Data = dtos });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching seating charts");
            return StatusCode(500, new ApiResponse<List<SeatingChartDto>> { Success = false, Message = "Error fetching charts" });
        }
    }

    // GET: /SeatingCharts/{id} - Get chart with sections and seats
    [Authorize]
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<SeatingChartDetailDto>>> GetChart(int id)
    {
        try
        {
            var chart = await _context.SeatingCharts
                .Include(c => c.Sections.OrderBy(s => s.DisplayOrder))
                .Include(c => c.Seats)
                .Include(c => c.Event)
                .FirstOrDefaultAsync(c => c.ChartId == id);

            if (chart == null)
                return NotFound(new ApiResponse<SeatingChartDetailDto> { Success = false, Message = "Chart not found" });

            var dto = new SeatingChartDetailDto
            {
                ChartId = chart.ChartId,
                Name = chart.Name,
                Description = chart.Description,
                EventId = chart.EventId,
                EventName = chart.Event?.Title,
                Status = chart.Status,
                TotalSeats = chart.TotalSeats,
                OccupiedSeats = chart.OccupiedSeats,
                CreatedAt = chart.CreatedAt,
                UpdatedAt = chart.UpdatedAt,
                Sections = chart.Sections.Select(s => new SeatingSectionDto
                {
                    SectionId = s.SectionId,
                    Name = s.Name,
                    ShortName = s.ShortName,
                    DisplayOrder = s.DisplayOrder,
                    RowPrefix = s.RowPrefix,
                    SeatsPerRow = s.SeatsPerRow,
                    RowLabels = s.RowLabels,
                    StartSeatNumber = s.StartSeatNumber,
                    SeatIncrement = s.SeatIncrement,
                    Direction = s.Direction,
                    SeatCount = chart.Seats.Count(seat => seat.SectionId == s.SectionId)
                }).ToList(),
                Seats = chart.Seats.Select(seat => new SeatingSeatDto
                {
                    SeatId = seat.SeatId,
                    SectionId = seat.SectionId,
                    RowLabel = seat.RowLabel,
                    SeatNumber = seat.SeatNumber,
                    SeatLabel = seat.SeatLabel,
                    Status = seat.Status,
                    AttendeeName = seat.AttendeeName,
                    AttendeePhone = seat.AttendeePhone,
                    AttendeeEmail = seat.AttendeeEmail,
                    AttendeeNotes = seat.AttendeeNotes,
                    TableNumber = seat.TableNumber,
                    IsVIP = seat.IsVIP,
                    IsAccessible = seat.IsAccessible
                }).ToList()
            };

            return Ok(new ApiResponse<SeatingChartDetailDto> { Success = true, Data = dto });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching seating chart {ChartId}", id);
            return StatusCode(500, new ApiResponse<SeatingChartDetailDto> { Success = false, Message = "Error fetching chart" });
        }
    }

    // POST: /SeatingCharts - Create chart
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<SeatingChartDto>>> CreateChart([FromBody] CreateSeatingChartRequest request)
    {
        try
        {
            var chart = new SeatingChart
            {
                Name = request.Name,
                Description = request.Description,
                EventId = request.EventId,
                Status = "Draft",
                CreatedBy = GetCurrentUserId()
            };

            _context.SeatingCharts.Add(chart);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SeatingChartDto>
            {
                Success = true,
                Data = new SeatingChartDto
                {
                    ChartId = chart.ChartId,
                    Name = chart.Name,
                    Description = chart.Description,
                    Status = chart.Status,
                    CreatedAt = chart.CreatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating seating chart");
            return StatusCode(500, new ApiResponse<SeatingChartDto> { Success = false, Message = "Error creating chart" });
        }
    }

    // PUT: /SeatingCharts/{id} - Update chart
    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<SeatingChartDto>>> UpdateChart(int id, [FromBody] UpdateSeatingChartRequest request)
    {
        try
        {
            var chart = await _context.SeatingCharts.FindAsync(id);
            if (chart == null)
                return NotFound(new ApiResponse<SeatingChartDto> { Success = false, Message = "Chart not found" });

            if (request.Name != null) chart.Name = request.Name;
            if (request.Description != null) chart.Description = request.Description;
            if (request.EventId.HasValue) chart.EventId = request.EventId.Value == 0 ? null : request.EventId;
            if (request.Status != null) chart.Status = request.Status;
            chart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SeatingChartDto>
            {
                Success = true,
                Data = new SeatingChartDto
                {
                    ChartId = chart.ChartId,
                    Name = chart.Name,
                    Status = chart.Status,
                    UpdatedAt = chart.UpdatedAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating seating chart {ChartId}", id);
            return StatusCode(500, new ApiResponse<SeatingChartDto> { Success = false, Message = "Error updating chart" });
        }
    }

    // DELETE: /SeatingCharts/{id}
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteChart(int id)
    {
        try
        {
            var chart = await _context.SeatingCharts.FindAsync(id);
            if (chart == null)
                return NotFound(new ApiResponse<bool> { Success = false, Message = "Chart not found" });

            _context.SeatingCharts.Remove(chart);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool> { Success = true, Data = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting seating chart {ChartId}", id);
            return StatusCode(500, new ApiResponse<bool> { Success = false, Message = "Error deleting chart" });
        }
    }

    // ==================== SECTIONS ====================

    // POST: /SeatingCharts/{chartId}/sections
    [Authorize]
    [HttpPost("{chartId}/sections")]
    public async Task<ActionResult<ApiResponse<SeatingSectionDto>>> AddSection(int chartId, [FromBody] CreateSeatingSectionRequest request)
    {
        try
        {
            var chart = await _context.SeatingCharts.FindAsync(chartId);
            if (chart == null)
                return NotFound(new ApiResponse<SeatingSectionDto> { Success = false, Message = "Chart not found" });

            var section = new SeatingSection
            {
                ChartId = chartId,
                Name = request.Name,
                ShortName = request.ShortName ?? request.Name.Replace(" ", "-"),
                DisplayOrder = request.DisplayOrder,
                RowPrefix = request.RowPrefix,
                SeatsPerRow = request.SeatsPerRow,
                RowLabels = request.RowLabels,
                StartSeatNumber = request.StartSeatNumber,
                SeatIncrement = request.SeatIncrement,
                Direction = request.Direction
            };

            _context.SeatingSections.Add(section);
            await _context.SaveChangesAsync();

            // Auto-generate seats if row labels provided
            if (!string.IsNullOrEmpty(request.RowLabels) && request.SeatsPerRow > 0)
            {
                await GenerateSeatsForSection(chartId, section);
            }

            return Ok(new ApiResponse<SeatingSectionDto>
            {
                Success = true,
                Data = new SeatingSectionDto
                {
                    SectionId = section.SectionId,
                    Name = section.Name,
                    ShortName = section.ShortName,
                    DisplayOrder = section.DisplayOrder,
                    SeatsPerRow = section.SeatsPerRow,
                    RowLabels = section.RowLabels,
                    StartSeatNumber = section.StartSeatNumber,
                    SeatIncrement = section.SeatIncrement,
                    Direction = section.Direction
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding section to chart {ChartId}", chartId);
            return StatusCode(500, new ApiResponse<SeatingSectionDto> { Success = false, Message = "Error adding section" });
        }
    }

    // PUT: /SeatingCharts/{chartId}/sections/{sectionId}
    [Authorize]
    [HttpPut("{chartId}/sections/{sectionId}")]
    public async Task<ActionResult<ApiResponse<SeatingSectionDto>>> UpdateSection(int chartId, int sectionId, [FromBody] UpdateSeatingSectionRequest request)
    {
        try
        {
            var section = await _context.SeatingSections.FirstOrDefaultAsync(s => s.SectionId == sectionId && s.ChartId == chartId);
            if (section == null)
                return NotFound(new ApiResponse<SeatingSectionDto> { Success = false, Message = "Section not found" });

            if (request.Name != null) section.Name = request.Name;
            if (request.ShortName != null) section.ShortName = request.ShortName;
            if (request.DisplayOrder.HasValue) section.DisplayOrder = request.DisplayOrder.Value;
            if (request.SeatsPerRow.HasValue) section.SeatsPerRow = request.SeatsPerRow.Value;
            if (request.RowLabels != null) section.RowLabels = request.RowLabels;
            if (request.StartSeatNumber.HasValue) section.StartSeatNumber = request.StartSeatNumber.Value;
            if (request.SeatIncrement.HasValue) section.SeatIncrement = request.SeatIncrement.Value;
            if (request.Direction != null) section.Direction = request.Direction;

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<SeatingSectionDto> { Success = true, Data = new SeatingSectionDto 
            { 
                SectionId = section.SectionId, 
                Name = section.Name,
                SeatIncrement = section.SeatIncrement,
                Direction = section.Direction
            } });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating section {SectionId}", sectionId);
            return StatusCode(500, new ApiResponse<SeatingSectionDto> { Success = false, Message = "Error updating section" });
        }
    }

    // DELETE: /SeatingCharts/{chartId}/sections/{sectionId}
    [Authorize]
    [HttpDelete("{chartId}/sections/{sectionId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSection(int chartId, int sectionId)
    {
        try
        {
            var section = await _context.SeatingSections
                .Include(s => s.Seats)
                .FirstOrDefaultAsync(s => s.SectionId == sectionId && s.ChartId == chartId);

            if (section == null)
                return NotFound(new ApiResponse<bool> { Success = false, Message = "Section not found" });

            // Remove seats first
            _context.SeatingSeats.RemoveRange(section.Seats);
            _context.SeatingSections.Remove(section);
            await _context.SaveChangesAsync();

            // Update chart counts
            await UpdateChartCounts(chartId);

            return Ok(new ApiResponse<bool> { Success = true, Data = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting section {SectionId}", sectionId);
            return StatusCode(500, new ApiResponse<bool> { Success = false, Message = "Error deleting section" });
        }
    }

    // POST: /SeatingCharts/{chartId}/sections/{sectionId}/generate-seats
    [Authorize]
    [HttpPost("{chartId}/sections/{sectionId}/generate-seats")]
    public async Task<ActionResult<ApiResponse<int>>> GenerateSeats(int chartId, int sectionId)
    {
        try
        {
            var section = await _context.SeatingSections.FirstOrDefaultAsync(s => s.SectionId == sectionId && s.ChartId == chartId);
            if (section == null)
                return NotFound(new ApiResponse<int> { Success = false, Message = "Section not found" });

            // Remove existing seats
            var existingSeats = await _context.SeatingSeats.Where(s => s.SectionId == sectionId).ToListAsync();
            _context.SeatingSeats.RemoveRange(existingSeats);

            var count = await GenerateSeatsForSection(chartId, section);

            return Ok(new ApiResponse<int> { Success = true, Data = count, Message = $"Generated {count} seats" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating seats for section {SectionId}", sectionId);
            return StatusCode(500, new ApiResponse<int> { Success = false, Message = "Error generating seats" });
        }
    }

    private async Task<int> GenerateSeatsForSection(int chartId, SeatingSection section)
    {
        if (string.IsNullOrEmpty(section.RowLabels)) return 0;

        var rows = section.RowLabels.Split(',').Select(r => r.Trim()).Where(r => !string.IsNullOrEmpty(r)).ToList();
        var seats = new List<SeatingSeat>();
        var increment = section.SeatIncrement > 0 ? section.SeatIncrement : 1;

        foreach (var rowLabel in rows)
        {
            // Generate SeatsPerRow seats, starting at StartSeatNumber, incrementing by SeatIncrement
            // e.g., Start=1, Count=10, Increment=2 → 1,3,5,7,9,11,13,15,17,19 (odd only)
            // e.g., Start=2, Count=10, Increment=2 → 2,4,6,8,10,12,14,16,18,20 (even only)
            for (int i = 0; i < section.SeatsPerRow; i++)
            {
                var seatNum = section.StartSeatNumber + (i * increment);
                seats.Add(new SeatingSeat
                {
                    ChartId = chartId,
                    SectionId = section.SectionId,
                    RowLabel = rowLabel,
                    SeatNumber = seatNum,
                    Status = "Available"
                });
            }
        }

        _context.SeatingSeats.AddRange(seats);
        await _context.SaveChangesAsync();

        await UpdateChartCounts(chartId);

        return seats.Count;
    }

    private async Task UpdateChartCounts(int chartId)
    {
        var chart = await _context.SeatingCharts.FindAsync(chartId);
        if (chart != null)
        {
            var seats = await _context.SeatingSeats.Where(s => s.ChartId == chartId).ToListAsync();
            chart.TotalSeats = seats.Count;
            chart.OccupiedSeats = seats.Count(s => s.Status == "Occupied" || !string.IsNullOrEmpty(s.AttendeeName));
            chart.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    // ==================== SEATS ====================

    // PUT: /SeatingCharts/{chartId}/seats/{seatId} - Update individual seat
    [Authorize]
    [HttpPut("{chartId}/seats/{seatId}")]
    public async Task<ActionResult<ApiResponse<SeatingSeatDto>>> UpdateSeat(int chartId, int seatId, [FromBody] UpdateSeatingSeatRequest request)
    {
        try
        {
            var seat = await _context.SeatingSeats.FirstOrDefaultAsync(s => s.SeatId == seatId && s.ChartId == chartId);
            if (seat == null)
                return NotFound(new ApiResponse<SeatingSeatDto> { Success = false, Message = "Seat not found" });

            if (request.Status != null) seat.Status = request.Status;
            if (request.AttendeeName != null) seat.AttendeeName = request.AttendeeName == "" ? null : request.AttendeeName;
            if (request.AttendeePhone != null) seat.AttendeePhone = request.AttendeePhone == "" ? null : request.AttendeePhone;
            if (request.AttendeeEmail != null) seat.AttendeeEmail = request.AttendeeEmail == "" ? null : request.AttendeeEmail;
            if (request.AttendeeNotes != null) seat.AttendeeNotes = request.AttendeeNotes == "" ? null : request.AttendeeNotes;
            if (request.TableNumber.HasValue) seat.TableNumber = request.TableNumber.Value == 0 ? null : request.TableNumber;
            if (request.IsVIP.HasValue) seat.IsVIP = request.IsVIP.Value;
            if (request.IsAccessible.HasValue) seat.IsAccessible = request.IsAccessible.Value;
            seat.UpdatedAt = DateTime.UtcNow;

            // Auto-set status to Occupied if attendee assigned
            if (!string.IsNullOrEmpty(seat.AttendeeName) && seat.Status == "Available")
            {
                seat.Status = "Occupied";
            }

            await _context.SaveChangesAsync();
            await UpdateChartCounts(chartId);

            return Ok(new ApiResponse<SeatingSeatDto>
            {
                Success = true,
                Data = new SeatingSeatDto
                {
                    SeatId = seat.SeatId,
                    SectionId = seat.SectionId,
                    RowLabel = seat.RowLabel,
                    SeatNumber = seat.SeatNumber,
                    Status = seat.Status,
                    AttendeeName = seat.AttendeeName,
                    AttendeePhone = seat.AttendeePhone
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating seat {SeatId}", seatId);
            return StatusCode(500, new ApiResponse<SeatingSeatDto> { Success = false, Message = "Error updating seat" });
        }
    }

    // POST: /SeatingCharts/{chartId}/seats/bulk-update - Bulk update seats
    [Authorize]
    [HttpPost("{chartId}/seats/bulk-update")]
    public async Task<ActionResult<ApiResponse<int>>> BulkUpdateSeats(int chartId, [FromBody] BulkUpdateSeatsRequest request)
    {
        try
        {
            if (request == null)
                return BadRequest(new ApiResponse<int> { Success = false, Message = "Request body is null" });
            
            var seatIdList = (request.SeatIds ?? Array.Empty<int>()).ToList();
            _logger.LogInformation("BulkUpdateSeats: chartId={ChartId}, seatIds count={Count}, status={Status}, isVIP={IsVIP}", 
                chartId, seatIdList.Count, request.Status, request.IsVIP);
            
            var seats = await _context.SeatingSeats.Where(s => s.ChartId == chartId && seatIdList.Contains(s.SeatId)).ToListAsync();

            foreach (var seat in seats)
            {
                if (request.Status != null) seat.Status = request.Status;
                if (request.IsVIP.HasValue) seat.IsVIP = request.IsVIP.Value;
                seat.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            await UpdateChartCounts(chartId);

            return Ok(new ApiResponse<int> { Success = true, Data = seats.Count, Message = $"Updated {seats.Count} seats" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk updating seats");
            return StatusCode(500, new ApiResponse<int> { Success = false, Message = $"Error updating seats: {ex.Message}" });
        }
    }

    // POST: /SeatingCharts/{chartId}/import - Import seats from CSV/JSON
    [Authorize]
    [HttpPost("{chartId}/import")]
    public async Task<ActionResult<ApiResponse<ImportSeatsResult>>> ImportSeats(int chartId, [FromBody] ImportSeatsRequest request)
    {
        try
        {
            var chart = await _context.SeatingCharts.Include(c => c.Sections).FirstOrDefaultAsync(c => c.ChartId == chartId);
            if (chart == null)
                return NotFound(new ApiResponse<ImportSeatsResult> { Success = false, Message = "Chart not found" });

            var result = new ImportSeatsResult();

            foreach (var row in request.Seats)
            {
                try
                {
                    // Find or create section
                    var section = chart.Sections.FirstOrDefault(s => s.ShortName == row.SectionName || s.Name == row.SectionName);
                    if (section == null && !string.IsNullOrEmpty(row.SectionName))
                    {
                        section = new SeatingSection
                        {
                            ChartId = chartId,
                            Name = row.SectionName,
                            ShortName = row.SectionName.Replace(" ", "-")
                        };
                        _context.SeatingSections.Add(section);
                        await _context.SaveChangesAsync();
                        chart.Sections.Add(section);
                    }

                    if (section == null)
                    {
                        result.Errors.Add($"Row {result.Imported + result.Errors.Count + 1}: Section not found");
                        continue;
                    }

                    // Check for existing seat
                    var existing = await _context.SeatingSeats.FirstOrDefaultAsync(s =>
                        s.ChartId == chartId && s.SectionId == section.SectionId &&
                        s.RowLabel == row.RowLabel && s.SeatNumber == row.SeatNumber);

                    if (existing != null)
                    {
                        // Update existing
                        if (!string.IsNullOrEmpty(row.AttendeeName)) existing.AttendeeName = row.AttendeeName;
                        if (!string.IsNullOrEmpty(row.AttendeePhone)) existing.AttendeePhone = row.AttendeePhone;
                        if (!string.IsNullOrEmpty(row.AttendeeEmail)) existing.AttendeeEmail = row.AttendeeEmail;
                        if (!string.IsNullOrEmpty(row.AttendeeName)) existing.Status = "Occupied";
                        existing.UpdatedAt = DateTime.UtcNow;
                        result.Updated++;
                    }
                    else
                    {
                        // Create new
                        var seat = new SeatingSeat
                        {
                            ChartId = chartId,
                            SectionId = section.SectionId,
                            RowLabel = row.RowLabel,
                            SeatNumber = row.SeatNumber,
                            AttendeeName = row.AttendeeName,
                            AttendeePhone = row.AttendeePhone,
                            AttendeeEmail = row.AttendeeEmail,
                            Status = string.IsNullOrEmpty(row.AttendeeName) ? "Available" : "Occupied",
                            TableNumber = row.TableNumber,
                            IsVIP = row.IsVIP
                        };
                        _context.SeatingSeats.Add(seat);
                        result.Imported++;
                    }
                }
                catch (Exception rowEx)
                {
                    result.Errors.Add($"Row {result.Imported + result.Updated + result.Errors.Count + 1}: {rowEx.Message}");
                }
            }

            await _context.SaveChangesAsync();
            await UpdateChartCounts(chartId);

            return Ok(new ApiResponse<ImportSeatsResult> { Success = true, Data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing seats");
            return StatusCode(500, new ApiResponse<ImportSeatsResult> { Success = false, Message = "Error importing seats" });
        }
    }
}
