namespace CasecApi.Models.DTOs;

// Auth DTOs
public class RegisterRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Profession { get; set; }
    public string? Hobbies { get; set; }
    public string? Bio { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? MaritalStatus { get; set; }
    public int MembershipTypeId { get; set; }
    public List<FamilyMemberDto>? FamilyMembers { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

// User DTOs
public class UserDto
{
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? ChineseName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Profession { get; set; }
    public string? Hobbies { get; set; }
    public string? Bio { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? MaritalStatus { get; set; }
    public string? AvatarUrl { get; set; }
    public int MembershipTypeId { get; set; }
    public string MembershipTypeName { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public bool IsBoardMember { get; set; }
    public string? BoardTitle { get; set; }
    public int? BoardDisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime MemberSince { get; set; }
    public List<int> ClubIds { get; set; } = new();
    public List<FamilyMemberDto>? FamilyMembers { get; set; }
}

public class UserListDto
{
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? MembershipTypeName { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsActive { get; set; }
    public DateTime MemberSince { get; set; }
}

public class UpdateProfileRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? ChineseName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Profession { get; set; }
    public string? Hobbies { get; set; }
    public string? Bio { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? MaritalStatus { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? TwitterHandle { get; set; }
}

public class FamilyMemberDto
{
    public int? FamilyMemberId { get; set; }
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Relationship { get; set; }
    public string RelationshipToPrimary { get; set; } = "Member";
    public bool IsPrimary { get; set; }
    public string? MembershipType { get; set; }
}

// Membership Type DTOs
public class MembershipTypeDto
{
    public int MembershipTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal AnnualFee { get; set; }
    public int MaxFamilyMembers { get; set; }
    public bool CanManageClubs { get; set; }
    public bool CanManageEvents { get; set; }
    public bool HasBoardVotingRights { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
    public string? Icon { get; set; }
}

public class CreateMembershipTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal AnnualFee { get; set; }
    public int MaxFamilyMembers { get; set; } = 1;
    public bool CanManageClubs { get; set; } = false;
    public bool CanManageEvents { get; set; } = false;
    public bool HasBoardVotingRights { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
    public string? Icon { get; set; }
}

public class UpdateMembershipTypeRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public decimal? AnnualFee { get; set; }
    public int? MaxFamilyMembers { get; set; }
    public bool? CanManageClubs { get; set; }
    public bool? CanManageEvents { get; set; }
    public bool? HasBoardVotingRights { get; set; }
    public bool? IsActive { get; set; }
    public int? DisplayOrder { get; set; }
    public string? Icon { get; set; }
}

// Club DTOs
public class ClubDto
{
    public int ClubId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime? FoundedDate { get; set; }
    public string? MeetingSchedule { get; set; }
    public string? ContactEmail { get; set; }
    public string? Icon { get; set; }
    public string? MeetingFrequency { get; set; }
    public string? MeetingDay { get; set; }
    public TimeSpan? MeetingTime { get; set; }
    public string? Location { get; set; }
    public int? MaxMembers { get; set; }
    public int MemberCount { get; set; }
    public int TotalMembers { get; set; }
    public bool IsActive { get; set; }
    public bool IsUserMember { get; set; }
}

public class CreateClubRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? FoundedDate { get; set; }
    public string? MeetingSchedule { get; set; }
    public string? ContactEmail { get; set; }
}

public class UpdateClubRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public DateTime? FoundedDate { get; set; }
    public string? MeetingSchedule { get; set; }
    public string? ContactEmail { get; set; }
    public bool? IsActive { get; set; }
}

// Event DTOs
public class EventDto
{
    public int EventId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime EventDate { get; set; }
    public string? Location { get; set; }
    public string? EventType { get; set; }
    public string? EventCategory { get; set; }
    public string? EventScope { get; set; }
    public int? HostClubId { get; set; }
    public string? HostClubName { get; set; }
    public string? HostClubAvatar { get; set; }
    public string? PartnerName { get; set; }
    public string? PartnerLogo { get; set; }
    public string? PartnerWebsite { get; set; }
    public string? RegistrationUrl { get; set; }
    public decimal? EventFee { get; set; }
    public int? MaxCapacity { get; set; }
    public bool? IsRegistrationRequired { get; set; }
    public bool? IsFeatured { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? SourceUrl { get; set; }
    public int? RegisteredCount { get; set; }
    public int? TotalRegistrations { get; set; }
    public int? SpotsRemaining { get; set; }
    public bool? IsUserRegistered { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class CreateEventRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime EventDate { get; set; }
    public string? Location { get; set; }
    public string? EventType { get; set; }
    public string? EventCategory { get; set; }
    public string? EventScope { get; set; }
    public int? HostClubId { get; set; }
    public string? PartnerName { get; set; }
    public string? PartnerLogo { get; set; }
    public string? PartnerWebsite { get; set; }
    public string? RegistrationUrl { get; set; }
    public decimal? EventFee { get; set; }
    public int? MaxCapacity { get; set; }
    public bool? IsRegistrationRequired { get; set; }
    public bool? IsFeatured { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? SourceUrl { get; set; }
}

public class UpdateEventRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime? EventDate { get; set; }
    public string? Location { get; set; }
    public string? EventType { get; set; }
    public string? EventCategory { get; set; }
    public string? EventScope { get; set; }
    public int? HostClubId { get; set; }
    public string? PartnerName { get; set; }
    public string? PartnerLogo { get; set; }
    public string? PartnerWebsite { get; set; }
    public string? RegistrationUrl { get; set; }
    public decimal? EventFee { get; set; }
    public int? MaxCapacity { get; set; }
    public bool? IsRegistrationRequired { get; set; }
    public bool? IsFeatured { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? SourceUrl { get; set; }
}

public class ThumbnailFromUrlRequest
{
    public string ImageUrl { get; set; } = string.Empty;
}

public class RegisterEventRequest
{
    public int EventId { get; set; }
    public int NumberOfGuests { get; set; } = 0;
    public string? Notes { get; set; }
}

// Payment DTOs
public class ProcessPaymentRequest
{
    public int MembershipTypeId { get; set; }
    public string PaymentMethod { get; set; } = "CreditCard";
    public string? TransactionId { get; set; }
}

public class PaymentResponse
{
    public int PaymentId { get; set; }
    public decimal Amount { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime ValidUntil { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
}

// Dashboard DTOs
public class DashboardDto
{
    public UserDto User { get; set; } = null!;
    public int ClubCount { get; set; }
    public int EventCount { get; set; }
    public DateTime? MembershipExpiry { get; set; }
    public List<ActivityLogDto> RecentActivities { get; set; } = new();
}

public class ActivityLogDto
{
    public int LogId { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Generic Response
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
}

// Enhanced Club DTOs
public class ClubDetailDto
{
    public int ClubId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime? FoundedDate { get; set; }
    public string? MeetingSchedule { get; set; }
    public string? ContactEmail { get; set; }
    public bool IsActive { get; set; }
    public int TotalMembers { get; set; }
    public List<ClubAdminDto> Admins { get; set; } = new();
    public List<ClubMemberDto> Members { get; set; } = new();
    public bool IsUserMember { get; set; }
    public bool IsUserAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ClubAdminDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime AssignedDate { get; set; }
}

public class ClubMemberDto
{
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime JoinedDate { get; set; }
    public bool IsAdmin { get; set; }
}



public class AssignClubAdminRequest
{
    public int UserId { get; set; }
}

// Enhanced Family DTOs (redefine to match controller)
public class FamilyGroupDto
{
    public int FamilyGroupId { get; set; }
    public string FamilyName { get; set; } = string.Empty;
    public int PrimaryUserId { get; set; }
    public string PrimaryUserName { get; set; } = string.Empty;
    public string PrimaryUserEmail { get; set; } = string.Empty;
    public int TotalMembers { get; set; }
    public List<FamilyMemberDto> Members { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class FamilyMemberInfoDto
{
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string RelationshipToPrimary { get; set; } = "Member";
    public bool IsPrimary { get; set; }
    public string? MembershipType { get; set; }
}

public class CreateFamilyGroupRequest
{
    public string FamilyName { get; set; } = string.Empty;
    public int PrimaryUserId { get; set; }
}

public class AddFamilyMemberRequest
{
    public int UserId { get; set; }
    public string? Relationship { get; set; }
}

// User Profile DTO (extended UserDto with board member fields)
public class UserProfileDto
{
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? ChineseName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Profession { get; set; }
    public string? Hobbies { get; set; }
    public string? Bio { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? MaritalStatus { get; set; }
    public string? AvatarUrl { get; set; }
    public int MembershipTypeId { get; set; }
    public string? MembershipTypeName { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsBoardMember { get; set; }
    public string? BoardTitle { get; set; }
    public string? BoardBio { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? TwitterHandle { get; set; }
    public DateTime MemberSince { get; set; }
}

// Upload Response DTO
public class UploadResponse
{
    public string Url { get; set; } = string.Empty;
}

// Event Registration Request DTO
public class EventRegistrationRequest
{
    public int EventId { get; set; }
    public int NumberOfGuests { get; set; } = 0;
}

// Event Type Info DTO
public class EventTypeInfo
{
    public string Type { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public bool AllowsRegistration { get; set; } = true;
}

// Theme Settings DTO
public class ThemeSettingsDto
{
    public int ThemeId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? FaviconUrl { get; set; }
    
    // Primary Colors
    public string PrimaryColor { get; set; } = "#047857";
    public string PrimaryDarkColor { get; set; } = "#065f46";
    public string PrimaryLightColor { get; set; } = "#10b981";
    
    // Accent Colors
    public string AccentColor { get; set; } = "#f59e0b";
    public string AccentDarkColor { get; set; } = "#d97706";
    public string AccentLightColor { get; set; } = "#fbbf24";
    
    // Status Colors
    public string SuccessColor { get; set; } = "#10b981";
    public string ErrorColor { get; set; } = "#ef4444";
    public string WarningColor { get; set; } = "#f59e0b";
    public string InfoColor { get; set; } = "#3b82f6";
    
    // Text Colors
    public string TextPrimaryColor { get; set; } = "#1f2937";
    public string TextSecondaryColor { get; set; } = "#6b7280";
    public string TextLightColor { get; set; } = "#ffffff";
    
    // Background Colors
    public string BackgroundColor { get; set; } = "#ffffff";
    public string BackgroundSecondaryColor { get; set; } = "#f3f4f6";
    
    // Other Colors
    public string BorderColor { get; set; } = "#e5e7eb";
    public string ShadowColor { get; set; } = "#00000026";
    
    // Typography
    public string FontFamily { get; set; } = "Inter, system-ui, sans-serif";
    public string HeadingFontFamily { get; set; } = "Inter, system-ui, sans-serif";
    
    // Custom CSS
    public string? CustomCss { get; set; }

    // Home Page Quote
    public string? HomeQuote { get; set; }
    public string? HomeQuoteSubtext { get; set; }

    public bool IsActive { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Update Theme Request DTO
public class UpdateThemeRequest
{
    public string? OrganizationName { get; set; }
    public string? LogoUrl { get; set; }
    public string? FaviconUrl { get; set; }
    
    // Primary Colors
    public string? PrimaryColor { get; set; }
    public string? PrimaryDarkColor { get; set; }
    public string? PrimaryLightColor { get; set; }
    
    // Accent Colors
    public string? AccentColor { get; set; }
    public string? AccentDarkColor { get; set; }
    public string? AccentLightColor { get; set; }
    
    // Status Colors
    public string? SuccessColor { get; set; }
    public string? ErrorColor { get; set; }
    public string? WarningColor { get; set; }
    public string? InfoColor { get; set; }
    
    // Text Colors
    public string? TextPrimaryColor { get; set; }
    public string? TextSecondaryColor { get; set; }
    public string? TextLightColor { get; set; }
    
    // Background Colors
    public string? BackgroundColor { get; set; }
    public string? BackgroundSecondaryColor { get; set; }
    
    // Other Colors
    public string? BorderColor { get; set; }
    public string? ShadowColor { get; set; }
    
    // Typography
    public string? FontFamily { get; set; }
    public string? HeadingFontFamily { get; set; }

    // Custom CSS
    public string? CustomCss { get; set; }

    // Home Page Quote
    public string? HomeQuote { get; set; }
    public string? HomeQuoteSubtext { get; set; }
}

// Theme Preset DTO
public class ThemePresetDto
{
    public int PresetId { get; set; }
    public string PresetName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string PrimaryColor { get; set; } = string.Empty;
    public string PrimaryDarkColor { get; set; } = string.Empty;
    public string PrimaryLightColor { get; set; } = string.Empty;
    public string AccentColor { get; set; } = string.Empty;
    public string AccentDarkColor { get; set; } = string.Empty;
    public string AccentLightColor { get; set; } = string.Empty;
    public string? PreviewImage { get; set; }
    public bool IsDefault { get; set; }
}

// Avatar Response DTO
public class AvatarResponse
{
    public string AvatarUrl { get; set; } = string.Empty;
}

// Admin Edit User Request DTO
public class AdminEditUserRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? ChineseName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Profession { get; set; }
    public string? Hobbies { get; set; }
    public string? Bio { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? MaritalStatus { get; set; }
    public int? MembershipTypeId { get; set; }
    public bool? IsAdmin { get; set; }
    public bool? IsBoardMember { get; set; }
    public string? BoardTitle { get; set; }
    public int? BoardDisplayOrder { get; set; }
    public string? BoardBio { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? TwitterHandle { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? MemberSince { get; set; }
}

// Board Member DTO
public class BoardMemberDto
{
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? ChineseName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Profession { get; set; }
    public string? BoardTitle { get; set; }
    public int BoardDisplayOrder { get; set; }
    public int DisplayOrder { get; set; }
    public string? BoardBio { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? TwitterHandle { get; set; }
}

// Public Profile DTO
public class PublicProfileDto
{
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? ChineseName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Profession { get; set; }
    public string? Hobbies { get; set; }
    public string? Bio { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public bool IsBoardMember { get; set; }
    public string? BoardTitle { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? TwitterHandle { get; set; }
    public string? MembershipTypeName { get; set; }
    public DateTime MemberSince { get; set; }
    public List<ProfileClubDto> Clubs { get; set; } = new();
}

// Simple club info for profile display
public class ProfileClubDto
{
    public int ClubId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Icon { get; set; }
}

// Event Asset DTOs
public class EventAssetDto
{
    public int FileId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Status { get; set; } = "Private";
    public int SortOrder { get; set; }
    public string? Caption { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class EventAssetsDto
{
    public int EventId { get; set; }
    public List<EventAssetDto> Photos { get; set; } = new();
    public List<EventAssetDto> Documents { get; set; } = new();
}

// Update Asset Request DTO
public class UpdateAssetRequest
{
    public string? Status { get; set; }
    public int? SortOrder { get; set; }
    public string? Caption { get; set; }
}

// Event Registrant DTO
public class EventRegistrantDto
{
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int NumberOfGuests { get; set; }
    public DateTime RegistrationDate { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
}

// Event Detail DTO (for public view with assets and registrants)
public class EventDetailDto
{
    public int EventId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime EventDate { get; set; }
    public string? Location { get; set; }
    public string? EventType { get; set; }
    public string? EventCategory { get; set; }
    public string? EventScope { get; set; }
    public int? HostClubId { get; set; }
    public string? HostClubName { get; set; }
    public string? HostClubAvatar { get; set; }
    public string? PartnerName { get; set; }
    public string? PartnerLogo { get; set; }
    public string? PartnerWebsite { get; set; }
    public string? RegistrationUrl { get; set; }
    public decimal? EventFee { get; set; }
    public int? MaxCapacity { get; set; }
    public bool? IsRegistrationRequired { get; set; }
    public bool? IsFeatured { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? SourceUrl { get; set; }
    public int? TotalRegistrations { get; set; }
    public int? SpotsRemaining { get; set; }
    public bool? IsUserRegistered { get; set; }
    public DateTime? CreatedAt { get; set; }
    public List<EventAssetDto> Photos { get; set; } = new();
    public List<EventAssetDto> Documents { get; set; } = new();
    public List<EventRegistrantDto> Registrants { get; set; } = new();
}

// ============ MEMBERSHIP PAYMENT DTOs ============

// Membership Payment DTO
public class MembershipPaymentDto
{
    public int PaymentId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserEmail { get; set; }
    public string? UserAvatarUrl { get; set; }
    public int MembershipTypeId { get; set; }
    public string MembershipTypeName { get; set; } = string.Empty;
    public int? DurationId { get; set; }
    public string? DurationName { get; set; }
    public int? DurationMonths { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = "Zelle";
    public string? TransactionId { get; set; }
    public string Status { get; set; } = "Pending";
    public string? ProofOfPaymentUrl { get; set; }
    public string PaymentScope { get; set; } = "Self";
    public int? ConfirmedBy { get; set; }
    public string? ConfirmedByName { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime ValidUntil { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<int>? CoveredFamilyMemberIds { get; set; }
    public List<FamilyMemberSummaryDto>? CoveredFamilyMembers { get; set; }
    // For linked users - shows who paid for their membership
    public bool IsCoveredByFamilyPayment { get; set; } = false;
    public string? PaidByUserName { get; set; }
    public int? PaidByUserId { get; set; }
}

// Family Member Summary DTO (for payment coverage display)
public class FamilyMemberSummaryDto
{
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Email { get; set; }
    public string? Relationship { get; set; }
}

// Membership Duration DTO
public class MembershipDurationDto
{
    public int DurationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Months { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
}

// Create/Update Duration Request DTO
public class CreateDurationRequest
{
    public string Name { get; set; } = string.Empty;
    public int Months { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
}

// Submit Payment Request DTO
public class SubmitPaymentRequest
{
    public int MembershipTypeId { get; set; }
    public int DurationId { get; set; } // Required - selected duration
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Zelle";
    public string? TransactionId { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentScope { get; set; } = "Self"; // Self or Family
    public string? Notes { get; set; }
}

// Admin Confirm Payment Request DTO
public class ConfirmPaymentRequest
{
    public bool Approve { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public List<int>? FamilyMemberIds { get; set; } // User IDs to apply family membership to
    public string? Notes { get; set; }
}

// Admin Update Linked Users Request DTO
public class UpdateLinkedUsersRequest
{
    public List<int>? FamilyMemberIds { get; set; }
}

// User Membership Status DTO
public class MembershipStatusDto
{
    public int UserId { get; set; }
    public string MembershipTypeName { get; set; } = string.Empty;
    public decimal MembershipPrice { get; set; }
    public bool IsActive { get; set; }
    public DateTime? MembershipValidUntil { get; set; }
    public bool IsExpired { get; set; }
    public bool IsExpiringSoon { get; set; } // Within 30 days
    public int DaysUntilExpiration { get; set; }
    public MembershipPaymentDto? LatestPayment { get; set; }
    public MembershipPaymentDto? PendingPayment { get; set; }
    public List<MembershipPaymentDto> PaymentHistory { get; set; } = new();
    public List<FamilyMemberSummaryDto> FamilyMembers { get; set; } = new();
}

// Payment Methods DTO (for future extensibility)
public class PaymentMethodDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public bool IsActive { get; set; } = true;
}

// URL Metadata DTO (for fetching Open Graph data from URLs)
public class UrlMetadataDto
{
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? SiteName { get; set; }
    public List<string> Images { get; set; } = new();
}
