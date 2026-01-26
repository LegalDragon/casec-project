-- Migration: Add Polls feature
-- Date: 2025-12-17
-- Description: Creates tables for the polling/survey feature

-- Create Polls table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Polls')
BEGIN
    CREATE TABLE Polls (
        PollId INT IDENTITY(1,1) PRIMARY KEY,
        Question NVARCHAR(500) NOT NULL,
        Description NVARCHAR(2000) NULL,
        PollType NVARCHAR(50) NOT NULL DEFAULT 'SingleChoice', -- SingleChoice, MultipleChoice, Rating, Text
        Visibility NVARCHAR(50) NOT NULL DEFAULT 'Anyone', -- Anyone, MembersOnly
        AllowAnonymous BIT NOT NULL DEFAULT 1,
        ShowResultsToVoters BIT NOT NULL DEFAULT 1,
        AllowChangeVote BIT NOT NULL DEFAULT 0,
        MaxSelections INT NULL, -- For MultipleChoice
        RatingMin INT NULL DEFAULT 1, -- For Rating type
        RatingMax INT NULL DEFAULT 5, -- For Rating type
        StartDate DATETIME2 NULL,
        EndDate DATETIME2 NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, Active, Closed
        IsFeatured BIT NOT NULL DEFAULT 0,
        DisplayOrder INT NOT NULL DEFAULT 0,
        CreatedBy INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Polls_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId) ON DELETE SET NULL
    );

    CREATE INDEX IX_Polls_Status ON Polls(Status);
    CREATE INDEX IX_Polls_IsFeatured ON Polls(IsFeatured);
    CREATE INDEX IX_Polls_CreatedBy ON Polls(CreatedBy);

    PRINT 'Created Polls table';
END
ELSE
BEGIN
    PRINT 'Polls table already exists';
END
GO

-- Create PollOptions table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PollOptions')
BEGIN
    CREATE TABLE PollOptions (
        OptionId INT IDENTITY(1,1) PRIMARY KEY,
        PollId INT NOT NULL,
        OptionText NVARCHAR(500) NOT NULL,
        ImageUrl NVARCHAR(500) NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_PollOptions_Poll FOREIGN KEY (PollId) REFERENCES Polls(PollId) ON DELETE CASCADE
    );

    CREATE INDEX IX_PollOptions_PollId ON PollOptions(PollId);

    PRINT 'Created PollOptions table';
END
ELSE
BEGIN
    PRINT 'PollOptions table already exists';
END
GO

-- Create PollResponses table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PollResponses')
BEGIN
    CREATE TABLE PollResponses (
        ResponseId INT IDENTITY(1,1) PRIMARY KEY,
        PollId INT NOT NULL,
        SelectedOptionIds NVARCHAR(500) NULL, -- Comma-separated option IDs
        RatingValue INT NULL,
        TextResponse NVARCHAR(4000) NULL,
        UserId INT NULL, -- NULL for guest voters
        IsAnonymous BIT NOT NULL DEFAULT 0,
        SessionId NVARCHAR(100) NULL, -- For tracking guest votes
        IpAddress NVARCHAR(50) NULL,
        RespondedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_PollResponses_Poll FOREIGN KEY (PollId) REFERENCES Polls(PollId) ON DELETE CASCADE,
        CONSTRAINT FK_PollResponses_User FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE SET NULL
    );

    CREATE INDEX IX_PollResponses_PollId ON PollResponses(PollId);
    CREATE INDEX IX_PollResponses_UserId ON PollResponses(UserId);
    CREATE INDEX IX_PollResponses_SessionId ON PollResponses(SessionId);

    PRINT 'Created PollResponses table';
END
ELSE
BEGIN
    PRINT 'PollResponses table already exists';
END
GO

-- Insert a sample poll (optional - can be removed for production)
-- This creates a welcome poll to demonstrate the feature
IF NOT EXISTS (SELECT * FROM Polls WHERE Question = 'How did you hear about us?')
BEGIN
    DECLARE @PollId INT;

    INSERT INTO Polls (Question, Description, PollType, Visibility, AllowAnonymous, ShowResultsToVoters, AllowChangeVote, Status, IsFeatured, DisplayOrder)
    VALUES (
        'How did you hear about us?',
        'We''d love to know how you discovered our community!',
        'SingleChoice',
        'Anyone',
        1,
        1,
        0,
        'Active',
        1,
        0
    );

    SET @PollId = SCOPE_IDENTITY();

    INSERT INTO PollOptions (PollId, OptionText, DisplayOrder) VALUES
    (@PollId, 'Friend or family referral', 0),
    (@PollId, 'Social media', 1),
    (@PollId, 'Search engine', 2),
    (@PollId, 'Community event', 3),
    (@PollId, 'Other', 4);

    PRINT 'Inserted sample poll';
END
GO

PRINT 'Migration completed successfully';
GO
