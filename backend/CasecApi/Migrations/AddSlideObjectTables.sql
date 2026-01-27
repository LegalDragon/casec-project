-- Migration: Add SlideObjects and SlideBackgroundVideos tables
-- Date: 2026-01-27
-- Description: Creates tables for object-oriented slide content system

-- Create SlideObjects table if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SlideObjects')
BEGIN
    CREATE TABLE [SlideObjects] (
        [SlideObjectId] int NOT NULL IDENTITY,
        [SlideId] int NOT NULL,
        [ObjectType] nvarchar(20) NOT NULL DEFAULT 'text',
        [SortOrder] int NOT NULL DEFAULT 0,
        [Name] nvarchar(100) NULL,
        [HorizontalAlign] nvarchar(20) NOT NULL DEFAULT 'center',
        [VerticalAlign] nvarchar(20) NOT NULL DEFAULT 'middle',
        [OffsetX] int NOT NULL DEFAULT 0,
        [OffsetY] int NOT NULL DEFAULT 0,
        [AnimationIn] nvarchar(50) NOT NULL DEFAULT 'fadeIn',
        [AnimationInDelay] int NOT NULL DEFAULT 0,
        [AnimationInDuration] int NOT NULL DEFAULT 500,
        [AnimationOut] nvarchar(50) NULL,
        [AnimationOutDelay] int NULL,
        [AnimationOutDuration] int NULL,
        [StayOnScreen] bit NOT NULL DEFAULT 1,
        [Properties] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_SlideObjects] PRIMARY KEY ([SlideObjectId]),
        CONSTRAINT [FK_SlideObjects_Slides_SlideId] FOREIGN KEY ([SlideId]) REFERENCES [Slides] ([SlideId]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_SlideObjects_SlideId] ON [SlideObjects] ([SlideId]);
    CREATE INDEX [IX_SlideObjects_SlideId_SortOrder] ON [SlideObjects] ([SlideId], [SortOrder]);

    PRINT 'Created SlideObjects table';
END
ELSE
BEGIN
    PRINT 'SlideObjects table already exists';
END

-- Create SlideBackgroundVideos table if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SlideBackgroundVideos')
BEGIN
    CREATE TABLE [SlideBackgroundVideos] (
        [SlideBackgroundVideoId] int NOT NULL IDENTITY,
        [SlideId] int NOT NULL,
        [VideoId] int NULL,
        [VideoUrl] nvarchar(500) NULL,
        [Duration] int NOT NULL DEFAULT 5000,
        [SortOrder] int NOT NULL DEFAULT 0,
        [UseRandom] bit NOT NULL DEFAULT 0,
        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_SlideBackgroundVideos] PRIMARY KEY ([SlideBackgroundVideoId]),
        CONSTRAINT [FK_SlideBackgroundVideos_Slides_SlideId] FOREIGN KEY ([SlideId]) REFERENCES [Slides] ([SlideId]) ON DELETE CASCADE,
        CONSTRAINT [FK_SlideBackgroundVideos_SharedVideos_VideoId] FOREIGN KEY ([VideoId]) REFERENCES [SharedVideos] ([VideoId]) ON DELETE SET NULL
    );

    CREATE INDEX [IX_SlideBackgroundVideos_SlideId] ON [SlideBackgroundVideos] ([SlideId]);
    CREATE INDEX [IX_SlideBackgroundVideos_SlideId_SortOrder] ON [SlideBackgroundVideos] ([SlideId], [SortOrder]);
    CREATE INDEX [IX_SlideBackgroundVideos_VideoId] ON [SlideBackgroundVideos] ([VideoId]);

    PRINT 'Created SlideBackgroundVideos table';
END
ELSE
BEGIN
    PRINT 'SlideBackgroundVideos table already exists';
END

-- Also add columns to Slides table if they don't exist (new background settings)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Slides' AND COLUMN_NAME = 'BackgroundType')
BEGIN
    ALTER TABLE [Slides] ADD [BackgroundType] nvarchar(20) NOT NULL DEFAULT 'heroVideos';
    PRINT 'Added BackgroundType column to Slides table';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Slides' AND COLUMN_NAME = 'BackgroundColor')
BEGIN
    ALTER TABLE [Slides] ADD [BackgroundColor] nvarchar(50) NULL;
    PRINT 'Added BackgroundColor column to Slides table';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Slides' AND COLUMN_NAME = 'BackgroundImageUrl')
BEGIN
    ALTER TABLE [Slides] ADD [BackgroundImageUrl] nvarchar(500) NULL;
    PRINT 'Added BackgroundImageUrl column to Slides table';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Slides' AND COLUMN_NAME = 'UseRandomHeroVideos')
BEGIN
    ALTER TABLE [Slides] ADD [UseRandomHeroVideos] bit NOT NULL DEFAULT 0;
    PRINT 'Added UseRandomHeroVideos column to Slides table';
END

PRINT 'Migration completed successfully';
