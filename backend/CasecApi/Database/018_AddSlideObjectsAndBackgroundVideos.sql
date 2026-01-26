-- Migration: Add SlideObjects and SlideBackgroundVideos tables
-- Description: Adds object-oriented slide system with animatable objects and background video sequences
-- Date: 2026-01-20

-- Add new columns to Slides table for background settings
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Slides') AND name = 'BackgroundType')
BEGIN
    ALTER TABLE Slides ADD BackgroundType NVARCHAR(20) NOT NULL DEFAULT 'heroVideos';
    PRINT 'Added BackgroundType column to Slides';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Slides') AND name = 'BackgroundColor')
BEGIN
    ALTER TABLE Slides ADD BackgroundColor NVARCHAR(50) NULL;
    PRINT 'Added BackgroundColor column to Slides';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Slides') AND name = 'BackgroundImageUrl')
BEGIN
    ALTER TABLE Slides ADD BackgroundImageUrl NVARCHAR(500) NULL;
    PRINT 'Added BackgroundImageUrl column to Slides';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Slides') AND name = 'UseRandomHeroVideos')
BEGIN
    ALTER TABLE Slides ADD UseRandomHeroVideos BIT NOT NULL DEFAULT 0;
    PRINT 'Added UseRandomHeroVideos column to Slides';
END
GO

-- Create SlideObjects table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SlideObjects')
BEGIN
    CREATE TABLE SlideObjects (
        SlideObjectId INT IDENTITY(1,1) PRIMARY KEY,
        SlideId INT NOT NULL,
        ObjectType NVARCHAR(20) NOT NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        Name NVARCHAR(100) NULL,

        -- Position settings
        HorizontalAlign NVARCHAR(20) NOT NULL DEFAULT 'center',
        VerticalAlign NVARCHAR(20) NOT NULL DEFAULT 'middle',
        OffsetX INT NOT NULL DEFAULT 0,
        OffsetY INT NOT NULL DEFAULT 0,

        -- Animation In settings
        AnimationIn NVARCHAR(50) NOT NULL DEFAULT 'fadeIn',
        AnimationInDelay INT NOT NULL DEFAULT 0,
        AnimationInDuration INT NOT NULL DEFAULT 500,

        -- Animation Out settings
        AnimationOut NVARCHAR(50) NULL,
        AnimationOutDelay INT NULL,
        AnimationOutDuration INT NULL,
        StayOnScreen BIT NOT NULL DEFAULT 1,

        -- Type-specific properties stored as JSON
        Properties NVARCHAR(MAX) NULL,

        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT FK_SlideObjects_Slide FOREIGN KEY (SlideId) REFERENCES Slides(SlideId) ON DELETE CASCADE
    );

    CREATE INDEX IX_SlideObjects_SlideId ON SlideObjects(SlideId);
    CREATE INDEX IX_SlideObjects_SlideId_SortOrder ON SlideObjects(SlideId, SortOrder);

    PRINT 'Created SlideObjects table';
END
ELSE
BEGIN
    PRINT 'SlideObjects table already exists';

    -- Add Name column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SlideObjects') AND name = 'Name')
    BEGIN
        ALTER TABLE SlideObjects ADD Name NVARCHAR(100) NULL;
        PRINT 'Added Name column to SlideObjects';
    END
END
GO

-- Create SlideBackgroundVideos table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SlideBackgroundVideos')
BEGIN
    CREATE TABLE SlideBackgroundVideos (
        SlideBackgroundVideoId INT IDENTITY(1,1) PRIMARY KEY,
        SlideId INT NOT NULL,
        VideoId INT NULL,
        VideoUrl NVARCHAR(500) NULL,
        Duration INT NOT NULL DEFAULT 5000,
        SortOrder INT NOT NULL DEFAULT 0,
        UseRandom BIT NOT NULL DEFAULT 0,

        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT FK_SlideBackgroundVideos_Slide FOREIGN KEY (SlideId) REFERENCES Slides(SlideId) ON DELETE CASCADE,
        CONSTRAINT FK_SlideBackgroundVideos_Video FOREIGN KEY (VideoId) REFERENCES SharedVideos(VideoId) ON DELETE SET NULL
    );

    CREATE INDEX IX_SlideBackgroundVideos_SlideId ON SlideBackgroundVideos(SlideId);
    CREATE INDEX IX_SlideBackgroundVideos_SlideId_SortOrder ON SlideBackgroundVideos(SlideId, SortOrder);

    PRINT 'Created SlideBackgroundVideos table';
END
ELSE
BEGIN
    PRINT 'SlideBackgroundVideos table already exists';
END
GO

-- Verify the migration
SELECT 'SlideObjects' AS TableName, COUNT(*) AS RowCount FROM SlideObjects
UNION ALL
SELECT 'SlideBackgroundVideos', COUNT(*) FROM SlideBackgroundVideos;
GO

PRINT 'Migration 018_AddSlideObjectsAndBackgroundVideos completed successfully';
GO
