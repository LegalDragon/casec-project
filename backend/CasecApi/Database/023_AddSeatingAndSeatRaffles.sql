-- Migration: Add Seating Charts and Seat Raffles
-- Description: Creates tables for seating chart management and seat-based raffles

-- SeatingCharts table - stores chart metadata
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SeatingCharts')
BEGIN
    CREATE TABLE SeatingCharts (
        ChartId INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(500) NULL,
        EventId INT NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, Active, Archived
        TotalSeats INT NOT NULL DEFAULT 0,
        OccupiedSeats INT NOT NULL DEFAULT 0,
        CreatedBy INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_SeatingCharts_EventId FOREIGN KEY (EventId) REFERENCES Events(EventId) ON DELETE SET NULL,
        CONSTRAINT FK_SeatingCharts_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId) ON DELETE SET NULL
    );

    CREATE INDEX IX_SeatingCharts_Status ON SeatingCharts(Status);
    CREATE INDEX IX_SeatingCharts_EventId ON SeatingCharts(EventId);

    PRINT 'Created SeatingCharts table';
END
GO

-- SeatingSections table - stores sections within a chart (Orchestra Left, Balcony Center, etc.)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SeatingSections')
BEGIN
    CREATE TABLE SeatingSections (
        SectionId INT IDENTITY(1,1) PRIMARY KEY,
        ChartId INT NOT NULL,
        Name NVARCHAR(100) NOT NULL, -- e.g., "Orchestra Left", "Balcony Center"
        ShortName NVARCHAR(50) NOT NULL, -- e.g., "Orch-Left", "Balc-Center"
        DisplayOrder INT NOT NULL DEFAULT 0,
        RowPrefix NVARCHAR(10) NULL, -- Optional prefix for rows in this section
        SeatsPerRow INT NOT NULL DEFAULT 10,
        RowLabels NVARCHAR(500) NULL, -- Comma-separated row labels, e.g., "A,B,C,D,E,F"
        StartSeatNumber INT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_SeatingSections_ChartId FOREIGN KEY (ChartId) REFERENCES SeatingCharts(ChartId) ON DELETE CASCADE
    );

    CREATE INDEX IX_SeatingSections_ChartId ON SeatingSections(ChartId);

    PRINT 'Created SeatingSections table';
END
GO

-- SeatingSeats table - individual seats with optional attendee info
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SeatingSeats')
BEGIN
    CREATE TABLE SeatingSeats (
        SeatId INT IDENTITY(1,1) PRIMARY KEY,
        ChartId INT NOT NULL,
        SectionId INT NOT NULL,
        RowLabel NVARCHAR(10) NOT NULL, -- e.g., "A", "BB"
        SeatNumber INT NOT NULL,
        SeatLabel NVARCHAR(50) NULL, -- Display label if different from number
        Status NVARCHAR(50) NOT NULL DEFAULT 'Available', -- Available, Occupied, Reserved, Blocked
        AttendeeName NVARCHAR(200) NULL,
        AttendeePhone NVARCHAR(50) NULL,
        AttendeeEmail NVARCHAR(200) NULL,
        AttendeeNotes NVARCHAR(500) NULL,
        TableNumber INT NULL, -- For table-based layouts
        IsVIP BIT NOT NULL DEFAULT 0,
        IsAccessible BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_SeatingSeats_ChartId FOREIGN KEY (ChartId) REFERENCES SeatingCharts(ChartId) ON DELETE CASCADE,
        CONSTRAINT FK_SeatingSeats_SectionId FOREIGN KEY (SectionId) REFERENCES SeatingSections(SectionId) ON DELETE NO ACTION
    );

    CREATE INDEX IX_SeatingSeats_ChartId ON SeatingSeats(ChartId);
    CREATE INDEX IX_SeatingSeats_SectionId ON SeatingSeats(SectionId);
    CREATE INDEX IX_SeatingSeats_Status ON SeatingSeats(Status);
    CREATE UNIQUE INDEX IX_SeatingSeats_Unique ON SeatingSeats(ChartId, SectionId, RowLabel, SeatNumber);

    PRINT 'Created SeatingSeats table';
END
GO

-- SeatRaffles table - seat-based raffle configuration
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SeatRaffles')
BEGIN
    CREATE TABLE SeatRaffles (
        SeatRaffleId INT IDENTITY(1,1) PRIMARY KEY,
        ChartId INT NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(500) NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, Active, Running, Completed
        
        -- Theme settings
        BackgroundImageUrl NVARCHAR(500) NULL,
        BackgroundColor NVARCHAR(50) NULL DEFAULT '#1a1a2e',
        BackgroundGradient NVARCHAR(200) NULL,
        PrimaryColor NVARCHAR(50) NULL DEFAULT '#a855f7',
        SecondaryColor NVARCHAR(50) NULL DEFAULT '#ec4899',
        WinnerColor NVARCHAR(50) NULL DEFAULT '#22c55e',
        TextColor NVARCHAR(50) NULL DEFAULT '#ffffff',
        SeatColor NVARCHAR(50) NULL DEFAULT '#3a3a5a',
        SeatHighlightColor NVARCHAR(50) NULL DEFAULT '#fbbf24',
        
        -- Raffle settings
        RequireOccupied BIT NOT NULL DEFAULT 1, -- Only occupied seats can win
        AllowRepeatWinners BIT NOT NULL DEFAULT 0,
        AnimationSpeed INT NOT NULL DEFAULT 100, -- ms between highlights
        AnimationSteps INT NOT NULL DEFAULT 35,
        ShowAttendeeName BIT NOT NULL DEFAULT 1,
        ShowAttendeePhone BIT NOT NULL DEFAULT 0,
        
        -- Prize info
        PrizeName NVARCHAR(200) NULL,
        PrizeDescription NVARCHAR(500) NULL,
        PrizeImageUrl NVARCHAR(500) NULL,
        PrizeValue DECIMAL(10,2) NULL,
        
        CreatedBy INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_SeatRaffles_ChartId FOREIGN KEY (ChartId) REFERENCES SeatingCharts(ChartId) ON DELETE CASCADE,
        CONSTRAINT FK_SeatRaffles_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId) ON DELETE SET NULL
    );

    CREATE INDEX IX_SeatRaffles_ChartId ON SeatRaffles(ChartId);
    CREATE INDEX IX_SeatRaffles_Status ON SeatRaffles(Status);

    PRINT 'Created SeatRaffles table';
END
GO

-- SeatRaffleExclusions table - seats excluded from raffle
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SeatRaffleExclusions')
BEGIN
    CREATE TABLE SeatRaffleExclusions (
        ExclusionId INT IDENTITY(1,1) PRIMARY KEY,
        SeatRaffleId INT NOT NULL,
        SeatId INT NOT NULL,
        Reason NVARCHAR(200) NULL, -- e.g., "VIP", "Organizer", "Sponsor"
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_SeatRaffleExclusions_SeatRaffleId FOREIGN KEY (SeatRaffleId) REFERENCES SeatRaffles(SeatRaffleId) ON DELETE CASCADE,
        CONSTRAINT FK_SeatRaffleExclusions_SeatId FOREIGN KEY (SeatId) REFERENCES SeatingSeats(SeatId) ON DELETE NO ACTION
    );

    CREATE UNIQUE INDEX IX_SeatRaffleExclusions_Unique ON SeatRaffleExclusions(SeatRaffleId, SeatId);

    PRINT 'Created SeatRaffleExclusions table';
END
GO

-- SeatRaffleTargets table - if set, ONLY these seats can win (optional)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SeatRaffleTargets')
BEGIN
    CREATE TABLE SeatRaffleTargets (
        TargetId INT IDENTITY(1,1) PRIMARY KEY,
        SeatRaffleId INT NOT NULL,
        SeatId INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_SeatRaffleTargets_SeatRaffleId FOREIGN KEY (SeatRaffleId) REFERENCES SeatRaffles(SeatRaffleId) ON DELETE CASCADE,
        CONSTRAINT FK_SeatRaffleTargets_SeatId FOREIGN KEY (SeatId) REFERENCES SeatingSeats(SeatId) ON DELETE NO ACTION
    );

    CREATE UNIQUE INDEX IX_SeatRaffleTargets_Unique ON SeatRaffleTargets(SeatRaffleId, SeatId);

    PRINT 'Created SeatRaffleTargets table';
END
GO

-- SeatRaffleWinners table - track winners
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SeatRaffleWinners')
BEGIN
    CREATE TABLE SeatRaffleWinners (
        WinnerId INT IDENTITY(1,1) PRIMARY KEY,
        SeatRaffleId INT NOT NULL,
        SeatId INT NOT NULL,
        DrawNumber INT NOT NULL DEFAULT 1, -- Which draw (1st, 2nd, 3rd winner, etc.)
        AttendeeName NVARCHAR(200) NULL,
        AttendeePhone NVARCHAR(50) NULL,
        SectionName NVARCHAR(100) NULL,
        RowLabel NVARCHAR(10) NULL,
        SeatNumber INT NULL,
        IsTestDraw BIT NOT NULL DEFAULT 0,
        DrawnAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        DrawnBy INT NULL,
        CONSTRAINT FK_SeatRaffleWinners_SeatRaffleId FOREIGN KEY (SeatRaffleId) REFERENCES SeatRaffles(SeatRaffleId) ON DELETE CASCADE,
        CONSTRAINT FK_SeatRaffleWinners_SeatId FOREIGN KEY (SeatId) REFERENCES SeatingSeats(SeatId) ON DELETE NO ACTION,
        CONSTRAINT FK_SeatRaffleWinners_DrawnBy FOREIGN KEY (DrawnBy) REFERENCES Users(UserId) ON DELETE SET NULL
    );

    CREATE INDEX IX_SeatRaffleWinners_SeatRaffleId ON SeatRaffleWinners(SeatRaffleId);

    PRINT 'Created SeatRaffleWinners table';
END
GO

PRINT 'Seating and Seat Raffle tables migration completed successfully';
