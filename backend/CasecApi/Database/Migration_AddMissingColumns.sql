-- ================================================================
-- CASEC Database Migration Script
-- Adds missing columns to existing tables
-- Date: December 4, 2025
-- ================================================================

USE CasecDb;
GO

PRINT '========================================';
PRINT 'Starting CASEC Database Migration';
PRINT '========================================';
GO

-- ================================================================
-- MembershipTypes Table - Add Missing Columns
-- ================================================================
PRINT 'Updating MembershipTypes table...';
GO

-- Check if columns exist before adding
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MembershipTypes' AND COLUMN_NAME = 'DurationMonths')
BEGIN
    ALTER TABLE MembershipTypes ADD DurationMonths INT NOT NULL DEFAULT 12;
    PRINT '✓ Added DurationMonths column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MembershipTypes' AND COLUMN_NAME = 'Price')
BEGIN
    ALTER TABLE MembershipTypes ADD Price DECIMAL(10,2) NOT NULL DEFAULT 0;
    PRINT '✓ Added Price column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MembershipTypes' AND COLUMN_NAME = 'AnnualFee')
BEGIN
    ALTER TABLE MembershipTypes ADD AnnualFee DECIMAL(10,2) NOT NULL DEFAULT 0;
    PRINT '✓ Added AnnualFee column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MembershipTypes' AND COLUMN_NAME = 'MaxFamilyMembers')
BEGIN
    ALTER TABLE MembershipTypes ADD MaxFamilyMembers INT NOT NULL DEFAULT 1;
    PRINT '✓ Added MaxFamilyMembers column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MembershipTypes' AND COLUMN_NAME = 'CanManageClubs')
BEGIN
    ALTER TABLE MembershipTypes ADD CanManageClubs BIT NOT NULL DEFAULT 0;
    PRINT '✓ Added CanManageClubs column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MembershipTypes' AND COLUMN_NAME = 'CanManageEvents')
BEGIN
    ALTER TABLE MembershipTypes ADD CanManageEvents BIT NOT NULL DEFAULT 0;
    PRINT '✓ Added CanManageEvents column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MembershipTypes' AND COLUMN_NAME = 'HasBoardVotingRights')
BEGIN
    ALTER TABLE MembershipTypes ADD HasBoardVotingRights BIT NOT NULL DEFAULT 0;
    PRINT '✓ Added HasBoardVotingRights column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MembershipTypes' AND COLUMN_NAME = 'DisplayOrder')
BEGIN
    ALTER TABLE MembershipTypes ADD DisplayOrder INT NOT NULL DEFAULT 0;
    PRINT '✓ Added DisplayOrder column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MembershipTypes' AND COLUMN_NAME = 'Icon')
BEGIN
    ALTER TABLE MembershipTypes ADD Icon NVARCHAR(50) NULL;
    PRINT '✓ Added Icon column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MembershipTypes' AND COLUMN_NAME = 'UpdatedAt')
BEGIN
    ALTER TABLE MembershipTypes ADD UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE();
    PRINT '✓ Added UpdatedAt column';
END

GO

-- ================================================================
-- Users Table - Add Missing Columns
-- ================================================================
PRINT 'Updating Users table...';
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'AvatarUrl')
BEGIN
    ALTER TABLE Users ADD AvatarUrl NVARCHAR(500) NULL;
    PRINT '✓ Added AvatarUrl column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'IsBoardMember')
BEGIN
    ALTER TABLE Users ADD IsBoardMember BIT NOT NULL DEFAULT 0;
    PRINT '✓ Added IsBoardMember column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'BoardTitle')
BEGIN
    ALTER TABLE Users ADD BoardTitle NVARCHAR(100) NULL;
    PRINT '✓ Added BoardTitle column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'BoardDisplayOrder')
BEGIN
    ALTER TABLE Users ADD BoardDisplayOrder INT NULL;
    PRINT '✓ Added BoardDisplayOrder column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'BoardBio')
BEGIN
    ALTER TABLE Users ADD BoardBio NVARCHAR(MAX) NULL;
    PRINT '✓ Added BoardBio column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'LinkedInUrl')
BEGIN
    ALTER TABLE Users ADD LinkedInUrl NVARCHAR(100) NULL;
    PRINT '✓ Added LinkedInUrl column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'TwitterHandle')
BEGIN
    ALTER TABLE Users ADD TwitterHandle NVARCHAR(100) NULL;
    PRINT '✓ Added TwitterHandle column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'FamilyGroupId')
BEGIN
    ALTER TABLE Users ADD FamilyGroupId INT NULL;
    PRINT '✓ Added FamilyGroupId column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'RelationshipToPrimary')
BEGIN
    ALTER TABLE Users ADD RelationshipToPrimary NVARCHAR(50) NULL;
    PRINT '✓ Added RelationshipToPrimary column';
END

GO

-- ================================================================
-- Clubs Table - Add Missing Columns
-- ================================================================
PRINT 'Updating Clubs table...';
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Clubs' AND COLUMN_NAME = 'AvatarUrl')
BEGIN
    ALTER TABLE Clubs ADD AvatarUrl NVARCHAR(500) NULL;
    PRINT '✓ Added AvatarUrl column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Clubs' AND COLUMN_NAME = 'FoundedDate')
BEGIN
    ALTER TABLE Clubs ADD FoundedDate DATETIME2 NULL;
    PRINT '✓ Added FoundedDate column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Clubs' AND COLUMN_NAME = 'MeetingSchedule')
BEGIN
    ALTER TABLE Clubs ADD MeetingSchedule NVARCHAR(200) NULL;
    PRINT '✓ Added MeetingSchedule column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Clubs' AND COLUMN_NAME = 'ContactEmail')
BEGIN
    ALTER TABLE Clubs ADD ContactEmail NVARCHAR(100) NULL;
    PRINT '✓ Added ContactEmail column';
END

GO

-- ================================================================
-- Events Table - Add Missing Columns
-- ================================================================
PRINT 'Updating Events table...';
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'EventType')
BEGIN
    ALTER TABLE Events ADD EventType NVARCHAR(50) NOT NULL DEFAULT 'CasecEvent';
    PRINT '✓ Added EventType column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'EventCategory')
BEGIN
    ALTER TABLE Events ADD EventCategory NVARCHAR(100) NULL;
    PRINT '✓ Added EventCategory column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'EventScope')
BEGIN
    ALTER TABLE Events ADD EventScope NVARCHAR(50) NOT NULL DEFAULT 'AllMembers';
    PRINT '✓ Added EventScope column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'HostClubId')
BEGIN
    ALTER TABLE Events ADD HostClubId INT NULL;
    PRINT '✓ Added HostClubId column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'PartnerName')
BEGIN
    ALTER TABLE Events ADD PartnerName NVARCHAR(200) NULL;
    PRINT '✓ Added PartnerName column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'PartnerLogo')
BEGIN
    ALTER TABLE Events ADD PartnerLogo NVARCHAR(500) NULL;
    PRINT '✓ Added PartnerLogo column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'PartnerWebsite')
BEGIN
    ALTER TABLE Events ADD PartnerWebsite NVARCHAR(500) NULL;
    PRINT '✓ Added PartnerWebsite column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'RegistrationUrl')
BEGIN
    ALTER TABLE Events ADD RegistrationUrl NVARCHAR(500) NULL;
    PRINT '✓ Added RegistrationUrl column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'MaxCapacity')
BEGIN
    ALTER TABLE Events ADD MaxCapacity INT NOT NULL DEFAULT 0;
    PRINT '✓ Added MaxCapacity column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'IsRegistrationRequired')
BEGIN
    ALTER TABLE Events ADD IsRegistrationRequired BIT NOT NULL DEFAULT 1;
    PRINT '✓ Added IsRegistrationRequired column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'IsFeatured')
BEGIN
    ALTER TABLE Events ADD IsFeatured BIT NOT NULL DEFAULT 0;
    PRINT '✓ Added IsFeatured column';
END

GO

-- ================================================================
-- ActivityLog Table - Add Missing Columns
-- ================================================================
PRINT 'Updating ActivityLog table...';
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ActivityLog' AND COLUMN_NAME = 'IpAddress')
BEGIN
    ALTER TABLE ActivityLog ADD IpAddress NVARCHAR(50) NULL;
    PRINT '✓ Added IpAddress column';
END

GO

-- ================================================================
-- Add Foreign Key Constraints
-- ================================================================
PRINT 'Adding foreign key constraints...';
GO

-- Users -> FamilyGroups
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Users_FamilyGroups')
BEGIN
    ALTER TABLE Users
    ADD CONSTRAINT FK_Users_FamilyGroups
    FOREIGN KEY (FamilyGroupId) REFERENCES FamilyGroups(FamilyGroupId);
    PRINT '✓ Added FK_Users_FamilyGroups';
END

-- Events -> Clubs
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Events_Clubs_HostClubId')
BEGIN
    ALTER TABLE Events
    ADD CONSTRAINT FK_Events_Clubs_HostClubId
    FOREIGN KEY (HostClubId) REFERENCES Clubs(ClubId);
    PRINT '✓ Added FK_Events_Clubs_HostClubId';
END

GO

PRINT '========================================';
PRINT 'Migration completed successfully!';
PRINT '========================================';
GO

-- ================================================================
-- Verification Query
-- ================================================================
PRINT 'Verifying schema...';
GO

SELECT 
    'MembershipTypes' AS TableName,
    COUNT(*) AS ColumnCount
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'MembershipTypes'
UNION ALL
SELECT 
    'Users' AS TableName,
    COUNT(*) AS ColumnCount
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Users'
UNION ALL
SELECT 
    'Clubs' AS TableName,
    COUNT(*) AS ColumnCount
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Clubs'
UNION ALL
SELECT 
    'Events' AS TableName,
    COUNT(*) AS ColumnCount
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Events'
UNION ALL
SELECT 
    'ActivityLog' AS TableName,
    COUNT(*) AS ColumnCount
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'ActivityLog';
GO

PRINT 'Schema verification complete!';
GO
