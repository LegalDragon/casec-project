-- Migration: Club Sub-Admins, Family Memberships, and Event-Club Linking
-- Run this after AddEventTypes.sql

-- =====================================================
-- PART 1: ENHANCE CLUBS TABLE
-- =====================================================

-- Add club management fields
ALTER TABLE Clubs
ADD Description NVARCHAR(MAX) NULL,
    AvatarUrl NVARCHAR(500) NULL,
    FoundedDate DATE NULL,
    MeetingSchedule NVARCHAR(200) NULL,
    ContactEmail NVARCHAR(100) NULL,
    IsActive BIT NOT NULL DEFAULT 1;

GO

-- Create ClubAdmins junction table for sub-admins
CREATE TABLE ClubAdmins (
    ClubAdminId INT PRIMARY KEY IDENTITY(1,1),
    ClubId INT NOT NULL,
    UserId INT NOT NULL,
    AssignedDate DATETIME NOT NULL DEFAULT GETDATE(),
    AssignedBy INT NULL,  -- Admin who assigned this role
    FOREIGN KEY (ClubId) REFERENCES Clubs(ClubId) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    FOREIGN KEY (AssignedBy) REFERENCES Users(UserId),
    CONSTRAINT UQ_ClubAdmins_ClubUser UNIQUE(ClubId, UserId)
);

CREATE INDEX IX_ClubAdmins_ClubId ON ClubAdmins(ClubId);
CREATE INDEX IX_ClubAdmins_UserId ON ClubAdmins(UserId);

GO

-- =====================================================
-- PART 2: FAMILY MEMBERSHIP SYSTEM
-- =====================================================

-- Create FamilyGroups table
CREATE TABLE FamilyGroups (
    FamilyGroupId INT PRIMARY KEY IDENTITY(1,1),
    FamilyName NVARCHAR(200) NOT NULL,
    PrimaryUserId INT NOT NULL,  -- Head of household
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (PrimaryUserId) REFERENCES Users(UserId)
);

CREATE INDEX IX_FamilyGroups_PrimaryUser ON FamilyGroups(PrimaryUserId);

GO

-- Add FamilyGroupId to Users table
ALTER TABLE Users
ADD FamilyGroupId INT NULL,
    RelationshipToPrimary NVARCHAR(50) NULL;  -- 'Primary', 'Spouse', 'Child', 'Parent', etc.

ALTER TABLE Users
ADD FOREIGN KEY (FamilyGroupId) REFERENCES FamilyGroups(FamilyGroupId);

CREATE INDEX IX_Users_FamilyGroupId ON Users(FamilyGroupId);

GO

-- =====================================================
-- PART 3: EVENT-CLUB LINKING
-- =====================================================

-- Add event scope to Events table
ALTER TABLE Events
ADD EventScope NVARCHAR(50) NOT NULL DEFAULT 'AllMembers',  -- 'AllMembers' or 'ClubSpecific'
    HostClubId INT NULL;  -- Which club hosts this event

ALTER TABLE Events
ADD FOREIGN KEY (HostClubId) REFERENCES Clubs(ClubId);

CREATE INDEX IX_Events_HostClubId ON Events(HostClubId);

GO

-- Add constraint for event scope
ALTER TABLE Events
ADD CONSTRAINT CK_Events_EventScope 
CHECK (EventScope IN ('AllMembers', 'ClubSpecific'));

GO

-- =====================================================
-- PART 4: VIEWS FOR EASY QUERYING
-- =====================================================

-- View: Club details with admin info
IF OBJECT_ID('vw_ClubDetails', 'V') IS NOT NULL
    DROP VIEW vw_ClubDetails;
GO

CREATE VIEW vw_ClubDetails AS
SELECT 
    c.ClubId,
    c.Name,
    c.Description,
    c.AvatarUrl,
    c.FoundedDate,
    c.MeetingSchedule,
    c.ContactEmail,
    c.IsActive,
    c.CreatedAt,
    COUNT(DISTINCT cm.MembershipId) as TotalMembers,
    COUNT(DISTINCT ca.ClubAdminId) as TotalAdmins,
    (SELECT STRING_AGG(u.FirstName + ' ' + u.LastName, ', ') 
     FROM ClubAdmins ca2 
     JOIN Users u ON ca2.UserId = u.UserId 
     WHERE ca2.ClubId = c.ClubId) as AdminNames
FROM Clubs c
LEFT JOIN ClubMemberships cm ON c.ClubId = cm.ClubId
LEFT JOIN ClubAdmins ca ON c.ClubId = ca.ClubId
GROUP BY 
    c.ClubId, c.Name, c.Description, c.AvatarUrl, 
    c.FoundedDate, c.MeetingSchedule, c.ContactEmail, 
    c.IsActive, c.CreatedAt;

GO

-- View: Family groups with members
IF OBJECT_ID('vw_FamilyGroups', 'V') IS NOT NULL
    DROP VIEW vw_FamilyGroups;
GO

CREATE VIEW vw_FamilyGroups AS
SELECT 
    fg.FamilyGroupId,
    fg.FamilyName,
    fg.PrimaryUserId,
    pu.FirstName + ' ' + pu.LastName as PrimaryUserName,
    pu.Email as PrimaryUserEmail,
    COUNT(u.UserId) as TotalMembers,
    fg.CreatedAt,
    (SELECT STRING_AGG(
        u2.FirstName + ' ' + u2.LastName + ' (' + ISNULL(u2.RelationshipToPrimary, 'Member') + ')', 
        ', '
    ) 
    FROM Users u2 
    WHERE u2.FamilyGroupId = fg.FamilyGroupId) as FamilyMembers
FROM FamilyGroups fg
JOIN Users pu ON fg.PrimaryUserId = pu.UserId
LEFT JOIN Users u ON fg.FamilyGroupId = u.FamilyGroupId
GROUP BY 
    fg.FamilyGroupId, fg.FamilyName, fg.PrimaryUserId, 
    pu.FirstName, pu.LastName, pu.Email, fg.CreatedAt;

GO

-- View: Events with club info
IF OBJECT_ID('vw_EventsWithClubs', 'V') IS NOT NULL
    DROP VIEW vw_EventsWithClubs;
GO

CREATE VIEW vw_EventsWithClubs AS
SELECT 
    e.EventId,
    e.Title,
    e.Description,
    e.EventDate,
    e.Location,
    e.EventType,
    e.EventScope,
    e.HostClubId,
    c.Name as HostClubName,
    c.AvatarUrl as HostClubAvatar,
    e.EventFee,
    e.MaxCapacity,
    e.IsRegistrationRequired,
    e.IsFeatured,
    COUNT(DISTINCT er.RegistrationId) as TotalRegistrations
FROM Events e
LEFT JOIN Clubs c ON e.HostClubId = c.ClubId
LEFT JOIN EventRegistrations er ON e.EventId = er.EventId
GROUP BY 
    e.EventId, e.Title, e.Description, e.EventDate, e.Location,
    e.EventType, e.EventScope, e.HostClubId, c.Name, c.AvatarUrl,
    e.EventFee, e.MaxCapacity, e.IsRegistrationRequired, e.IsFeatured;

GO

-- =====================================================
-- PART 5: STORED PROCEDURES
-- =====================================================

-- Procedure: Assign club admin
IF OBJECT_ID('sp_AssignClubAdmin', 'P') IS NOT NULL
    DROP PROCEDURE sp_AssignClubAdmin;
GO

CREATE PROCEDURE sp_AssignClubAdmin
    @ClubId INT,
    @UserId INT,
    @AssignedBy INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if user is already a club admin
    IF EXISTS (SELECT 1 FROM ClubAdmins WHERE ClubId = @ClubId AND UserId = @UserId)
    BEGIN
        RAISERROR('User is already a club admin', 16, 1);
        RETURN;
    END
    
    -- Check if user is a member of the club
    IF NOT EXISTS (SELECT 1 FROM ClubMemberships WHERE ClubId = @ClubId AND UserId = @UserId)
    BEGIN
        RAISERROR('User must be a club member before becoming an admin', 16, 1);
        RETURN;
    END
    
    INSERT INTO ClubAdmins (ClubId, UserId, AssignedBy)
    VALUES (@ClubId, @UserId, @AssignedBy);
    
    -- Log activity
    INSERT INTO ActivityLogs (UserId, ActivityType, Description)
    VALUES (@AssignedBy, 'ClubAdminAssigned', 
            'Assigned user ' + CAST(@UserId AS NVARCHAR) + ' as admin of club ' + CAST(@ClubId AS NVARCHAR));
END;
GO

-- Procedure: Create family group
IF OBJECT_ID('sp_CreateFamilyGroup', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateFamilyGroup;
GO

CREATE PROCEDURE sp_CreateFamilyGroup
    @FamilyName NVARCHAR(200),
    @PrimaryUserId INT,
    @FamilyGroupId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if primary user already has a family group
    IF EXISTS (SELECT 1 FROM Users WHERE UserId = @PrimaryUserId AND FamilyGroupId IS NOT NULL)
    BEGIN
        RAISERROR('User is already part of a family group', 16, 1);
        RETURN;
    END
    
    BEGIN TRANSACTION;
    
    -- Create family group
    INSERT INTO FamilyGroups (FamilyName, PrimaryUserId)
    VALUES (@FamilyName, @PrimaryUserId);
    
    SET @FamilyGroupId = SCOPE_IDENTITY();
    
    -- Link primary user to family group
    UPDATE Users 
    SET FamilyGroupId = @FamilyGroupId,
        RelationshipToPrimary = 'Primary'
    WHERE UserId = @PrimaryUserId;
    
    COMMIT TRANSACTION;
END;
GO

-- Procedure: Add family member
IF OBJECT_ID('sp_AddFamilyMember', 'P') IS NOT NULL
    DROP PROCEDURE sp_AddFamilyMember;
GO

CREATE PROCEDURE sp_AddFamilyMember
    @FamilyGroupId INT,
    @UserId INT,
    @Relationship NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if user is already in a family group
    IF EXISTS (SELECT 1 FROM Users WHERE UserId = @UserId AND FamilyGroupId IS NOT NULL)
    BEGIN
        RAISERROR('User is already part of a family group', 16, 1);
        RETURN;
    END
    
    UPDATE Users 
    SET FamilyGroupId = @FamilyGroupId,
        RelationshipToPrimary = @Relationship
    WHERE UserId = @UserId;
END;
GO

-- =====================================================
-- PART 6: SAMPLE DATA
-- =====================================================

-- Update existing clubs with descriptions
UPDATE Clubs SET 
    Description = 'Connect with fellow engineers and tech professionals. Share knowledge, collaborate on projects, and advance your career in engineering.',
    FoundedDate = '2020-01-15',
    MeetingSchedule = 'First Thursday of every month at 7:00 PM',
    ContactEmail = 'engineering@casec.org'
WHERE Name = 'Engineering Club';

UPDATE Clubs SET 
    Description = 'Celebrate and preserve our cultural heritage through social events, traditional activities, and community gatherings.',
    FoundedDate = '2019-06-01',
    MeetingSchedule = 'Second Saturday of every month at 6:00 PM',
    ContactEmail = 'social@casec.org'
WHERE Name = 'Social Committee';

-- Sample: Create a family group
DECLARE @FamilyGroupId INT;
EXEC sp_CreateFamilyGroup 
    @FamilyName = 'The Smith Family',
    @PrimaryUserId = 1,  -- Assuming user 1 exists
    @FamilyGroupId = @FamilyGroupId OUTPUT;

-- Sample: Update event to be club-specific
UPDATE Events 
SET EventScope = 'ClubSpecific',
    HostClubId = (SELECT TOP 1 ClubId FROM Clubs WHERE Name = 'Engineering Club')
WHERE Title LIKE '%Workshop%';

-- Sample: Update event to be for all members
UPDATE Events 
SET EventScope = 'AllMembers',
    HostClubId = NULL
WHERE Title LIKE '%Gala%';

GO

-- =====================================================
-- PART 7: FUNCTIONS
-- =====================================================

-- Function: Check if user is club admin
IF OBJECT_ID('fn_IsClubAdmin', 'FN') IS NOT NULL
    DROP FUNCTION fn_IsClubAdmin;
GO

CREATE FUNCTION fn_IsClubAdmin(@UserId INT, @ClubId INT)
RETURNS BIT
AS
BEGIN
    DECLARE @IsAdmin BIT = 0;
    
    IF EXISTS (SELECT 1 FROM ClubAdmins WHERE UserId = @UserId AND ClubId = @ClubId)
        SET @IsAdmin = 1;
        
    RETURN @IsAdmin;
END;
GO

-- Function: Get family total members
IF OBJECT_ID('fn_GetFamilyMemberCount', 'FN') IS NOT NULL
    DROP FUNCTION fn_GetFamilyMemberCount;
GO

CREATE FUNCTION fn_GetFamilyMemberCount(@FamilyGroupId INT)
RETURNS INT
AS
BEGIN
    DECLARE @Count INT;
    
    SELECT @Count = COUNT(*) 
    FROM Users 
    WHERE FamilyGroupId = @FamilyGroupId;
    
    RETURN ISNULL(@Count, 0);
END;
GO

PRINT '========================================';
PRINT 'Migration completed successfully!';
PRINT '========================================';
PRINT 'New Features:';
PRINT '✓ Club descriptions and avatars';
PRINT '✓ Club sub-admin system';
PRINT '✓ Family membership grouping';
PRINT '✓ Event-club linking';
PRINT '✓ Event scope (All Members / Club Specific)';
PRINT '========================================';
PRINT 'New Tables: ClubAdmins, FamilyGroups';
PRINT 'New Views: vw_ClubDetails, vw_FamilyGroups, vw_EventsWithClubs';
PRINT 'New Procedures: sp_AssignClubAdmin, sp_CreateFamilyGroup, sp_AddFamilyMember';
PRINT '========================================';
