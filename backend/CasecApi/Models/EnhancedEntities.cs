using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CasecApi.Models;

// User Entity
public class User
{
    [Key]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(50)]
    public string? State { get; set; }

    [MaxLength(20)]
    public string? ZipCode { get; set; }

    [MaxLength(100)]
    public string? Profession { get; set; }

    [MaxLength(255)]
    public string? Hobbies { get; set; }

    public string? Bio { get; set; }

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    // Board member fields
    public bool IsBoardMember { get; set; } = false;

    [MaxLength(100)]
    public string? BoardTitle { get; set; }

    public int? BoardDisplayOrder { get; set; }

    public string? BoardBio { get; set; }

    [MaxLength(100)]
    public string? LinkedInUrl { get; set; }

    [MaxLength(100)]
    public string? TwitterHandle { get; set; }

    // Family fields
    public int? FamilyGroupId { get; set; }
    
    [MaxLength(50)]
    public string? RelationshipToPrimary { get; set; }

    [Required]
    public int MembershipTypeId { get; set; }

    public bool IsAdmin { get; set; } = false;

    public DateTime MemberSince { get; set; } = DateTime.UtcNow;

    // Membership validity tracking
    public DateTime? MembershipValidUntil { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("MembershipTypeId")]
    public virtual MembershipType? MembershipType { get; set; }
    
    public virtual FamilyGroup? FamilyGroup { get; set; }
}

// MembershipType Entity
public class MembershipType
{
    [Key]
    public int MembershipTypeId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    [Column(TypeName = "decimal(10, 2)")]
    public decimal Price { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal AnnualFee { get; set; }

    [Required]
    public int DurationMonths { get; set; } = 12;

    public int MaxFamilyMembers { get; set; } = 1;

    public bool CanManageClubs { get; set; } = false;

    public bool CanManageEvents { get; set; } = false;

    public bool HasBoardVotingRights { get; set; } = false;

    public bool IsActive { get; set; } = true;

    public int DisplayOrder { get; set; } = 0;

    [MaxLength(50)]
    public string? Icon { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// MembershipDuration Entity - Defines available membership duration options
public class MembershipDuration
{
    [Key]
    public int DurationId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty; // e.g., "1 Year", "2 Years"

    [Required]
    public int Months { get; set; } // Duration in months

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// MembershipPayment Entity - Enhanced for payment tracking workflow
public class MembershipPayment
{
    [Key]
    public int PaymentId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int MembershipTypeId { get; set; }

    // Duration selected for this payment
    public int? DurationId { get; set; }

    [Required]
    [Column(TypeName = "decimal(10, 2)")]
    public decimal Amount { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

    [MaxLength(50)]
    public string PaymentMethod { get; set; } = "Zelle";

    [MaxLength(100)]
    public string? TransactionId { get; set; }

    // Payment status: Pending, Confirmed, Rejected
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Pending";

    // URL to uploaded proof of payment (image or PDF)
    [MaxLength(500)]
    public string? ProofOfPaymentUrl { get; set; }

    // For family memberships - tracks if this payment is for self only or includes family
    [MaxLength(50)]
    public string PaymentScope { get; set; } = "Self"; // Self, Family

    // Admin who confirmed the payment
    public int? ConfirmedBy { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    // If rejected, reason for rejection
    public string? RejectionReason { get; set; }

    // Membership validity period
    public DateTime ValidFrom { get; set; }

    public DateTime ValidUntil { get; set; }

    // For annual renewal tracking
    public int? RenewalOfPaymentId { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("MembershipTypeId")]
    public virtual MembershipType? MembershipType { get; set; }

    [ForeignKey("DurationId")]
    public virtual MembershipDuration? Duration { get; set; }

    [ForeignKey("ConfirmedBy")]
    public virtual User? ConfirmedByUser { get; set; }

    [ForeignKey("RenewalOfPaymentId")]
    public virtual MembershipPayment? RenewalOfPayment { get; set; }

    // Family members covered by this payment (stored as JSON array of user IDs)
    public string? CoveredFamilyMemberIds { get; set; }
}

// Club Entity
public class Club
{
    [Key]
    public int ClubId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    public DateTime? FoundedDate { get; set; }

    [MaxLength(200)]
    public string? MeetingSchedule { get; set; }

    [MaxLength(100)]
    public string? ContactEmail { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<ClubMembership> Memberships { get; set; } = new List<ClubMembership>();
    public virtual ICollection<ClubAdmin> Admins { get; set; } = new List<ClubAdmin>();
    public virtual ICollection<Event> HostedEvents { get; set; } = new List<Event>();
}

// ClubMembership Entity
public class ClubMembership
{
    [Key]
    public int MembershipId { get; set; }

    [Required]
    public int ClubId { get; set; }

    [Required]
    public int UserId { get; set; }

    public DateTime JoinedDate { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    // Navigation properties
    [ForeignKey("ClubId")]
    public virtual Club? Club { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}

// ClubAdmin Entity
public class ClubAdmin
{
    [Key]
    public int ClubAdminId { get; set; }

    [Required]
    public int ClubId { get; set; }

    [Required]
    public int UserId { get; set; }

    public DateTime AssignedDate { get; set; } = DateTime.UtcNow;

    public int? AssignedBy { get; set; }

    // Navigation properties
    [ForeignKey("ClubId")]
    public virtual Club? Club { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("AssignedBy")]
    public virtual User? AssignedByUser { get; set; }
}

// Event Entity
public class Event
{
    [Key]
    public int EventId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public DateTime EventDate { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    [MaxLength(50)]
    public string EventType { get; set; } = "CasecEvent";

    [MaxLength(100)]
    public string? EventCategory { get; set; }

    [MaxLength(50)]
    public string EventScope { get; set; } = "AllMembers";

    public int? HostClubId { get; set; }

    [MaxLength(200)]
    public string? PartnerName { get; set; }

    [MaxLength(500)]
    public string? PartnerLogo { get; set; }

    [MaxLength(500)]
    public string? PartnerWebsite { get; set; }

    [MaxLength(500)]
    public string? RegistrationUrl { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal EventFee { get; set; } = 0;

    public int MaxCapacity { get; set; } = 0;

    public bool IsRegistrationRequired { get; set; } = true;

    public bool IsFeatured { get; set; } = false;

    [MaxLength(500)]
    public string? ThumbnailUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("HostClubId")]
    public virtual Club? HostClub { get; set; }
}

// EventRegistration Entity
public class EventRegistration
{
    [Key]
    public int RegistrationId { get; set; }

    [Required]
    public int EventId { get; set; }

    [Required]
    public int UserId { get; set; }

    public int NumberOfGuests { get; set; } = 0;

    public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;

    [MaxLength(50)]
    public string PaymentStatus { get; set; } = "Pending";

    // Navigation properties
    [ForeignKey("EventId")]
    public virtual Event? Event { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}

// FamilyGroup Entity
public class FamilyGroup
{
    [Key]
    public int FamilyGroupId { get; set; }

    [Required]
    [MaxLength(200)]
    public string FamilyName { get; set; } = string.Empty;

    [Required]
    public int PrimaryUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("PrimaryUserId")]
    public virtual User? PrimaryUser { get; set; }

    public virtual ICollection<User> Members { get; set; } = new List<User>();
}

// ActivityLog Entity
public class ActivityLog
{
    [Key]
    public int LogId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string ActivityType { get; set; } = string.Empty;

    public string? Description { get; set; }

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}

// ThemeSettings Entity
public class ThemeSettings
{
    [Key]
    public int ThemeId { get; set; }

    [Required]
    [MaxLength(200)]
    public string OrganizationName { get; set; } = "CASEC";

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [MaxLength(500)]
    public string? FaviconUrl { get; set; }

    [Required]
    [MaxLength(50)]
    public string PrimaryColor { get; set; } = "#047857";

    [Required]
    [MaxLength(50)]
    public string PrimaryDarkColor { get; set; } = "#065f46";

    [Required]
    [MaxLength(50)]
    public string PrimaryLightColor { get; set; } = "#d1fae5";

    [Required]
    [MaxLength(50)]
    public string AccentColor { get; set; } = "#f59e0b";

    [Required]
    [MaxLength(50)]
    public string AccentDarkColor { get; set; } = "#d97706";

    [Required]
    [MaxLength(50)]
    public string AccentLightColor { get; set; } = "#fef3c7";

    [Required]
    [MaxLength(50)]
    public string SuccessColor { get; set; } = "#10b981";

    [Required]
    [MaxLength(50)]
    public string ErrorColor { get; set; } = "#ef4444";

    [Required]
    [MaxLength(50)]
    public string WarningColor { get; set; } = "#f59e0b";

    [Required]
    [MaxLength(50)]
    public string InfoColor { get; set; } = "#3b82f6";

    [Required]
    [MaxLength(50)]
    public string TextPrimaryColor { get; set; } = "#111827";

    [Required]
    [MaxLength(50)]
    public string TextSecondaryColor { get; set; } = "#6b7280";

    [Required]
    [MaxLength(50)]
    public string TextLightColor { get; set; } = "#f9fafb";

    [Required]
    [MaxLength(50)]
    public string BackgroundColor { get; set; } = "#ffffff";

    [Required]
    [MaxLength(50)]
    public string BackgroundSecondaryColor { get; set; } = "#f3f4f6";

    [Required]
    [MaxLength(50)]
    public string BorderColor { get; set; } = "#e5e7eb";

    [Required]
    [MaxLength(50)]
    public string ShadowColor { get; set; } = "#00000026";

    [Required]
    [MaxLength(200)]
    public string FontFamily { get; set; } = "Inter, system-ui, sans-serif";

    [Required]
    [MaxLength(200)]
    public string HeadingFontFamily { get; set; } = "Playfair Display, serif";

    public string? CustomCss { get; set; }

    public bool IsActive { get; set; } = true;

    public int? UpdatedBy { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey("UpdatedBy")]
    public virtual User? UpdatedByUser { get; set; }
}

// ThemePreset Entity
public class ThemePreset
{
    [Key]
    public int PresetId { get; set; }

    [Required]
    [MaxLength(100)]
    public string PresetName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string PrimaryColor { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string PrimaryDarkColor { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string PrimaryLightColor { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string AccentColor { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string AccentDarkColor { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string AccentLightColor { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? PreviewImage { get; set; }

    public bool IsDefault { get; set; } = false;
}

// Asset Entity - for tracking uploaded files
public class Asset
{
    [Key]
    public int FileId { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string OriginalFileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    public long FileSize { get; set; }

    [Required]
    [MaxLength(50)]
    public string StorageProvider { get; set; } = "Local";

    [Required]
    [MaxLength(1000)]
    public string StoragePath { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Folder { get; set; }

    [MaxLength(100)]
    public string? ObjectType { get; set; }

    public int? ObjectId { get; set; }

    public int? UploadedBy { get; set; }

    // Status: Public, Private, MembersOnly
    [MaxLength(50)]
    public string Status { get; set; } = "Private";

    // Sort order for displaying assets
    public int SortOrder { get; set; } = 0;

    // Optional caption/description for the asset
    [MaxLength(500)]
    public string? Caption { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;

    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    [ForeignKey("UploadedBy")]
    public virtual User? UploadedByUser { get; set; }
}

// FamilyMember Entity (for backward compatibility - use FamilyGroup for new features)
public class FamilyMember
{
    [Key]
    public int FamilyMemberId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    public DateTime? DateOfBirth { get; set; }

    [MaxLength(50)]
    public string? Relationship { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}
