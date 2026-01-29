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

    [MaxLength(100)]
    public string? ChineseName { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(30)]
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

    [MaxLength(500)]
    public string? Hobbies { get; set; }

    [MaxLength(4000)]
    public string? Bio { get; set; }

    // Personal info
    [MaxLength(20)]
    public string? Gender { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [MaxLength(30)]
    public string? MaritalStatus { get; set; }

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    // Board member fields
    public bool IsBoardMember { get; set; } = false;

    [MaxLength(100)]
    public string? BoardTitle { get; set; }

    public int? BoardDisplayOrder { get; set; }

    [MaxLength(4000)]
    public string? BoardBio { get; set; }

    [MaxLength(255)]
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

    public virtual ICollection<ClubMembership> ClubMemberships { get; set; } = new List<ClubMembership>();
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
    public string? EventType { get; set; } = "CasecEvent";

    [MaxLength(100)]
    public string? EventCategory { get; set; }

    [MaxLength(50)]
    public string? EventScope { get; set; } = "AllMembers";

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
    public decimal? EventFee { get; set; } = 0;

    public int? MaxCapacity { get; set; } = 0;

    public bool? IsRegistrationRequired { get; set; } = true;

    public bool? IsFeatured { get; set; } = false;

    [MaxLength(500)]
    public string? ThumbnailUrl { get; set; }

    // Focus point for thumbnail cropping (0-100 percentage, default 50,50 = center)
    public int? ThumbnailFocusX { get; set; } = 50;
    public int? ThumbnailFocusY { get; set; } = 50;

    [MaxLength(1000)]
    public string? SourceUrl { get; set; }

    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

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

    [MaxLength(500)]
    public string? HomeQuote { get; set; }

    [MaxLength(500)]
    public string? HomeQuoteSubtext { get; set; }

    // Hero video URLs (JSON array of YouTube/TikTok URLs)
    public string? HeroVideoUrls { get; set; }

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

// PasswordResetToken Entity
public class PasswordResetToken
{
    [Key]
    public int TokenId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Token { get; set; } = string.Empty;

    [Required]
    public DateTime ExpiresAt { get; set; }

    public bool IsUsed { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}

// EventType Entity - Configurable event types managed by admin
public class EventType
{
    [Key]
    public int EventTypeId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty; // e.g., "CasecEvent", "PartnerEvent"

    [Required]
    [MaxLength(100)]
    public string DisplayName { get; set; } = string.Empty; // e.g., "CASEC Event"

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Icon { get; set; } // Lucide icon name

    [MaxLength(20)]
    public string? Color { get; set; } // Tailwind color class or hex

    public bool AllowsRegistration { get; set; } = true;

    public bool IsActive { get; set; } = true;

    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// Poll Entity - For collecting feedback from visitors and members
public class Poll
{
    [Key]
    public int PollId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Question { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    // Poll type: SingleChoice, MultipleChoice, Rating, Text
    [Required]
    [MaxLength(50)]
    public string PollType { get; set; } = "SingleChoice";

    // Who can respond: Anyone, MembersOnly
    [Required]
    [MaxLength(50)]
    public string Visibility { get; set; } = "Anyone";

    // Allow anonymous responses from logged-in members
    public bool AllowAnonymous { get; set; } = true;

    // Show results to voters after they vote
    public bool ShowResultsToVoters { get; set; } = true;

    // Allow changing vote
    public bool AllowChangeVote { get; set; } = false;

    // Maximum selections for MultipleChoice
    public int? MaxSelections { get; set; }

    // For Rating type: min and max values
    public int? RatingMin { get; set; } = 1;
    public int? RatingMax { get; set; } = 5;

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    // Status: Draft, Active, Closed
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";

    public bool IsFeatured { get; set; } = false;

    public int DisplayOrder { get; set; } = 0;

    public int? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("CreatedBy")]
    public virtual User? CreatedByUser { get; set; }

    public virtual ICollection<PollOption> Options { get; set; } = new List<PollOption>();
    public virtual ICollection<PollResponse> Responses { get; set; } = new List<PollResponse>();
}

// PollOption Entity - Options for polls
public class PollOption
{
    [Key]
    public int OptionId { get; set; }

    [Required]
    public int PollId { get; set; }

    [Required]
    [MaxLength(500)]
    public string OptionText { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("PollId")]
    public virtual Poll? Poll { get; set; }
}

// PollResponse Entity - Responses/votes for polls
public class PollResponse
{
    [Key]
    public int ResponseId { get; set; }

    [Required]
    public int PollId { get; set; }

    // For SingleChoice/MultipleChoice - the selected option(s)
    // Stored as comma-separated option IDs for multiple choice
    public string? SelectedOptionIds { get; set; }

    // For Rating type
    public int? RatingValue { get; set; }

    // For Text type
    [MaxLength(4000)]
    public string? TextResponse { get; set; }

    // User who responded (null for anonymous visitors)
    public int? UserId { get; set; }

    // If user chose to be anonymous (only for logged-in users)
    public bool IsAnonymous { get; set; } = false;

    // For tracking anonymous/visitor responses
    [MaxLength(100)]
    public string? SessionId { get; set; }

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    public DateTime RespondedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("PollId")]
    public virtual Poll? Poll { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}

// Survey Entity - Multi-question surveys for collecting detailed feedback
public class Survey
{
    [Key]
    public int SurveyId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    // Who can respond: Anyone, MembersOnly
    [Required]
    [MaxLength(50)]
    public string Visibility { get; set; } = "Anyone";

    // Allow anonymous responses from logged-in members
    public bool AllowAnonymous { get; set; } = true;

    // Show results to respondents after completing
    public bool ShowResultsToRespondents { get; set; } = false;

    // Allow editing responses after submission
    public bool AllowEditResponse { get; set; } = false;

    // Require all questions to be answered
    public bool RequireAllQuestions { get; set; } = false;

    // Show progress indicator
    public bool ShowProgressBar { get; set; } = true;

    // Randomize question order
    public bool RandomizeQuestions { get; set; } = false;

    // Limit one response per user/session
    public bool OneResponsePerUser { get; set; } = true;

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    // Status: Draft, Active, Closed
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";

    public bool IsFeatured { get; set; } = false;

    public int DisplayOrder { get; set; } = 0;

    // Thank you message shown after completion
    [MaxLength(1000)]
    public string? ThankYouMessage { get; set; }

    // Redirect URL after completion (optional)
    [MaxLength(500)]
    public string? RedirectUrl { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("CreatedBy")]
    public virtual User? CreatedByUser { get; set; }

    public virtual ICollection<SurveyQuestion> Questions { get; set; } = new List<SurveyQuestion>();
    public virtual ICollection<SurveyResponse> Responses { get; set; } = new List<SurveyResponse>();
}

// SurveyQuestion Entity - Individual questions within a survey
public class SurveyQuestion
{
    [Key]
    public int QuestionId { get; set; }

    [Required]
    public int SurveyId { get; set; }

    [Required]
    [MaxLength(1000)]
    public string QuestionText { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? HelpText { get; set; }

    // Question type: SingleChoice, MultipleChoice, Rating, Text, TextArea, Number, Date, Email, Phone
    [Required]
    [MaxLength(50)]
    public string QuestionType { get; set; } = "SingleChoice";

    // Is this question required?
    public bool IsRequired { get; set; } = false;

    // Options for SingleChoice/MultipleChoice (stored as JSON array)
    public string? Options { get; set; }

    // Maximum selections for MultipleChoice
    public int? MaxSelections { get; set; }

    // For Rating type: min and max values
    public int? RatingMin { get; set; } = 1;
    public int? RatingMax { get; set; } = 5;

    // For Rating type: labels
    [MaxLength(100)]
    public string? RatingMinLabel { get; set; }

    [MaxLength(100)]
    public string? RatingMaxLabel { get; set; }

    // For Text/TextArea: character limits
    public int? MinLength { get; set; }
    public int? MaxLength { get; set; }

    // For Number type: min/max values
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }

    // Placeholder text for text inputs
    [MaxLength(200)]
    public string? Placeholder { get; set; }

    // Display order within the survey
    public int DisplayOrder { get; set; } = 0;

    // Conditional display: show only if another question has specific answer
    public int? ConditionalOnQuestionId { get; set; }
    public string? ConditionalOnValues { get; set; } // JSON array of values that trigger display

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("SurveyId")]
    public virtual Survey? Survey { get; set; }

    [ForeignKey("ConditionalOnQuestionId")]
    public virtual SurveyQuestion? ConditionalOnQuestion { get; set; }
}

// SurveyResponse Entity - A user's submission of a survey
public class SurveyResponse
{
    [Key]
    public int ResponseId { get; set; }

    [Required]
    public int SurveyId { get; set; }

    // User who responded (null for anonymous visitors)
    public int? UserId { get; set; }

    // If user chose to be anonymous (only for logged-in users)
    public bool IsAnonymous { get; set; } = false;

    // For tracking anonymous/visitor responses
    [MaxLength(100)]
    public string? SessionId { get; set; }

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    // Status: InProgress, Completed
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "InProgress";

    // Current question index (for tracking progress)
    public int CurrentQuestionIndex { get; set; } = 0;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("SurveyId")]
    public virtual Survey? Survey { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    public virtual ICollection<SurveyAnswer> Answers { get; set; } = new List<SurveyAnswer>();
}

// PaymentMethod Entity - Configurable payment methods for membership payments
public class PaymentMethod
{
    [Key]
    public int PaymentMethodId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty; // e.g., "Zelle", "Check", "Cash"

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty; // Display name

    [MaxLength(2000)]
    public string? Instructions { get; set; } // Payment instructions shown to users

    [MaxLength(50)]
    public string? Icon { get; set; } // Lucide icon name

    public bool IsActive { get; set; } = true;

    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// SurveyAnswer Entity - Individual answers to questions within a response
public class SurveyAnswer
{
    [Key]
    public int AnswerId { get; set; }

    [Required]
    public int ResponseId { get; set; }

    [Required]
    public int QuestionId { get; set; }

    // For SingleChoice - the selected option
    [MaxLength(1000)]
    public string? SelectedOption { get; set; }

    // For MultipleChoice - selected options (JSON array)
    public string? SelectedOptions { get; set; }

    // For Rating type
    public int? RatingValue { get; set; }

    // For Text, TextArea, Email, Phone types
    [MaxLength(4000)]
    public string? TextValue { get; set; }

    // For Number type
    public decimal? NumberValue { get; set; }

    // For Date type
    public DateTime? DateValue { get; set; }

    public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ResponseId")]
    public virtual SurveyResponse? Response { get; set; }

    [ForeignKey("QuestionId")]
    public virtual SurveyQuestion? Question { get; set; }
}

// ============ SLIDESHOW ENTITIES ============

// SlideShow Entity - A collection of slides that can be played as an intro/presentation
public class SlideShow
{
    [Key]
    public int SlideShowId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty; // Unique identifier, e.g., "home-intro"

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    [MaxLength(50)]
    public string TransitionType { get; set; } = "fade"; // fade, slide, zoom, etc.

    public int TransitionDuration { get; set; } = 500; // milliseconds

    public int DefaultSlideInterval { get; set; } = 5000; // milliseconds

    public bool ShowProgress { get; set; } = true; // Show progress dots/bar

    public bool AllowSkip { get; set; } = true;

    public bool Loop { get; set; } = false;

    public bool AutoPlay { get; set; } = true;

    public int? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("CreatedBy")]
    public virtual User? CreatedByUser { get; set; }

    public virtual ICollection<Slide> Slides { get; set; } = new List<Slide>();
}

// ============ RAFFLE ENTITIES ============

// Raffle Entity - Main raffle configuration
public class Raffle
{
    [Key]
    public int RaffleId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    // Status: Draft, Active, Drawing, Completed, Cancelled
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";

    // Drawing configuration
    public int TicketDigits { get; set; } = 6; // Number of digits in ticket numbers

    public int NextTicketNumber { get; set; } = 1; // Next ticket number to assign

    public int TotalTicketsSold { get; set; } = 0;

    [Column(TypeName = "decimal(10, 2)")]
    public decimal TotalRevenue { get; set; } = 0;

    // Drawing state
    public int? WinningNumber { get; set; }

    [MaxLength(20)]
    public string? RevealedDigits { get; set; } // Digits revealed so far during drawing

    // Dates
    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public DateTime? DrawingDate { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("CreatedBy")]
    public virtual User? CreatedByUser { get; set; }

    public virtual ICollection<RafflePrize> Prizes { get; set; } = new List<RafflePrize>();

    public virtual ICollection<RaffleTicketTier> TicketTiers { get; set; } = new List<RaffleTicketTier>();

    public virtual ICollection<RaffleParticipant> Participants { get; set; } = new List<RaffleParticipant>();
}

// Slide Entity - Individual slide within a slideshow
public class Slide
{
    [Key]
    public int SlideId { get; set; }

    [Required]
    public int SlideShowId { get; set; }

    public int DisplayOrder { get; set; } = 0;

    public int Duration { get; set; } = 5000; // Total slide duration in ms

    // ========== NEW: Background Settings (Object-Oriented Approach) ==========
    // Background type: none, color, image, heroVideos
    [MaxLength(20)]
    public string BackgroundType { get; set; } = "heroVideos";

    [MaxLength(50)]
    public string? BackgroundColor { get; set; } // Used when BackgroundType = "color"

    [MaxLength(500)]
    public string? BackgroundImageUrl { get; set; } // Used when BackgroundType = "image"

    // If true, ignore SlideBackgroundVideos and pick random videos from shared pool
    public bool UseRandomHeroVideos { get; set; } = false;

    // ========== LEGACY: Video background (kept for backwards compatibility) ==========
    [MaxLength(500)]
    public string? VideoUrl { get; set; } // Specific video URL, or null to use random from pool

    public bool UseRandomVideo { get; set; } = false; // If true, pick random from shared pool

    // Layout & styling
    [MaxLength(20)]
    public string Layout { get; set; } = "center"; // center, left, right, split

    [MaxLength(20)]
    public string OverlayType { get; set; } = "dark"; // dark, light, gradient, none

    [MaxLength(50)]
    public string? OverlayColor { get; set; } // Custom overlay color (optional)

    public int OverlayOpacity { get; set; } = 50; // 0-100

    // ========== LEGACY: Title/Subtitle (use SlideObjects with ObjectType="text" instead) ==========
    [Obsolete("Use SlideObjects with ObjectType='text' instead")]
    [MaxLength(500)]
    public string? TitleText { get; set; }

    [Obsolete("Use SlideObjects with ObjectType='text' instead")]
    [MaxLength(50)]
    public string TitleAnimation { get; set; } = "fadeIn";

    [Obsolete("Use SlideObjects with ObjectType='text' instead")]
    public int TitleDuration { get; set; } = 800;

    [Obsolete("Use SlideObjects with ObjectType='text' instead")]
    public int TitleDelay { get; set; } = 500;

    [Obsolete("Use SlideObjects with ObjectType='text' instead")]
    [MaxLength(20)]
    public string? TitleSize { get; set; } = "large";

    [Obsolete("Use SlideObjects with ObjectType='text' instead")]
    [MaxLength(50)]
    public string? TitleColor { get; set; }

    [Obsolete("Use SlideObjects with ObjectType='text' instead")]
    [MaxLength(500)]
    public string? SubtitleText { get; set; }

    [Obsolete("Use SlideObjects with ObjectType='text' instead")]
    [MaxLength(50)]
    public string SubtitleAnimation { get; set; } = "fadeIn";

    [Obsolete("Use SlideObjects with ObjectType='text' instead")]
    public int SubtitleDuration { get; set; } = 600;

    [Obsolete("Use SlideObjects with ObjectType='text' instead")]
    public int SubtitleDelay { get; set; } = 1200;

    [Obsolete("Use SlideObjects with ObjectType='text' instead")]
    [MaxLength(20)]
    public string? SubtitleSize { get; set; } = "medium";

    [Obsolete("Use SlideObjects with ObjectType='text' instead")]
    [MaxLength(50)]
    public string? SubtitleColor { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("SlideShowId")]
    public virtual SlideShow? SlideShow { get; set; }

    // Legacy collections (kept for backwards compatibility)
    public virtual ICollection<SlideImage> Images { get; set; } = new List<SlideImage>();
    public virtual ICollection<SlideText> Texts { get; set; } = new List<SlideText>();

    // NEW: Object-oriented collections
    public virtual ICollection<SlideObject> Objects { get; set; } = new List<SlideObject>();
    public virtual ICollection<SlideBackgroundVideo> BackgroundVideos { get; set; } = new List<SlideBackgroundVideo>();
}

// SlideImage Entity - Images displayed within a slide
public class SlideImage
{
    [Key]
    public int SlideImageId { get; set; }

    [Required]
    public int SlideId { get; set; }

    [Required]
    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty; // Can be from shared pool or direct URL

    public int DisplayOrder { get; set; } = 0;

    // Position & size
    [MaxLength(30)]
    public string Position { get; set; } = "center"; // center, left, right, bottom-left, bottom-right, top-left, top-right

    [MaxLength(20)]
    public string Size { get; set; } = "medium"; // small, medium, large, full, maximum

    [MaxLength(20)]
    public string Orientation { get; set; } = "auto"; // auto, portrait, landscape

    // Animation
    [MaxLength(50)]
    public string Animation { get; set; } = "fadeIn"; // fadeIn, zoomIn, slideInLeft, slideInRight, bounce

    public int Duration { get; set; } = 500; // Animation duration in ms

    public int Delay { get; set; } = 1500; // Delay before animation starts

    // Optional styling
    [MaxLength(50)]
    public string? BorderRadius { get; set; } // e.g., "rounded-lg", "rounded-full"

    [MaxLength(50)]
    public string? Shadow { get; set; } // e.g., "shadow-lg", "shadow-2xl"

    public int? Opacity { get; set; } // 0-100

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("SlideId")]
    public virtual Slide? Slide { get; set; }
}

// RafflePrize Entity - Prizes available in a raffle
public class RafflePrize
{
    [Key]
    public int PrizeId { get; set; }

    [Required]
    public int RaffleId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? Value { get; set; }

    // Display order (lower = shown first)
    public int DisplayOrder { get; set; } = 0;

    public bool IsGrandPrize { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("RaffleId")]
    public virtual Raffle? Raffle { get; set; }
}

// SlideText Entity - Text elements displayed within a slide
public class SlideText
{
    [Key]
    public int SlideTextId { get; set; }

    [Required]
    public int SlideId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Text { get; set; } = string.Empty;

    public int DisplayOrder { get; set; } = 0;

    // Position - split into horizontal and vertical
    [MaxLength(20)]
    public string HorizontalPosition { get; set; } = "center"; // left, center, right

    [MaxLength(20)]
    public string VerticalPosition { get; set; } = "center"; // top, center, bottom

    // Text styling
    [MaxLength(20)]
    public string Size { get; set; } = "large"; // small, medium, large, xlarge

    [MaxLength(50)]
    public string? Color { get; set; } = "#ffffff";

    [MaxLength(100)]
    public string? FontFamily { get; set; }

    // Animation
    [MaxLength(50)]
    public string Animation { get; set; } = "fadeIn"; // fadeIn, slideUp, slideDown, zoomIn, typewriter

    public int Duration { get; set; } = 800; // Animation duration in ms

    public int Delay { get; set; } = 500; // Delay before animation starts

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("SlideId")]
    public virtual Slide? Slide { get; set; }
}

// SharedVideo Entity - Pool of videos that can be used across slideshows
public class SharedVideo
{
    [Key]
    public int VideoId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(500)]
    public string? ThumbnailUrl { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; } // For grouping/filtering

    public bool IsActive { get; set; } = true;

    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// SharedImage Entity - Pool of images that can be used across slideshows
public class SharedImage
{
    [Key]
    public int ImageId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(500)]
    public string? ThumbnailUrl { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; } // For grouping/filtering

    public bool IsActive { get; set; } = true;

    [MaxLength(50)]
    public string Status { get; set; } = "Active"; // Active, Pending, Deleted

    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// SlideObject Entity - Unified object for Text, Image, or Video on a slide
// This is the new object-oriented approach for slide content
public class SlideObject
{
    [Key]
    public int SlideObjectId { get; set; }

    [Required]
    public int SlideId { get; set; }

    // Object type: "text", "image", "video"
    [Required]
    [MaxLength(20)]
    public string ObjectType { get; set; } = "text";

    public int SortOrder { get; set; } = 0;

    // Name/Code for identification in the admin UI
    [MaxLength(100)]
    public string? Name { get; set; }

    // Position - horizontal and vertical alignment
    [MaxLength(20)]
    public string HorizontalAlign { get; set; } = "center"; // left, center, right

    [MaxLength(20)]
    public string VerticalAlign { get; set; } = "middle"; // top, middle, bottom

    // Position offsets in pixels (can be negative)
    public int OffsetX { get; set; } = 0;
    public int OffsetY { get; set; } = 0;

    // Animation In (entry animation)
    [MaxLength(50)]
    public string AnimationIn { get; set; } = "fadeIn";

    public int AnimationInDelay { get; set; } = 0; // ms from slide start

    public int AnimationInDuration { get; set; } = 500; // ms

    // Animation Out (exit animation) - null means stay on screen
    [MaxLength(50)]
    public string? AnimationOut { get; set; }

    public int? AnimationOutDelay { get; set; } // ms from slide start when exit begins

    public int? AnimationOutDuration { get; set; } // ms

    public bool StayOnScreen { get; set; } = true; // if true, no exit animation

    // Type-specific properties stored as JSON
    // Text: { "content": "", "fontSize": "large", "fontWeight": "bold", "fontFamily": "", "color": "#fff", "backgroundColor": "", "textAlign": "center", "maxWidth": 800 }
    // Image: { "imageUrl": "", "size": "medium", "objectFit": "cover", "borderRadius": "rounded-lg", "shadow": "", "opacity": 100 }
    // Video: { "videoUrl": "", "size": "medium", "autoPlay": true, "muted": true, "loop": true, "showControls": false, "borderRadius": "rounded-lg" }
    public string? Properties { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("SlideId")]
    public virtual Slide? Slide { get; set; }
}

// RaffleTicketTier Entity - Pricing tiers for ticket purchases
public class RaffleTicketTier
{
    [Key]
    public int TierId { get; set; }

    [Required]
    public int RaffleId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty; // e.g., "Basic", "Value Pack", "Super Saver"

    [Required]
    [Column(TypeName = "decimal(10, 2)")]
    public decimal Price { get; set; }

    [Required]
    public int TicketCount { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    // Display order (lower = shown first)
    public int DisplayOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public bool IsFeatured { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("RaffleId")]
    public virtual Raffle? Raffle { get; set; }
}

// RaffleParticipant Entity - People who register and purchase tickets
public class RaffleParticipant
{
    [Key]
    public int ParticipantId { get; set; }

    [Required]
    public int RaffleId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    // OTP verification
    [MaxLength(10)]
    public string? OtpCode { get; set; }

    public DateTime? OtpExpiresAt { get; set; }

    public bool IsVerified { get; set; } = false;

    public DateTime? VerifiedAt { get; set; }

    // Ticket range assigned to this participant
    public int? TicketStart { get; set; }

    public int? TicketEnd { get; set; }

    public int TotalTickets { get; set; } = 0;

    // Payment tracking
    [Column(TypeName = "decimal(10, 2)")]
    public decimal TotalPaid { get; set; } = 0;

    // PaymentStatus: Pending, Confirmed, Refunded
    [MaxLength(50)]
    public string PaymentStatus { get; set; } = "Pending";

    [MaxLength(100)]
    public string? PaymentMethod { get; set; }

    [MaxLength(100)]
    public string? TransactionId { get; set; }

    public DateTime? PaymentDate { get; set; }

    // Is this participant a winner?
    public bool IsWinner { get; set; } = false;

    // Unique session token for the participant (used for unauthenticated access)
    [MaxLength(100)]
    public string? SessionToken { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("RaffleId")]
    public virtual Raffle? Raffle { get; set; }
}

// SlideBackgroundVideo Entity - Hero videos for a slide's background sequence
public class SlideBackgroundVideo
{
    [Key]
    public int SlideBackgroundVideoId { get; set; }

    [Required]
    public int SlideId { get; set; }

    // Reference to SharedVideo (optional - can use direct URL instead)
    public int? VideoId { get; set; }

    // Direct video URL if not using SharedVideo reference
    [MaxLength(500)]
    public string? VideoUrl { get; set; }

    // How long to display this video before moving to next (in ms)
    public int Duration { get; set; } = 5000;

    public int SortOrder { get; set; } = 0;

    // If true, pick a random video from the shared pool for this slot
    public bool UseRandom { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("SlideId")]
    public virtual Slide? Slide { get; set; }

    [ForeignKey("VideoId")]
    public virtual SharedVideo? Video { get; set; }
}

// ============ EVENT PROGRAM ENTITIES ============

// EventProgram Entity - Main event (e.g., "2026 佛罗里达华人春晚")
public class EventProgram
{
    [Key]
    public int ProgramId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty; // Legacy: keep for backwards compatibility

    // Bilingual title
    [MaxLength(200)]
    public string? TitleZh { get; set; }

    [MaxLength(200)]
    public string? TitleEn { get; set; }

    [MaxLength(200)]
    public string? Subtitle { get; set; } // Legacy: keep for backwards compatibility

    // Bilingual subtitle
    [MaxLength(200)]
    public string? SubtitleZh { get; set; }

    [MaxLength(200)]
    public string? SubtitleEn { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; } // Legacy: keep for backwards compatibility

    // Bilingual description
    public string? DescriptionZh { get; set; }

    public string? DescriptionEn { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; } // Cover image for the program

    // Event details
    public DateTime? EventDate { get; set; }

    [MaxLength(200)]
    public string? Venue { get; set; }

    [MaxLength(500)]
    public string? VenueAddress { get; set; }

    // Link to slideshows to display on the page
    // Stored as JSON array of slideshow IDs: [1, 2, 3]
    public string? SlideShowIds { get; set; }

    // Page styling - color themes stored as JSON array
    // Each theme: { "name": "Theme Name", "primary": "#hex", "bgFrom": "#hex", "bgVia": "#hex", "bgTo": "#hex" }
    public string? ColorThemes { get; set; }

    // Whether to show the cover image as background
    public bool ShowBackgroundImage { get; set; } = false;

    // Status: Draft, Published, Archived
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";

    public bool IsFeatured { get; set; } = false;

    // URL slug for the program page (e.g., "2026-spring-gala")
    [MaxLength(100)]
    public string? Slug { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("CreatedBy")]
    public virtual User? CreatedByUser { get; set; }

    public virtual ICollection<ProgramSection> Sections { get; set; } = new List<ProgramSection>();
}

// ProgramSection Entity - Sections like "开场", "第一乐章", etc.
public class ProgramSection
{
    [Key]
    public int SectionId { get; set; }

    [Required]
    public int ProgramId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty; // Legacy: keep for backwards compatibility

    // Bilingual title
    [MaxLength(200)]
    public string? TitleZh { get; set; }

    [MaxLength(200)]
    public string? TitleEn { get; set; }

    [MaxLength(500)]
    public string? Subtitle { get; set; } // Legacy: keep for backwards compatibility

    // Bilingual subtitle
    [MaxLength(500)]
    public string? SubtitleZh { get; set; }

    [MaxLength(500)]
    public string? SubtitleEn { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; } // Legacy: keep for backwards compatibility

    // Bilingual description
    public string? DescriptionZh { get; set; }

    public string? DescriptionEn { get; set; }

    public int DisplayOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ProgramId")]
    public virtual EventProgram? Program { get; set; }

    public virtual ICollection<ProgramItem> Items { get; set; } = new List<ProgramItem>();
}

// ProgramItem Entity - Individual performances/items
public class ProgramItem
{
    [Key]
    public int ItemId { get; set; }

    [Required]
    public int SectionId { get; set; }

    // Item number within the section (e.g., 1, 2, 3)
    public int ItemNumber { get; set; } = 1;

    [Required]
    [MaxLength(300)]
    public string Title { get; set; } = string.Empty; // Legacy: keep for backwards compatibility

    // Bilingual title
    [MaxLength(300)]
    public string? TitleZh { get; set; }

    [MaxLength(300)]
    public string? TitleEn { get; set; }

    // Performance type (e.g., "芭蕾舞", "独唱", "现代舞/Hiphop", "古典舞")
    [MaxLength(100)]
    public string? PerformanceType { get; set; } // Legacy: keep for backwards compatibility

    // Bilingual performance type
    [MaxLength(100)]
    public string? PerformanceTypeZh { get; set; }

    [MaxLength(100)]
    public string? PerformanceTypeEn { get; set; }

    // Performer name(s) - can be a single name or multiple
    [MaxLength(500)]
    public string? PerformerNames { get; set; } // e.g., "杨心灵 Lynn Young"

    // Second performer (optional)
    [MaxLength(500)]
    public string? PerformerNames2 { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; } // Legacy: keep for backwards compatibility

    // Bilingual description
    public string? DescriptionZh { get; set; }

    public string? DescriptionEn { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    // Link to detailed content page for this item (if available)
    public int? ContentPageId { get; set; }

    public int DisplayOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    // Duration in minutes (optional)
    public int? DurationMinutes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("SectionId")]
    public virtual ProgramSection? Section { get; set; }

    [ForeignKey("ContentPageId")]
    public virtual ProgramContent? ContentPage { get; set; }

    public virtual ICollection<ProgramItemPerformer> Performers { get; set; } = new List<ProgramItemPerformer>();
}

// ProgramItemPerformer Entity - Links items to performers (many-to-many)
public class ProgramItemPerformer
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ItemId { get; set; }

    [Required]
    public int PerformerId { get; set; }

    public int DisplayOrder { get; set; } = 0;

    // Role in this item (e.g., "Lead", "Supporting", "Accompanist")
    [MaxLength(100)]
    public string? Role { get; set; }

    // Navigation properties
    [ForeignKey("ItemId")]
    public virtual ProgramItem? Item { get; set; }

    [ForeignKey("PerformerId")]
    public virtual Performer? Performer { get; set; }
}

// Performer Entity - Detailed info about performers
public class Performer
{
    [Key]
    public int PerformerId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? ChineseName { get; set; }

    [MaxLength(200)]
    public string? EnglishName { get; set; }

    [MaxLength(4000)]
    public string? Bio { get; set; } // Legacy: keep for backwards compatibility

    // Bilingual bio
    public string? BioZh { get; set; }

    public string? BioEn { get; set; }

    [MaxLength(500)]
    public string? PhotoUrl { get; set; }

    // Social media links
    [MaxLength(500)]
    public string? Website { get; set; }

    [MaxLength(200)]
    public string? Instagram { get; set; }

    [MaxLength(200)]
    public string? YouTube { get; set; }

    // Link to detailed content page (if available)
    public int? ContentPageId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ContentPageId")]
    public virtual ProgramContent? ContentPage { get; set; }

    public virtual ICollection<ProgramItemPerformer> ProgramItems { get; set; } = new List<ProgramItemPerformer>();
}

// ContentCard Entity - Cards with rich content attached to program items or performers
public class ContentCard
{
    [Key]
    public int CardId { get; set; }

    // Entity association (polymorphic: "ProgramItem" or "Performer")
    [Required]
    [MaxLength(50)]
    public string EntityType { get; set; } = "ProgramItem";

    [Required]
    public int EntityId { get; set; }

    // Bilingual title
    [MaxLength(200)]
    public string? TitleZh { get; set; }

    [MaxLength(200)]
    public string? TitleEn { get; set; }

    // Bilingual body text
    public string? BodyTextZh { get; set; }

    public string? BodyTextEn { get; set; }

    // Media
    [MaxLength(500)]
    public string? MediaUrl { get; set; }

    [Required]
    [MaxLength(20)]
    public string MediaType { get; set; } = "image"; // "image" or "video"

    // Layout: "left", "right", "top", "bottom", "overlay", "fullwidth"
    [Required]
    [MaxLength(20)]
    public string LayoutType { get; set; } = "left";

    // Aspect ratio for media: "original", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"
    [MaxLength(20)]
    public string? AspectRatio { get; set; } = "original";

    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// ProgramContent Entity - Rich content pages for programs, items, or performers
public class ProgramContent
{
    [Key]
    public int ContentId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Slug { get; set; } // URL-friendly identifier

    // Content type: "Program", "Performance", "Performer", "General"
    [Required]
    [MaxLength(50)]
    public string ContentType { get; set; } = "General";

    // Rich HTML content
    public string? Content { get; set; }

    // Featured image
    [MaxLength(500)]
    public string? FeaturedImageUrl { get; set; }

    // Gallery images (stored as JSON array of URLs)
    public string? GalleryImages { get; set; }

    // Videos (stored as JSON array of URLs/embeds)
    public string? Videos { get; set; }

    // Related slideshow (optional)
    public int? SlideShowId { get; set; }

    // Status: Draft, Published, Archived
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Draft";

    // SEO metadata
    [MaxLength(200)]
    public string? MetaTitle { get; set; }

    [MaxLength(500)]
    public string? MetaDescription { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("CreatedBy")]
    public virtual User? CreatedByUser { get; set; }

    [ForeignKey("SlideShowId")]
    public virtual SlideShow? SlideShow { get; set; }
}

// ============ ROLE-BASED ACCESS CONTROL ============

// Role Entity
public class Role
{
    [Key]
    public int RoleId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsSystem { get; set; } = false;  // System roles cannot be deleted

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<RoleAreaPermission>? AreaPermissions { get; set; }
    public virtual ICollection<UserRole>? UserRoles { get; set; }
}

// Admin Area Entity
public class AdminArea
{
    [Key]
    public int AreaId { get; set; }

    [Required]
    [MaxLength(50)]
    public string AreaKey { get; set; } = string.Empty;  // Unique key (e.g., 'users', 'events')

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;  // Display name

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Category { get; set; }  // Category for grouping

    [MaxLength(50)]
    public string? IconName { get; set; }

    [MaxLength(200)]
    public string? Route { get; set; }  // Admin route path

    public int DisplayOrder { get; set; } = 0;

    // Navigation properties
    public virtual ICollection<RoleAreaPermission>? RolePermissions { get; set; }
}

// Role Area Permission Entity (which roles can access which areas)
public class RoleAreaPermission
{
    [Key]
    public int PermissionId { get; set; }

    public int RoleId { get; set; }

    public int AreaId { get; set; }

    public bool CanView { get; set; } = true;

    public bool CanEdit { get; set; } = false;

    public bool CanDelete { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("RoleId")]
    public virtual Role? Role { get; set; }

    [ForeignKey("AreaId")]
    public virtual AdminArea? Area { get; set; }
}

// User Role Entity (which users have which roles)
public class UserRole
{
    [Key]
    public int UserRoleId { get; set; }

    public int UserId { get; set; }

    public int RoleId { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public int? AssignedBy { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("RoleId")]
    public virtual Role? Role { get; set; }

    [ForeignKey("AssignedBy")]
    public virtual User? AssignedByUser { get; set; }
}
