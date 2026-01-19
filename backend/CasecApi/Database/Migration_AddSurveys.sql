-- Migration: Add Surveys Feature
-- Date: 2024
-- Description: Creates tables for multi-question surveys

-- Create Surveys table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Surveys')
BEGIN
    CREATE TABLE Surveys (
        SurveyId INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(500) NOT NULL,
        Description NVARCHAR(2000) NULL,
        Visibility NVARCHAR(50) NOT NULL DEFAULT 'Anyone',
        AllowAnonymous BIT NOT NULL DEFAULT 1,
        ShowResultsToRespondents BIT NOT NULL DEFAULT 0,
        AllowEditResponse BIT NOT NULL DEFAULT 0,
        RequireAllQuestions BIT NOT NULL DEFAULT 0,
        ShowProgressBar BIT NOT NULL DEFAULT 1,
        RandomizeQuestions BIT NOT NULL DEFAULT 0,
        OneResponsePerUser BIT NOT NULL DEFAULT 1,
        StartDate DATETIME2 NULL,
        EndDate DATETIME2 NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Draft',
        IsFeatured BIT NOT NULL DEFAULT 0,
        DisplayOrder INT NOT NULL DEFAULT 0,
        ThankYouMessage NVARCHAR(1000) NULL,
        RedirectUrl NVARCHAR(500) NULL,
        CreatedBy INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Surveys_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId) ON DELETE SET NULL
    );

    CREATE INDEX IX_Surveys_Status ON Surveys(Status);
    CREATE INDEX IX_Surveys_IsFeatured ON Surveys(IsFeatured);

    PRINT 'Created Surveys table';
END
GO

-- Create SurveyQuestions table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SurveyQuestions')
BEGIN
    CREATE TABLE SurveyQuestions (
        QuestionId INT IDENTITY(1,1) PRIMARY KEY,
        SurveyId INT NOT NULL,
        QuestionText NVARCHAR(1000) NOT NULL,
        HelpText NVARCHAR(2000) NULL,
        QuestionType NVARCHAR(50) NOT NULL DEFAULT 'SingleChoice',
        IsRequired BIT NOT NULL DEFAULT 0,
        Options NVARCHAR(MAX) NULL, -- JSON array of options
        MaxSelections INT NULL,
        RatingMin INT NULL DEFAULT 1,
        RatingMax INT NULL DEFAULT 5,
        RatingMinLabel NVARCHAR(100) NULL,
        RatingMaxLabel NVARCHAR(100) NULL,
        MinLength INT NULL,
        MaxLength INT NULL,
        MinValue DECIMAL(18,2) NULL,
        MaxValue DECIMAL(18,2) NULL,
        Placeholder NVARCHAR(200) NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        ConditionalOnQuestionId INT NULL,
        ConditionalOnValues NVARCHAR(MAX) NULL, -- JSON array
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_SurveyQuestions_Survey FOREIGN KEY (SurveyId) REFERENCES Surveys(SurveyId) ON DELETE CASCADE,
        CONSTRAINT FK_SurveyQuestions_ConditionalOn FOREIGN KEY (ConditionalOnQuestionId) REFERENCES SurveyQuestions(QuestionId)
    );

    CREATE INDEX IX_SurveyQuestions_SurveyId ON SurveyQuestions(SurveyId);
    CREATE INDEX IX_SurveyQuestions_SurveyId_DisplayOrder ON SurveyQuestions(SurveyId, DisplayOrder);

    PRINT 'Created SurveyQuestions table';
END
GO

-- Create SurveyResponses table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SurveyResponses')
BEGIN
    CREATE TABLE SurveyResponses (
        ResponseId INT IDENTITY(1,1) PRIMARY KEY,
        SurveyId INT NOT NULL,
        UserId INT NULL,
        IsAnonymous BIT NOT NULL DEFAULT 0,
        SessionId NVARCHAR(100) NULL,
        IpAddress NVARCHAR(50) NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'InProgress',
        CurrentQuestionIndex INT NOT NULL DEFAULT 0,
        StartedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CompletedAt DATETIME2 NULL,
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_SurveyResponses_Survey FOREIGN KEY (SurveyId) REFERENCES Surveys(SurveyId) ON DELETE CASCADE,
        CONSTRAINT FK_SurveyResponses_User FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE SET NULL
    );

    CREATE INDEX IX_SurveyResponses_SurveyId ON SurveyResponses(SurveyId);
    CREATE INDEX IX_SurveyResponses_UserId ON SurveyResponses(UserId);
    CREATE INDEX IX_SurveyResponses_SessionId ON SurveyResponses(SessionId);
    CREATE INDEX IX_SurveyResponses_Status ON SurveyResponses(Status);

    PRINT 'Created SurveyResponses table';
END
GO

-- Create SurveyAnswers table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SurveyAnswers')
BEGIN
    CREATE TABLE SurveyAnswers (
        AnswerId INT IDENTITY(1,1) PRIMARY KEY,
        ResponseId INT NOT NULL,
        QuestionId INT NOT NULL,
        SelectedOption NVARCHAR(1000) NULL,
        SelectedOptions NVARCHAR(MAX) NULL, -- JSON array
        RatingValue INT NULL,
        TextValue NVARCHAR(4000) NULL,
        NumberValue DECIMAL(18,2) NULL,
        DateValue DATETIME2 NULL,
        AnsweredAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_SurveyAnswers_Response FOREIGN KEY (ResponseId) REFERENCES SurveyResponses(ResponseId) ON DELETE CASCADE,
        CONSTRAINT FK_SurveyAnswers_Question FOREIGN KEY (QuestionId) REFERENCES SurveyQuestions(QuestionId) ON DELETE CASCADE
    );

    CREATE INDEX IX_SurveyAnswers_ResponseId ON SurveyAnswers(ResponseId);
    CREATE INDEX IX_SurveyAnswers_QuestionId ON SurveyAnswers(QuestionId);
    CREATE UNIQUE INDEX IX_SurveyAnswers_Response_Question ON SurveyAnswers(ResponseId, QuestionId);

    PRINT 'Created SurveyAnswers table';
END
GO

-- Insert sample survey
IF NOT EXISTS (SELECT 1 FROM Surveys WHERE Title = 'Member Satisfaction Survey')
BEGIN
    DECLARE @SurveyId INT;

    INSERT INTO Surveys (Title, Description, Visibility, Status, IsFeatured, ThankYouMessage)
    VALUES (
        'Member Satisfaction Survey',
        'Help us improve by sharing your feedback about our community and events.',
        'Anyone',
        'Active',
        1,
        'Thank you for your valuable feedback! Your responses help us serve you better.'
    );

    SET @SurveyId = SCOPE_IDENTITY();

    -- Question 1: Rating
    INSERT INTO SurveyQuestions (SurveyId, QuestionText, QuestionType, IsRequired, RatingMin, RatingMax, RatingMinLabel, RatingMaxLabel, DisplayOrder)
    VALUES (@SurveyId, 'Overall, how satisfied are you with our community?', 'Rating', 1, 1, 5, 'Very Unsatisfied', 'Very Satisfied', 0);

    -- Question 2: Single Choice
    INSERT INTO SurveyQuestions (SurveyId, QuestionText, QuestionType, IsRequired, Options, DisplayOrder)
    VALUES (@SurveyId, 'How often do you attend our events?', 'SingleChoice', 1,
        '["Every event", "Most events", "Some events", "Rarely", "Never attended"]', 1);

    -- Question 3: Multiple Choice
    INSERT INTO SurveyQuestions (SurveyId, QuestionText, QuestionType, Options, MaxSelections, DisplayOrder)
    VALUES (@SurveyId, 'What types of events would you like to see more of? (Select up to 3)', 'MultipleChoice',
        '["Social gatherings", "Educational workshops", "Cultural celebrations", "Networking events", "Family activities", "Sports/outdoor activities", "Professional development"]', 3, 2);

    -- Question 4: Text
    INSERT INTO SurveyQuestions (SurveyId, QuestionText, QuestionType, HelpText, DisplayOrder)
    VALUES (@SurveyId, 'What do you enjoy most about being part of our community?', 'TextArea',
        'Share what makes our community special to you', 3);

    -- Question 5: Text for suggestions
    INSERT INTO SurveyQuestions (SurveyId, QuestionText, QuestionType, HelpText, DisplayOrder)
    VALUES (@SurveyId, 'Do you have any suggestions for improvement?', 'TextArea',
        'We value your ideas and suggestions', 4);

    PRINT 'Inserted sample survey';
END
GO

PRINT 'Survey migration completed successfully';
