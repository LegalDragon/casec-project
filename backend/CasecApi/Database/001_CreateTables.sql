-- CASEC Database Schema
-- SQL Server Database Setup

USE master;
GO

-- Create Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'CasecDB')
BEGIN
    CREATE DATABASE CasecDB;
END
GO

USE CasecDB;
GO

-- MembershipTypes Table (Admin Manageable)
CREATE TABLE MembershipTypes (
    MembershipTypeId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    AnnualFee DECIMAL(10,2) NOT NULL,
    MaxFamilyMembers INT DEFAULT 1,
    CanManageClubs BIT DEFAULT 0,
    CanManageEvents BIT DEFAULT 0,
    HasBoardVotingRights BIT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    DisplayOrder INT DEFAULT 0,
    Icon NVARCHAR(50),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);
GO

-- Users/Members Table
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(20),
    Address NVARCHAR(255),
    City NVARCHAR(100),
    State NVARCHAR(50),
    ZipCode NVARCHAR(20),
    Profession NVARCHAR(150),
    Hobbies NVARCHAR(500),
    Bio NVARCHAR(2000),
    MembershipTypeId INT NOT NULL,
    IsAdmin BIT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    MemberSince DATETIME2 DEFAULT GETDATE(),
    LastLoginAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (MembershipTypeId) REFERENCES MembershipTypes(MembershipTypeId)
);
GO

-- Family Members Table (for Family and Director memberships)
CREATE TABLE FamilyMembers (
    FamilyMemberId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    DateOfBirth DATE,
    Relationship NVARCHAR(50),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);
GO

-- Clubs Table (Admin Manageable)
CREATE TABLE Clubs (
    ClubId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(200) NOT NULL UNIQUE,
    Description NVARCHAR(1000),
    Icon NVARCHAR(50),
    MeetingFrequency NVARCHAR(100),
    MeetingDay NVARCHAR(50),
    MeetingTime TIME,
    Location NVARCHAR(255),
    MaxMembers INT,
    IsActive BIT DEFAULT 1,
    CreatedById INT,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (CreatedById) REFERENCES Users(UserId)
);
GO

-- Club Memberships (Junction Table)
CREATE TABLE ClubMemberships (
    ClubMembershipId INT PRIMARY KEY IDENTITY(1,1),
    ClubId INT NOT NULL,
    UserId INT NOT NULL,
    Role NVARCHAR(50) DEFAULT 'Member', -- Member, Leader, Co-Leader
    JoinedAt DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (ClubId) REFERENCES Clubs(ClubId) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    UNIQUE(ClubId, UserId)
);
GO

-- Events Table (Admin/Director Manageable)
CREATE TABLE Events (
    EventId INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(2000),
    EventDate DATETIME2 NOT NULL,
    EndDate DATETIME2,
    Location NVARCHAR(255),
    MaxAttendees INT,
    RegistrationDeadline DATETIME2,
    EventFee DECIMAL(10,2) DEFAULT 0,
    IsFamilyEvent BIT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedById INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (CreatedById) REFERENCES Users(UserId)
);
GO

-- Event Registrations Table
CREATE TABLE EventRegistrations (
    RegistrationId INT PRIMARY KEY IDENTITY(1,1),
    EventId INT NOT NULL,
    UserId INT NOT NULL,
    NumberOfGuests INT DEFAULT 0,
    TotalAmount DECIMAL(10,2) DEFAULT 0,
    PaymentStatus NVARCHAR(50) DEFAULT 'Pending', -- Pending, Completed, Cancelled
    RegistrationStatus NVARCHAR(50) DEFAULT 'Registered', -- Registered, Waitlisted, Cancelled
    RegistrationDate DATETIME2 DEFAULT GETDATE(),
    CancellationDate DATETIME2,
    Notes NVARCHAR(1000),
    FOREIGN KEY (EventId) REFERENCES Events(EventId) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    UNIQUE(EventId, UserId)
);
GO

-- Membership Payments Table
CREATE TABLE MembershipPayments (
    PaymentId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    MembershipTypeId INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PaymentDate DATETIME2 DEFAULT GETDATE(),
    PaymentMethod NVARCHAR(50), -- CreditCard, Check, Cash, Online
    TransactionId NVARCHAR(255),
    PaymentStatus NVARCHAR(50) DEFAULT 'Completed', -- Pending, Completed, Failed, Refunded
    ValidFrom DATE NOT NULL,
    ValidUntil DATE NOT NULL,
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    FOREIGN KEY (MembershipTypeId) REFERENCES MembershipTypes(MembershipTypeId)
);
GO

-- Activity Log Table
CREATE TABLE ActivityLog (
    LogId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT,
    ActivityType NVARCHAR(100) NOT NULL, -- Login, ClubJoin, EventRegister, ProfileUpdate, etc.
    Description NVARCHAR(500),
    IpAddress NVARCHAR(50),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

-- Insert Default Membership Types
INSERT INTO MembershipTypes (Name, Description, AnnualFee, MaxFamilyMembers, CanManageClubs, CanManageEvents, HasBoardVotingRights, DisplayOrder, Icon)
VALUES 
    ('Individual', 'Perfect for individual professionals and enthusiasts. Full platform access with member benefits.', 50.00, 1, 0, 0, 0, 1, '👤'),
    ('Family', 'Bring your whole family into the community. Up to 4 family members with shared benefits.', 120.00, 4, 0, 0, 0, 2, '👨‍👩‍👧‍👦'),
    ('Director', 'Leadership role with additional privileges. Full administrative access and board voting rights.', 200.00, 4, 1, 1, 1, 3, '⭐');
GO

-- Insert Default Clubs
INSERT INTO Clubs (Name, Description, Icon, MeetingFrequency, MaxMembers)
VALUES 
    ('Book Club', 'Discuss bestsellers, classics, and hidden gems. Monthly meetings and lively discussions about literature.', '📚', 'Monthly', NULL),
    ('Tennis Enthusiasts', 'Play tennis, improve your skills, and participate in friendly tournaments.', '🎾', 'Weekly', NULL),
    ('Art & Culture', 'Explore galleries, create art together, and celebrate cultural diversity through various artistic expressions.', '🎨', 'Bi-weekly', NULL),
    ('Culinary Circle', 'Share recipes, host potlucks, and discover new cuisines from around the world.', '🍳', 'Monthly', NULL),
    ('Tech & Innovation', 'Stay updated with latest tech trends, share knowledge, and collaborate on innovative projects.', '💻', 'Weekly', NULL),
    ('Green Thumb Society', 'Garden together, share sustainable living tips, and grow organic communities.', '🌱', 'Monthly', NULL);
GO

-- Insert Sample Events
INSERT INTO Events (Title, Description, EventDate, EndDate, Location, MaxAttendees, EventFee, CreatedById)
VALUES 
    ('Annual Gala Dinner', 'Celebrate the year''s achievements with our community in an elegant evening of dining and entertainment.', '2024-12-15 18:00:00', '2024-12-15 22:00:00', 'Grand Ballroom', 200, 75.00, 1),
    ('New Year Networking Mixer', 'Kick off the new year with networking opportunities and refreshments in a casual atmosphere.', '2025-01-05 19:00:00', '2025-01-05 21:00:00', 'Community Center', 100, 25.00, 1),
    ('Family Picnic Day', 'Fun activities, games, and food for the whole family. Bring your loved ones for a day of outdoor fun.', '2025-01-20 11:00:00', '2025-01-20 16:00:00', 'Riverside Park', 250, 0.00, 1),
    ('Professional Development Workshop', 'Leadership skills and career advancement strategies with industry experts and interactive sessions.', '2025-02-10 09:00:00', '2025-02-10 15:00:00', 'Conference Room A', 50, 50.00, 1);
GO

-- Create Indexes for Performance
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_MembershipTypeId ON Users(MembershipTypeId);
CREATE INDEX IX_ClubMemberships_UserId ON ClubMemberships(UserId);
CREATE INDEX IX_ClubMemberships_ClubId ON ClubMemberships(ClubId);
CREATE INDEX IX_EventRegistrations_UserId ON EventRegistrations(UserId);
CREATE INDEX IX_EventRegistrations_EventId ON EventRegistrations(EventId);
CREATE INDEX IX_MembershipPayments_UserId ON MembershipPayments(UserId);
CREATE INDEX IX_Events_EventDate ON Events(EventDate);
GO

-- Create Views for Common Queries

-- View: User Dashboard Summary
CREATE VIEW vw_UserDashboard AS
SELECT 
    u.UserId,
    u.FirstName,
    u.LastName,
    u.Email,
    mt.Name AS MembershipType,
    mt.AnnualFee,
    COUNT(DISTINCT cm.ClubId) AS ClubCount,
    COUNT(DISTINCT er.EventId) AS EventCount,
    MAX(mp.ValidUntil) AS MembershipExpiry
FROM Users u
INNER JOIN MembershipTypes mt ON u.MembershipTypeId = mt.MembershipTypeId
LEFT JOIN ClubMemberships cm ON u.UserId = cm.UserId AND cm.IsActive = 1
LEFT JOIN EventRegistrations er ON u.UserId = er.UserId AND er.RegistrationStatus = 'Registered'
LEFT JOIN MembershipPayments mp ON u.UserId = mp.UserId AND mp.PaymentStatus = 'Completed'
WHERE u.IsActive = 1
GROUP BY u.UserId, u.FirstName, u.LastName, u.Email, mt.Name, mt.AnnualFee;
GO

-- View: Club Statistics
CREATE VIEW vw_ClubStatistics AS
SELECT 
    c.ClubId,
    c.Name,
    c.Description,
    c.Icon,
    c.MeetingFrequency,
    COUNT(cm.UserId) AS MemberCount,
    c.MaxMembers,
    c.IsActive
FROM Clubs c
LEFT JOIN ClubMemberships cm ON c.ClubId = cm.ClubId AND cm.IsActive = 1
GROUP BY c.ClubId, c.Name, c.Description, c.Icon, c.MeetingFrequency, c.MaxMembers, c.IsActive;
GO

-- View: Event Statistics
CREATE VIEW vw_EventStatistics AS
SELECT 
    e.EventId,
    e.Title,
    e.Description,
    e.EventDate,
    e.EndDate,
    e.Location,
    e.EventFee,
    COUNT(er.UserId) AS RegisteredCount,
    SUM(er.NumberOfGuests) AS TotalGuests,
    e.MaxAttendees,
    e.MaxAttendees - COUNT(er.UserId) AS SpotsRemaining,
    e.IsActive
FROM Events e
LEFT JOIN EventRegistrations er ON e.EventId = er.EventId AND er.RegistrationStatus = 'Registered'
GROUP BY e.EventId, e.Title, e.Description, e.EventDate, e.EndDate, e.Location, e.EventFee, e.MaxAttendees, e.IsActive;
GO

-- Stored Procedures

-- Register User Procedure
CREATE PROCEDURE sp_RegisterUser
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100),
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255),
    @PhoneNumber NVARCHAR(20),
    @MembershipTypeId INT,
    @Address NVARCHAR(255) = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(50) = NULL,
    @ZipCode NVARCHAR(20) = NULL,
    @Profession NVARCHAR(150) = NULL,
    @Hobbies NVARCHAR(500) = NULL,
    @Bio NVARCHAR(2000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
    BEGIN
        RAISERROR('Email already registered', 16, 1);
        RETURN -1;
    END
    
    -- Insert new user
    INSERT INTO Users (FirstName, LastName, Email, PasswordHash, PhoneNumber, 
                       MembershipTypeId, Address, City, State, ZipCode, 
                       Profession, Hobbies, Bio)
    VALUES (@FirstName, @LastName, @Email, @PasswordHash, @PhoneNumber,
            @MembershipTypeId, @Address, @City, @State, @ZipCode,
            @Profession, @Hobbies, @Bio);
    
    -- Return the new user ID
    SELECT SCOPE_IDENTITY() AS UserId;
END
GO

-- Process Membership Payment Procedure
CREATE PROCEDURE sp_ProcessMembershipPayment
    @UserId INT,
    @MembershipTypeId INT,
    @Amount DECIMAL(10,2),
    @PaymentMethod NVARCHAR(50),
    @TransactionId NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ValidFrom DATE = CAST(GETDATE() AS DATE);
    DECLARE @ValidUntil DATE = DATEADD(YEAR, 1, @ValidFrom);
    
    INSERT INTO MembershipPayments (UserId, MembershipTypeId, Amount, PaymentMethod, 
                                    TransactionId, ValidFrom, ValidUntil, PaymentStatus)
    VALUES (@UserId, @MembershipTypeId, @Amount, @PaymentMethod, 
            @TransactionId, @ValidFrom, @ValidUntil, 'Completed');
    
    SELECT SCOPE_IDENTITY() AS PaymentId;
END
GO

PRINT 'Database schema created successfully!';
GO
