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
