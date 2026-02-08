using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CasecApi.Models;

[Table("SeatingCharts")]
public class SeatingChart
{
    [Key]
    public int ChartId { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public int? EventId { get; set; }
    
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";
    
    public int TotalSeats { get; set; }
    public int OccupiedSeats { get; set; }
    
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("EventId")]
    public Event? Event { get; set; }
    
    [ForeignKey("CreatedBy")]
    public User? CreatedByUser { get; set; }
    
    public ICollection<SeatingSection> Sections { get; set; } = new List<SeatingSection>();
    public ICollection<SeatingSeat> Seats { get; set; } = new List<SeatingSeat>();
    public ICollection<SeatRaffle> SeatRaffles { get; set; } = new List<SeatRaffle>();
}

[Table("SeatingSections")]
public class SeatingSection
{
    [Key]
    public int SectionId { get; set; }
    
    public int ChartId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string ShortName { get; set; } = string.Empty;
    
    public int DisplayOrder { get; set; }
    
    [MaxLength(10)]
    public string? RowPrefix { get; set; }
    
    public int SeatsPerRow { get; set; } = 10;
    
    [MaxLength(500)]
    public string? RowLabels { get; set; }
    
    public int StartSeatNumber { get; set; } = 1;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("ChartId")]
    public SeatingChart Chart { get; set; } = null!;
    
    public ICollection<SeatingSeat> Seats { get; set; } = new List<SeatingSeat>();
}

[Table("SeatingSeats")]
public class SeatingSeat
{
    [Key]
    public int SeatId { get; set; }
    
    public int ChartId { get; set; }
    public int SectionId { get; set; }
    
    [Required]
    [MaxLength(10)]
    public string RowLabel { get; set; } = string.Empty;
    
    public int SeatNumber { get; set; }
    
    [MaxLength(50)]
    public string? SeatLabel { get; set; }
    
    [MaxLength(50)]
    public string Status { get; set; } = "Available";
    
    [MaxLength(200)]
    public string? AttendeeName { get; set; }
    
    [MaxLength(50)]
    public string? AttendeePhone { get; set; }
    
    [MaxLength(200)]
    public string? AttendeeEmail { get; set; }
    
    [MaxLength(500)]
    public string? AttendeeNotes { get; set; }
    
    public int? TableNumber { get; set; }
    
    public bool IsVIP { get; set; }
    public bool IsAccessible { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("ChartId")]
    public SeatingChart Chart { get; set; } = null!;
    
    [ForeignKey("SectionId")]
    public SeatingSection Section { get; set; } = null!;
}

[Table("SeatRaffles")]
public class SeatRaffle
{
    [Key]
    public int SeatRaffleId { get; set; }
    
    public int ChartId { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";
    
    // Theme settings
    [MaxLength(500)]
    public string? BackgroundImageUrl { get; set; }
    
    [MaxLength(50)]
    public string? BackgroundColor { get; set; } = "#1a1a2e";
    
    [MaxLength(200)]
    public string? BackgroundGradient { get; set; }
    
    [MaxLength(50)]
    public string? PrimaryColor { get; set; } = "#a855f7";
    
    [MaxLength(50)]
    public string? SecondaryColor { get; set; } = "#ec4899";
    
    [MaxLength(50)]
    public string? WinnerColor { get; set; } = "#22c55e";
    
    [MaxLength(50)]
    public string? TextColor { get; set; } = "#ffffff";
    
    [MaxLength(50)]
    public string? SeatColor { get; set; } = "#3a3a5a";
    
    [MaxLength(50)]
    public string? SeatHighlightColor { get; set; } = "#fbbf24";
    
    // Raffle settings
    public bool RequireOccupied { get; set; } = true;
    public bool AllowRepeatWinners { get; set; }
    public int AnimationSpeed { get; set; } = 100;
    public int AnimationSteps { get; set; } = 35;
    public bool ShowAttendeeName { get; set; } = true;
    public bool ShowAttendeePhone { get; set; }
    
    // Prize info
    [MaxLength(200)]
    public string? PrizeName { get; set; }
    
    [MaxLength(500)]
    public string? PrizeDescription { get; set; }
    
    [MaxLength(500)]
    public string? PrizeImageUrl { get; set; }
    
    public decimal? PrizeValue { get; set; }
    
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("ChartId")]
    public SeatingChart Chart { get; set; } = null!;
    
    [ForeignKey("CreatedBy")]
    public User? CreatedByUser { get; set; }
    
    public ICollection<SeatRaffleExclusion> Exclusions { get; set; } = new List<SeatRaffleExclusion>();
    public ICollection<SeatRaffleTarget> Targets { get; set; } = new List<SeatRaffleTarget>();
    public ICollection<SeatRaffleWinner> Winners { get; set; } = new List<SeatRaffleWinner>();
}

[Table("SeatRaffleExclusions")]
public class SeatRaffleExclusion
{
    [Key]
    public int ExclusionId { get; set; }
    
    public int SeatRaffleId { get; set; }
    public int SeatId { get; set; }
    
    [MaxLength(200)]
    public string? Reason { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("SeatRaffleId")]
    public SeatRaffle SeatRaffle { get; set; } = null!;
    
    [ForeignKey("SeatId")]
    public SeatingSeat Seat { get; set; } = null!;
}

[Table("SeatRaffleTargets")]
public class SeatRaffleTarget
{
    [Key]
    public int TargetId { get; set; }
    
    public int SeatRaffleId { get; set; }
    public int SeatId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("SeatRaffleId")]
    public SeatRaffle SeatRaffle { get; set; } = null!;
    
    [ForeignKey("SeatId")]
    public SeatingSeat Seat { get; set; } = null!;
}

[Table("SeatRaffleWinners")]
public class SeatRaffleWinner
{
    [Key]
    public int WinnerId { get; set; }
    
    public int SeatRaffleId { get; set; }
    public int SeatId { get; set; }
    
    public int DrawNumber { get; set; } = 1;
    
    [MaxLength(200)]
    public string? AttendeeName { get; set; }
    
    [MaxLength(50)]
    public string? AttendeePhone { get; set; }
    
    [MaxLength(100)]
    public string? SectionName { get; set; }
    
    [MaxLength(10)]
    public string? RowLabel { get; set; }
    
    public int? SeatNumber { get; set; }
    
    public bool IsTestDraw { get; set; }
    
    public DateTime DrawnAt { get; set; } = DateTime.UtcNow;
    public int? DrawnBy { get; set; }
    
    // Navigation properties
    [ForeignKey("SeatRaffleId")]
    public SeatRaffle SeatRaffle { get; set; } = null!;
    
    [ForeignKey("SeatId")]
    public SeatingSeat Seat { get; set; } = null!;
    
    [ForeignKey("DrawnBy")]
    public User? DrawnByUser { get; set; }
}
