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
    public List<string> Roles { get; set; } = new();
    public List<string> AllowedAdminAreas { get; set; } = new();
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
    public int? ThumbnailFocusX { get; set; }
    public int? ThumbnailFocusY { get; set; }
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
    public int? ThumbnailFocusX { get; set; }
    public int? ThumbnailFocusY { get; set; }
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
    public int? ThumbnailFocusX { get; set; }
    public int? ThumbnailFocusY { get; set; }
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

// Event Type DTO
public class EventTypeDto
{
    public int EventTypeId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public bool AllowsRegistration { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
}

// Event Type Info DTO (backwards compatible)
public class EventTypeInfo
{
    public string Type { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public bool AllowsRegistration { get; set; } = true;
}

// Create/Update Event Type Request DTO
public class CreateEventTypeRequest
{
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public bool AllowsRegistration { get; set; } = true;
    public int DisplayOrder { get; set; }
}

public class UpdateEventTypeRequest
{
    public string? Code { get; set; }
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public bool? AllowsRegistration { get; set; }
    public bool? IsActive { get; set; }
    public int? DisplayOrder { get; set; }
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

    // Hero video URLs (JSON array of YouTube/TikTok URLs)
    public string? HeroVideoUrls { get; set; }

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

    // Hero video URLs (JSON array of YouTube/TikTok URLs)
    public string? HeroVideoUrls { get; set; }
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
    public string? NewPassword { get; set; }
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
    public int? ThumbnailFocusX { get; set; }
    public int? ThumbnailFocusY { get; set; }
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

// Payment Methods DTO
public class PaymentMethodDto
{
    public int PaymentMethodId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public string? Icon { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
}

// Create Payment Method Request DTO
public class CreatePaymentMethodRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public string? Icon { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
}

// Update Payment Method Request DTO
public class UpdatePaymentMethodRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public string? Icon { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
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

// ============ SLIDESHOW DTOs ============

// SlideShow DTOs
public class SlideShowDto
{
    public int SlideShowId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public string TransitionType { get; set; } = "fade";
    public int TransitionDuration { get; set; }
    public int DefaultSlideInterval { get; set; }
    public bool ShowProgress { get; set; }
    public bool AllowSkip { get; set; }
    public bool Loop { get; set; }
    public bool AutoPlay { get; set; }
    public int? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<SlideDto> Slides { get; set; } = new();
}

// ============ RAFFLE DTOs ============

// Raffle DTO - Full raffle info
public class RaffleDto
{
    public int RaffleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Draft";
    public int? WinningNumber { get; set; }
    public string? RevealedDigits { get; set; }
    public int TicketDigits { get; set; }
    public int TotalTicketsSold { get; set; }
    public decimal TotalRevenue { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? DrawingDate { get; set; }
    public int? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int ParticipantCount { get; set; }
    public List<RafflePrizeDto> Prizes { get; set; } = new();
    public List<RaffleTicketTierDto> TicketTiers { get; set; } = new();
}

public class SlideShowSummaryDto
{
    public int SlideShowId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int SlideCount { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateSlideShowRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public string TransitionType { get; set; } = "fade";
    public int TransitionDuration { get; set; } = 500;
    public bool ShowProgress { get; set; } = true;
    public bool AllowSkip { get; set; } = true;
    public bool Loop { get; set; } = false;
    public bool AutoPlay { get; set; } = true;
}

public class UpdateSlideShowRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public string TransitionType { get; set; } = "fade";
    public int TransitionDuration { get; set; }
    public bool ShowProgress { get; set; }
    public bool AllowSkip { get; set; }
    public bool Loop { get; set; }
    public bool AutoPlay { get; set; }
}

// Slide DTOs
public class SlideDto
{
    public int SlideId { get; set; }
    public int SlideShowId { get; set; }
    public int DisplayOrder { get; set; }
    public int Duration { get; set; }

    // NEW: Background settings
    public string BackgroundType { get; set; } = "heroVideos";
    public string? BackgroundColor { get; set; }
    public string? BackgroundImageUrl { get; set; }
    public bool UseRandomHeroVideos { get; set; }

    // Legacy video background (kept for backwards compatibility)
    public string? VideoUrl { get; set; }
    public bool UseRandomVideo { get; set; }

    public string Layout { get; set; } = "center";
    public string OverlayType { get; set; } = "dark";
    public string? OverlayColor { get; set; }
    public int OverlayOpacity { get; set; }

    // Legacy collections
    public List<SlideImageDto> Images { get; set; } = new();
    public List<SlideTextDto> Texts { get; set; } = new();

    // NEW: Object-oriented collections
    public List<SlideObjectDto> Objects { get; set; } = new();
    public List<SlideBackgroundVideoDto> BackgroundVideos { get; set; } = new();
}

public class CreateSlideRequest
{
    public int SlideShowId { get; set; }
    public int DisplayOrder { get; set; }
    public int Duration { get; set; } = 5000;

    // NEW: Background settings
    public string BackgroundType { get; set; } = "heroVideos";
    public string? BackgroundColor { get; set; }
    public string? BackgroundImageUrl { get; set; }
    public bool UseRandomHeroVideos { get; set; }

    // Legacy video background
    public string? VideoUrl { get; set; }
    public bool UseRandomVideo { get; set; }

    public string Layout { get; set; } = "center";
    public string OverlayType { get; set; } = "dark";
    public string? OverlayColor { get; set; }
    public int OverlayOpacity { get; set; } = 50;
}

public class UpdateSlideRequest
{
    public int DisplayOrder { get; set; }
    public int Duration { get; set; }

    // NEW: Background settings
    public string BackgroundType { get; set; } = "heroVideos";
    public string? BackgroundColor { get; set; }
    public string? BackgroundImageUrl { get; set; }
    public bool UseRandomHeroVideos { get; set; }

    // Legacy video background
    public string? VideoUrl { get; set; }
    public bool UseRandomVideo { get; set; }

    public string Layout { get; set; } = "center";
    public string OverlayType { get; set; } = "dark";
    public string? OverlayColor { get; set; }
    public int OverlayOpacity { get; set; }
}

// SlideImage DTOs
public class SlideImageDto
{
    public int SlideImageId { get; set; }
    public int SlideId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public string Position { get; set; } = "center";
    public string Size { get; set; } = "medium";
    public string Orientation { get; set; } = "auto";
    public string Animation { get; set; } = "fadeIn";
    public int Duration { get; set; }
    public int Delay { get; set; }
    public string? BorderRadius { get; set; }
    public string? Shadow { get; set; }
    public int? Opacity { get; set; }
}

public class CreateSlideImageRequest
{
    public int SlideId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public string Position { get; set; } = "center";
    public string Size { get; set; } = "medium";
    public string Orientation { get; set; } = "auto";
    public string Animation { get; set; } = "fadeIn";
    public int Duration { get; set; } = 500;
    public int Delay { get; set; } = 1500;
    public string? BorderRadius { get; set; }
    public string? Shadow { get; set; }
    public int? Opacity { get; set; }
}

public class UpdateSlideImageRequest
{
    public string ImageUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public string Position { get; set; } = "center";
    public string Size { get; set; } = "medium";
    public string Orientation { get; set; } = "auto";
    public string Animation { get; set; } = "fadeIn";
    public int Duration { get; set; }
    public int Delay { get; set; }
    public string? BorderRadius { get; set; }
    public string? Shadow { get; set; }
    public int? Opacity { get; set; }
}

// SlideText DTOs
public class SlideTextDto
{
    public int SlideTextId { get; set; }
    public int SlideId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public string HorizontalPosition { get; set; } = "center";
    public string VerticalPosition { get; set; } = "center";
    public string Size { get; set; } = "large";
    public string? Color { get; set; }
    public string? FontFamily { get; set; }
    public string Animation { get; set; } = "fadeIn";
    public int Duration { get; set; }
    public int Delay { get; set; }
}

public class CreateSlideTextRequest
{
    public int SlideId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public string HorizontalPosition { get; set; } = "center";
    public string VerticalPosition { get; set; } = "center";
    public string Size { get; set; } = "large";
    public string? Color { get; set; } = "#ffffff";
    public string? FontFamily { get; set; }
    public string Animation { get; set; } = "fadeIn";
    public int Duration { get; set; } = 800;
    public int Delay { get; set; } = 500;
}

public class UpdateSlideTextRequest
{
    public string Text { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public string HorizontalPosition { get; set; } = "center";
    public string VerticalPosition { get; set; } = "center";
    public string Size { get; set; } = "large";
    public string? Color { get; set; }
    public string? FontFamily { get; set; }
    public string Animation { get; set; } = "fadeIn";
    public int Duration { get; set; }
    public int Delay { get; set; }
}

// SharedVideo DTOs
public class SharedVideoDto
{
    public int VideoId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
}

public class CreateSharedVideoRequest
{
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
}

public class UpdateSharedVideoRequest
{
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
}

// SharedImage DTOs
public class SharedImageDto
{
    public int ImageId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
}

public class CreateSharedImageRequest
{
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
}

public class UpdateSharedImageRequest
{
    public string Url { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
}

// ========== NEW: SlideObject DTOs (Object-Oriented Slide System) ==========

public class SlideObjectDto
{
    public int SlideObjectId { get; set; }
    public int SlideId { get; set; }
    public string ObjectType { get; set; } = "text"; // text, image, video
    public int SortOrder { get; set; }
    public string? Name { get; set; } // Name/Code for identification

    // Position
    public string HorizontalAlign { get; set; } = "center";
    public string VerticalAlign { get; set; } = "middle";
    public int OffsetX { get; set; }
    public int OffsetY { get; set; }

    // Animation In
    public string AnimationIn { get; set; } = "fadeIn";
    public int AnimationInDelay { get; set; }
    public int AnimationInDuration { get; set; }

    // Animation Out
    public string? AnimationOut { get; set; }
    public int? AnimationOutDelay { get; set; }
    public int? AnimationOutDuration { get; set; }
    public bool StayOnScreen { get; set; }

    // Type-specific properties as JSON string or parsed object
    public string? Properties { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateSlideObjectRequest
{
    public int SlideId { get; set; }
    public string ObjectType { get; set; } = "text";
    public int SortOrder { get; set; }
    public string? Name { get; set; } // Name/Code for identification

    // Position
    public string HorizontalAlign { get; set; } = "center";
    public string VerticalAlign { get; set; } = "middle";
    public int OffsetX { get; set; }
    public int OffsetY { get; set; }

    // Animation In
    public string AnimationIn { get; set; } = "fadeIn";
    public int AnimationInDelay { get; set; }
    public int AnimationInDuration { get; set; } = 500;

    // Animation Out
    public string? AnimationOut { get; set; }
    public int? AnimationOutDelay { get; set; }
    public int? AnimationOutDuration { get; set; }
    public bool StayOnScreen { get; set; } = true;

    // Type-specific properties as JSON string
    public string? Properties { get; set; }
}

public class UpdateSlideObjectRequest
{
    public string ObjectType { get; set; } = "text";
    public int SortOrder { get; set; }
    public string? Name { get; set; } // Name/Code for identification

    // Position
    public string HorizontalAlign { get; set; } = "center";
    public string VerticalAlign { get; set; } = "middle";
    public int OffsetX { get; set; }
    public int OffsetY { get; set; }

    // Animation In
    public string AnimationIn { get; set; } = "fadeIn";
    public int AnimationInDelay { get; set; }
    public int AnimationInDuration { get; set; }

    // Animation Out
    public string? AnimationOut { get; set; }
    public int? AnimationOutDelay { get; set; }
    public int? AnimationOutDuration { get; set; }
    public bool StayOnScreen { get; set; }

    // Type-specific properties as JSON string
    public string? Properties { get; set; }
}

// ========== SlideBackgroundVideo DTOs ==========

public class SlideBackgroundVideoDto
{
    public int SlideBackgroundVideoId { get; set; }
    public int SlideId { get; set; }
    public int? VideoId { get; set; }
    public string? VideoUrl { get; set; }
    public int Duration { get; set; }
    public int SortOrder { get; set; }
    public bool UseRandom { get; set; }

    // Include video details if available
    public SharedVideoDto? Video { get; set; }
}

public class CreateSlideBackgroundVideoRequest
{
    public int SlideId { get; set; }
    public int? VideoId { get; set; }
    public string? VideoUrl { get; set; }
    public int Duration { get; set; } = 5000;
    public int SortOrder { get; set; }
    public bool UseRandom { get; set; }
}

public class UpdateSlideBackgroundVideoRequest
{
    public int? VideoId { get; set; }
    public string? VideoUrl { get; set; }
    public int Duration { get; set; }
    public int SortOrder { get; set; }
    public bool UseRandom { get; set; }
}

// ========== Extended Slide DTO with new background settings ==========

public class SlideWithObjectsDto
{
    public int SlideId { get; set; }
    public int SlideShowId { get; set; }
    public int DisplayOrder { get; set; }
    public int Duration { get; set; }

    // New background settings
    public string BackgroundType { get; set; } = "heroVideos";
    public string? BackgroundColor { get; set; }
    public string? BackgroundImageUrl { get; set; }
    public bool UseRandomHeroVideos { get; set; }

    // Legacy fields (for backwards compatibility)
    public string? VideoUrl { get; set; }
    public bool UseRandomVideo { get; set; }

    // Overlay settings
    public string Layout { get; set; } = "center";
    public string OverlayType { get; set; } = "dark";
    public string? OverlayColor { get; set; }
    public int OverlayOpacity { get; set; }

    // Legacy title/subtitle (for backwards compatibility)
    public string? TitleText { get; set; }
    public string TitleAnimation { get; set; } = "fadeIn";
    public int TitleDuration { get; set; }
    public int TitleDelay { get; set; }
    public string? TitleSize { get; set; }
    public string? TitleColor { get; set; }
    public string? SubtitleText { get; set; }
    public string SubtitleAnimation { get; set; } = "fadeIn";
    public int SubtitleDuration { get; set; }
    public int SubtitleDelay { get; set; }
    public string? SubtitleSize { get; set; }
    public string? SubtitleColor { get; set; }

    // New object-oriented collections
    public List<SlideObjectDto> Objects { get; set; } = new();
    public List<SlideBackgroundVideoDto> BackgroundVideos { get; set; } = new();

    // Legacy collections (for backwards compatibility)
    public List<SlideImageDto> Images { get; set; } = new();
    public List<SlideTextDto> Texts { get; set; } = new();
    public List<RafflePrizeDto> Prizes { get; set; } = new();
    public List<RaffleTicketTierDto> TicketTiers { get; set; } = new();
    public int ParticipantCount { get; set; }
}

// Raffle Summary DTO - For list views
public class RaffleSummaryDto
{
    public int RaffleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Draft";
    public int TotalTicketsSold { get; set; }
    public int ParticipantCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? DrawingDate { get; set; }
}

// Create Raffle Request
public class CreateRaffleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int TicketDigits { get; set; } = 6;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? DrawingDate { get; set; }
    public List<CreateRafflePrizeRequest>? Prizes { get; set; }
    public List<CreateRaffleTicketTierRequest>? TicketTiers { get; set; }
}

// Update Raffle Request
public class UpdateRaffleRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? Status { get; set; }
    public int? TicketDigits { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? DrawingDate { get; set; }
}

// Raffle Prize DTO
public class RafflePrizeDto
{
    public int PrizeId { get; set; }
    public int RaffleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? Value { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsGrandPrize { get; set; }
}

// Create Prize Request
public class CreateRafflePrizeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? Value { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsGrandPrize { get; set; } = false;
}

// Update Prize Request
public class UpdateRafflePrizeRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? Value { get; set; }
    public int? DisplayOrder { get; set; }
    public bool? IsGrandPrize { get; set; }
}

// Ticket Tier DTO
public class RaffleTicketTierDto
{
    public int TierId { get; set; }
    public int RaffleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int TicketCount { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public bool IsFeatured { get; set; }
}

// Create Ticket Tier Request
public class CreateRaffleTicketTierRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int TicketCount { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; } = false;
}

// Update Ticket Tier Request
public class UpdateRaffleTicketTierRequest
{
    public string? Name { get; set; }
    public decimal? Price { get; set; }
    public int? TicketCount { get; set; }
    public string? Description { get; set; }
    public int? DisplayOrder { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsFeatured { get; set; }
}

// Raffle Participant DTO
public class RaffleParticipantDto
{
    public int ParticipantId { get; set; }
    public int RaffleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsVerified { get; set; }
    public int? TicketStart { get; set; }
    public int? TicketEnd { get; set; }
    public int TotalTickets { get; set; }
    public decimal TotalPaid { get; set; }
    public string PaymentStatus { get; set; } = "Pending";
    public string? PaymentMethod { get; set; }
    public bool IsWinner { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Participant Registration Request
public class RaffleRegistrationRequest
{
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}

// OTP Verification Request
public class RaffleOtpVerifyRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
}

// Registration Response (includes session token)
public class RaffleRegistrationResponse
{
    public int ParticipantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
    public string? SessionToken { get; set; }
    public string? OtpMessage { get; set; } // For demo: shows OTP in dev mode
}

// Purchase Tickets Request
public class RafflePurchaseRequest
{
    public int TierId { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? TransactionId { get; set; }
}

// Purchase Response
public class RafflePurchaseResponse
{
    public int ParticipantId { get; set; }
    public int TicketStart { get; set; }
    public int TicketEnd { get; set; }
    public int TicketsAdded { get; set; }
    public int TotalTickets { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal TotalPaid { get; set; }
}

// Update Avatar Request
public class RaffleUpdateAvatarRequest
{
    public string AvatarUrl { get; set; } = string.Empty;
}

// Drawing Page DTO - Info needed for the drawing display
public class RaffleDrawingDto
{
    public int RaffleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = "Draft";
    public int? WinningNumber { get; set; }
    public string? RevealedDigits { get; set; }
    public int TicketDigits { get; set; }
    public int TotalTicketsSold { get; set; }
    public DateTime? DrawingDate { get; set; }
    public List<RafflePrizeDto> Prizes { get; set; } = new();
    public List<RaffleParticipantSummaryDto> Participants { get; set; } = new();
}

// Participant Summary for Drawing Page
public class RaffleParticipantSummaryDto
{
    public int ParticipantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int? TicketStart { get; set; }
    public int? TicketEnd { get; set; }
    public int TotalTickets { get; set; }
    public bool IsWinner { get; set; }
    public bool IsStillEligible { get; set; } // Based on revealed digits
}

// Reveal Next Digit Request
public class RaffleRevealDigitRequest
{
    public int Digit { get; set; } // 0-9
}

// Admin: Confirm Payment Request
public class RaffleConfirmPaymentRequest
{
    public bool Confirm { get; set; }
    public string? Notes { get; set; }
}

// Resend OTP Request
public class RaffleResendOtpRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
}

// ============ EVENT PROGRAM DTOs ============

// Color theme for EventProgram styling
public class ColorThemeDto
{
    public string Name { get; set; } = string.Empty;
    public string Primary { get; set; } = "#facc15"; // Yellow accent
    public string BgFrom { get; set; } = "#7f1d1d"; // Red-900
    public string BgVia { get; set; } = "#991b1b"; // Red-800
    public string BgTo { get; set; } = "#78350f"; // Amber-900
}

// EventProgram DTOs
public class EventProgramDto
{
    public int ProgramId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleZh { get; set; }
    public string? TitleEn { get; set; }
    public string? Subtitle { get; set; }
    public string? SubtitleZh { get; set; }
    public string? SubtitleEn { get; set; }
    public string? Description { get; set; }
    public string? DescriptionZh { get; set; }
    public string? DescriptionEn { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? EventDate { get; set; }
    public string? TimeBlock { get; set; }
    public string? Venue { get; set; }
    public string? VenueAddress { get; set; }
    public List<int>? SlideShowIds { get; set; }
    public List<ColorThemeDto>? ColorThemes { get; set; }
    public bool ShowBackgroundImage { get; set; }
    public string Status { get; set; } = "Draft";
    public bool IsFeatured { get; set; }
    public string? Slug { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ProgramSectionDto> Sections { get; set; } = new();
}

public class EventProgramListDto
{
    public int ProgramId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? EventDate { get; set; }
    public string? Venue { get; set; }
    public string Status { get; set; } = "Draft";
    public bool IsFeatured { get; set; }
    public string? Slug { get; set; }
    public int SectionCount { get; set; }
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateEventProgramRequest
{
    public string Title { get; set; } = string.Empty;
    public string? TitleZh { get; set; }
    public string? TitleEn { get; set; }
    public string? Subtitle { get; set; }
    public string? SubtitleZh { get; set; }
    public string? SubtitleEn { get; set; }
    public string? Description { get; set; }
    public string? DescriptionZh { get; set; }
    public string? DescriptionEn { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? EventDate { get; set; }
    public string? TimeBlock { get; set; }
    public string? Venue { get; set; }
    public string? VenueAddress { get; set; }
    public List<int>? SlideShowIds { get; set; }
    public List<ColorThemeDto>? ColorThemes { get; set; }
    public bool ShowBackgroundImage { get; set; } = false;
    public string? Slug { get; set; }
}

public class UpdateEventProgramRequest
{
    public string? Title { get; set; }
    public string? TitleZh { get; set; }
    public string? TitleEn { get; set; }
    public string? Subtitle { get; set; }
    public string? SubtitleZh { get; set; }
    public string? SubtitleEn { get; set; }
    public string? Description { get; set; }
    public string? DescriptionZh { get; set; }
    public string? DescriptionEn { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? EventDate { get; set; }
    public string? TimeBlock { get; set; }
    public string? Venue { get; set; }
    public string? VenueAddress { get; set; }
    public List<int>? SlideShowIds { get; set; }
    public List<ColorThemeDto>? ColorThemes { get; set; }
    public bool? ShowBackgroundImage { get; set; }
    public string? Status { get; set; }
    public bool? IsFeatured { get; set; }
    public string? Slug { get; set; }
}

// ProgramSection DTOs
public class ProgramSectionDto
{
    public int SectionId { get; set; }
    public int ProgramId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleZh { get; set; }
    public string? TitleEn { get; set; }
    public string? Subtitle { get; set; }
    public string? SubtitleZh { get; set; }
    public string? SubtitleEn { get; set; }
    public string? Description { get; set; }
    public string? DescriptionZh { get; set; }
    public string? DescriptionEn { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public List<ProgramItemDto> Items { get; set; } = new();
}

public class CreateProgramSectionRequest
{
    public int ProgramId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleZh { get; set; }
    public string? TitleEn { get; set; }
    public string? Subtitle { get; set; }
    public string? SubtitleZh { get; set; }
    public string? SubtitleEn { get; set; }
    public string? Description { get; set; }
    public string? DescriptionZh { get; set; }
    public string? DescriptionEn { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateProgramSectionRequest
{
    public string? Title { get; set; }
    public string? TitleZh { get; set; }
    public string? TitleEn { get; set; }
    public string? Subtitle { get; set; }
    public string? SubtitleZh { get; set; }
    public string? SubtitleEn { get; set; }
    public string? Description { get; set; }
    public string? DescriptionZh { get; set; }
    public string? DescriptionEn { get; set; }
    public int? DisplayOrder { get; set; }
    public bool? IsActive { get; set; }
}

// ProgramItem DTOs
public class ProgramItemDto
{
    public int ItemId { get; set; }
    public int SectionId { get; set; }
    public int ItemNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleZh { get; set; }
    public string? TitleEn { get; set; }
    public string? PerformanceType { get; set; }
    public string? PerformanceTypeZh { get; set; }
    public string? PerformanceTypeEn { get; set; }
    public string? PerformerNames { get; set; }
    public string? PerformerNames2 { get; set; }
    public string? EstimatedLength { get; set; }
    public string? Description { get; set; }
    public string? DescriptionZh { get; set; }
    public string? DescriptionEn { get; set; }
    public string? ImageUrl { get; set; }
    public int? ContentPageId { get; set; }
    public int DisplayOrder { get; set; }
    public int? DurationMinutes { get; set; }
    public bool IsActive { get; set; } = true;
    public string? DisplayStyle { get; set; } = "default";
    public List<PerformerDto>? Performers { get; set; }
    public List<ContentCardDto>? Cards { get; set; }
}

public class CreateProgramItemRequest
{
    public int SectionId { get; set; }
    public int ItemNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleZh { get; set; }
    public string? TitleEn { get; set; }
    public string? PerformanceType { get; set; }
    public string? PerformanceTypeZh { get; set; }
    public string? PerformanceTypeEn { get; set; }
    public string? PerformerNames { get; set; }
    public string? PerformerNames2 { get; set; }
    public string? EstimatedLength { get; set; }
    public string? Description { get; set; }
    public string? DescriptionZh { get; set; }
    public string? DescriptionEn { get; set; }
    public string? ImageUrl { get; set; }
    public int? ContentPageId { get; set; }
    public int DisplayOrder { get; set; }
    public int? DurationMinutes { get; set; }
    public bool IsActive { get; set; } = true;
    public string? DisplayStyle { get; set; } = "default";
    public List<int>? PerformerIds { get; set; }
}

public class UpdateProgramItemRequest
{
    public int? ItemNumber { get; set; }
    public string? Title { get; set; }
    public string? TitleZh { get; set; }
    public string? TitleEn { get; set; }
    public string? PerformanceType { get; set; }
    public string? PerformanceTypeZh { get; set; }
    public string? PerformanceTypeEn { get; set; }
    public string? PerformerNames { get; set; }
    public string? PerformerNames2 { get; set; }
    public string? EstimatedLength { get; set; }
    public string? Description { get; set; }
    public string? DescriptionZh { get; set; }
    public string? DescriptionEn { get; set; }
    public string? ImageUrl { get; set; }
    public int? ContentPageId { get; set; }
    public int? DisplayOrder { get; set; }
    public int? DurationMinutes { get; set; }
    public bool? IsActive { get; set; }
    public string? DisplayStyle { get; set; }
    public List<int>? PerformerIds { get; set; }
}

// Reorder Request DTOs
public class ReorderSectionsRequest
{
    public List<SectionOrderItem> SectionOrder { get; set; } = new();
}

public class SectionOrderItem
{
    public int SectionId { get; set; }
    public int DisplayOrder { get; set; }
}

public class ReorderItemsRequest
{
    public List<ItemOrderItem> ItemOrder { get; set; } = new();
}

public class ItemOrderItem
{
    public int ItemId { get; set; }
    public int DisplayOrder { get; set; }
}

// Performer DTOs
public class PerformerDto
{
    public int PerformerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ChineseName { get; set; }
    public string? EnglishName { get; set; }
    public string? Bio { get; set; } // Legacy
    public string? BioZh { get; set; }
    public string? BioEn { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Website { get; set; }
    public string? Instagram { get; set; }
    public string? YouTube { get; set; }
    public int? ContentPageId { get; set; }
    public bool IsActive { get; set; }
    public List<ContentCardDto>? Cards { get; set; }
}

public class CreatePerformerRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ChineseName { get; set; }
    public string? EnglishName { get; set; }
    public string? Bio { get; set; } // Legacy
    public string? BioZh { get; set; }
    public string? BioEn { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Website { get; set; }
    public string? Instagram { get; set; }
    public string? YouTube { get; set; }
    public int? ContentPageId { get; set; }
}

public class UpdatePerformerRequest
{
    public string? Name { get; set; }
    public string? ChineseName { get; set; }
    public string? EnglishName { get; set; }
    public string? Bio { get; set; } // Legacy
    public string? BioZh { get; set; }
    public string? BioEn { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Website { get; set; }
    public string? Instagram { get; set; }
    public string? YouTube { get; set; }
    public int? ContentPageId { get; set; }
    public bool? IsActive { get; set; }
}

// ProgramContent DTOs
public class ProgramContentDto
{
    public int ContentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string ContentType { get; set; } = "General";
    public string? Content { get; set; }
    public string? FeaturedImageUrl { get; set; }
    public List<string>? GalleryImages { get; set; }
    public List<string>? Videos { get; set; }
    public int? SlideShowId { get; set; }
    public string Status { get; set; } = "Draft";
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateProgramContentRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string ContentType { get; set; } = "General";
    public string? Content { get; set; }
    public string? FeaturedImageUrl { get; set; }
    public List<string>? GalleryImages { get; set; }
    public List<string>? Videos { get; set; }
    public int? SlideShowId { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
}

public class UpdateProgramContentRequest
{
    public string? Title { get; set; }
    public string? Slug { get; set; }
    public string? ContentType { get; set; }
    public string? Content { get; set; }
    public string? FeaturedImageUrl { get; set; }
    public List<string>? GalleryImages { get; set; }
    public List<string>? Videos { get; set; }
    public int? SlideShowId { get; set; }
    public string? Status { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
}

// ContentCard DTOs - Cards with rich content for program items and performers
public class ContentCardDto
{
    public int CardId { get; set; }
    public string EntityType { get; set; } = "ProgramItem";
    public int EntityId { get; set; }
    public string? TitleZh { get; set; }
    public string? TitleEn { get; set; }
    public string? BodyTextZh { get; set; }
    public string? BodyTextEn { get; set; }
    public string? MediaUrl { get; set; }
    public string MediaType { get; set; } = "image";
    public string LayoutType { get; set; } = "left";
    public string? AspectRatio { get; set; } = "original";
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateContentCardRequest
{
    public string EntityType { get; set; } = "ProgramItem";
    public int EntityId { get; set; }
    public string? TitleZh { get; set; }
    public string? TitleEn { get; set; }
    public string? BodyTextZh { get; set; }
    public string? BodyTextEn { get; set; }
    public string? MediaUrl { get; set; }
    public string MediaType { get; set; } = "image";
    public string LayoutType { get; set; } = "left";
    public string? AspectRatio { get; set; } = "original";
    public int DisplayOrder { get; set; }
}

public class UpdateContentCardRequest
{
    public string? TitleZh { get; set; }
    public string? TitleEn { get; set; }
    public string? BodyTextZh { get; set; }
    public string? BodyTextEn { get; set; }
    public string? MediaUrl { get; set; }
    public string? MediaType { get; set; }
    public string? LayoutType { get; set; }
    public string? AspectRatio { get; set; }
    public int? DisplayOrder { get; set; }
}

// ============ ROLE-BASED ACCESS CONTROL DTOs ============

public class RoleDto
{
    public int RoleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsSystem { get; set; }
    public bool IsActive { get; set; }
    public int UserCount { get; set; }
    public List<AreaPermissionDto>? AreaPermissions { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AdminAreaDto
{
    public int AreaId { get; set; }
    public string AreaKey { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? IconName { get; set; }
    public string? Route { get; set; }
    public int DisplayOrder { get; set; }
}

public class AreaPermissionDto
{
    public int AreaId { get; set; }
    public string AreaKey { get; set; } = string.Empty;
    public string AreaName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public bool CanView { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}

public class UserRoleDto
{
    public int UserRoleId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public string? AssignedByName { get; set; }
}

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<AreaPermissionRequest>? AreaPermissions { get; set; }
}

public class UpdateRoleRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
    public List<AreaPermissionRequest>? AreaPermissions { get; set; }
}

public class AreaPermissionRequest
{
    public int AreaId { get; set; }
    public bool CanView { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}

public class AssignRoleRequest
{
    public int UserId { get; set; }
    public int RoleId { get; set; }
}

public class UserRoleInfoDto
{
    public int RoleId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class UserPermissionsDto
{
    public int UserId { get; set; }
    public List<UserRoleInfoDto> Roles { get; set; } = new();
    public List<AreaPermissionDto> Permissions { get; set; } = new();
}
