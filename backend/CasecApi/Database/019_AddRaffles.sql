-- Migration: Add Raffle Tables
-- Description: Creates tables for raffle system (raffles, prizes, ticket tiers, participants)

-- Raffles table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Raffles')
BEGIN
    CREATE TABLE Raffles (
        RaffleId INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(500) NULL,
        ImageUrl NVARCHAR(500) NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Draft',
        TicketDigits INT NOT NULL DEFAULT 6,
        NextTicketNumber INT NOT NULL DEFAULT 1,
        TotalTicketsSold INT NOT NULL DEFAULT 0,
        TotalRevenue DECIMAL(10, 2) NOT NULL DEFAULT 0,
        WinningNumber INT NULL,
        RevealedDigits NVARCHAR(20) NULL,
        StartDate DATETIME2 NULL,
        EndDate DATETIME2 NULL,
        DrawingDate DATETIME2 NULL,
        CreatedBy INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Raffles_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId) ON DELETE SET NULL
    );

    CREATE INDEX IX_Raffles_Status ON Raffles(Status);
    CREATE INDEX IX_Raffles_CreatedBy ON Raffles(CreatedBy);

    PRINT 'Created Raffles table';
END
GO

-- RafflePrizes table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RafflePrizes')
BEGIN
    CREATE TABLE RafflePrizes (
        PrizeId INT IDENTITY(1,1) PRIMARY KEY,
        RaffleId INT NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000) NULL,
        ImageUrl NVARCHAR(500) NULL,
        Value DECIMAL(10, 2) NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        IsGrandPrize BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_RafflePrizes_RaffleId FOREIGN KEY (RaffleId) REFERENCES Raffles(RaffleId) ON DELETE CASCADE
    );

    CREATE INDEX IX_RafflePrizes_RaffleId ON RafflePrizes(RaffleId);

    PRINT 'Created RafflePrizes table';
END
GO

-- RaffleTicketTiers table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RaffleTicketTiers')
BEGIN
    CREATE TABLE RaffleTicketTiers (
        TierId INT IDENTITY(1,1) PRIMARY KEY,
        RaffleId INT NOT NULL,
        Name NVARCHAR(100) NOT NULL,
        Price DECIMAL(10, 2) NOT NULL,
        TicketCount INT NOT NULL,
        Description NVARCHAR(500) NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        IsFeatured BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_RaffleTicketTiers_RaffleId FOREIGN KEY (RaffleId) REFERENCES Raffles(RaffleId) ON DELETE CASCADE
    );

    CREATE INDEX IX_RaffleTicketTiers_RaffleId ON RaffleTicketTiers(RaffleId);
    CREATE INDEX IX_RaffleTicketTiers_IsActive ON RaffleTicketTiers(IsActive);

    PRINT 'Created RaffleTicketTiers table';
END
GO

-- RaffleParticipants table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RaffleParticipants')
BEGIN
    CREATE TABLE RaffleParticipants (
        ParticipantId INT IDENTITY(1,1) PRIMARY KEY,
        RaffleId INT NOT NULL,
        Name NVARCHAR(100) NOT NULL,
        PhoneNumber NVARCHAR(30) NOT NULL,
        AvatarUrl NVARCHAR(500) NULL,
        OtpCode NVARCHAR(10) NULL,
        OtpExpiresAt DATETIME2 NULL,
        IsVerified BIT NOT NULL DEFAULT 0,
        VerifiedAt DATETIME2 NULL,
        TicketStart INT NULL,
        TicketEnd INT NULL,
        TotalTickets INT NOT NULL DEFAULT 0,
        TotalPaid DECIMAL(10, 2) NOT NULL DEFAULT 0,
        PaymentStatus NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        PaymentMethod NVARCHAR(100) NULL,
        TransactionId NVARCHAR(100) NULL,
        PaymentDate DATETIME2 NULL,
        IsWinner BIT NOT NULL DEFAULT 0,
        SessionToken NVARCHAR(100) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_RaffleParticipants_RaffleId FOREIGN KEY (RaffleId) REFERENCES Raffles(RaffleId) ON DELETE CASCADE
    );

    CREATE INDEX IX_RaffleParticipants_RaffleId ON RaffleParticipants(RaffleId);
    CREATE INDEX IX_RaffleParticipants_PhoneNumber ON RaffleParticipants(PhoneNumber);
    CREATE INDEX IX_RaffleParticipants_SessionToken ON RaffleParticipants(SessionToken);
    CREATE UNIQUE INDEX IX_RaffleParticipants_RaffleId_PhoneNumber ON RaffleParticipants(RaffleId, PhoneNumber);

    PRINT 'Created RaffleParticipants table';
END
GO

PRINT 'Raffle tables migration completed successfully';
