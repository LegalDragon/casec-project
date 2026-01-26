-- Migration: Add SlideShow tables
-- Description: Creates tables for the SlideShow feature with shared video/image pools
-- Date: 2026-01-19

-- Create SlideShows table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SlideShows')
BEGIN
    CREATE TABLE SlideShows (
        SlideShowId INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(50) NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        TransitionType NVARCHAR(20) NOT NULL DEFAULT 'fade',
        TransitionDuration INT NOT NULL DEFAULT 500,
        ShowProgress BIT NOT NULL DEFAULT 1,
        AllowSkip BIT NOT NULL DEFAULT 1,
        Loop BIT NOT NULL DEFAULT 0,
        AutoPlay BIT NOT NULL DEFAULT 1,
        CreatedBy INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_SlideShows_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId) ON DELETE SET NULL
    );

    CREATE UNIQUE INDEX IX_SlideShows_Code ON SlideShows(Code);
    CREATE INDEX IX_SlideShows_IsActive ON SlideShows(IsActive);

    PRINT 'Created SlideShows table';
END
ELSE
BEGIN
    PRINT 'SlideShows table already exists';
END
GO

-- Create Slides table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Slides')
BEGIN
    CREATE TABLE Slides (
        SlideId INT IDENTITY(1,1) PRIMARY KEY,
        SlideShowId INT NOT NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        Duration INT NOT NULL DEFAULT 5000,
        VideoUrl NVARCHAR(500) NULL,
        UseRandomVideo BIT NOT NULL DEFAULT 0,
        Layout NVARCHAR(20) NOT NULL DEFAULT 'center',
        OverlayType NVARCHAR(20) NOT NULL DEFAULT 'dark',
        OverlayColor NVARCHAR(50) NULL,
        OverlayOpacity INT NOT NULL DEFAULT 50,
        TitleText NVARCHAR(500) NULL,
        TitleAnimation NVARCHAR(50) NOT NULL DEFAULT 'fadeIn',
        TitleDuration INT NOT NULL DEFAULT 800,
        TitleDelay INT NOT NULL DEFAULT 500,
        TitleSize NVARCHAR(20) NULL DEFAULT 'large',
        TitleColor NVARCHAR(50) NULL,
        SubtitleText NVARCHAR(500) NULL,
        SubtitleAnimation NVARCHAR(50) NOT NULL DEFAULT 'fadeIn',
        SubtitleDuration INT NOT NULL DEFAULT 600,
        SubtitleDelay INT NOT NULL DEFAULT 1200,
        SubtitleSize NVARCHAR(20) NULL DEFAULT 'medium',
        SubtitleColor NVARCHAR(50) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Slides_SlideShow FOREIGN KEY (SlideShowId) REFERENCES SlideShows(SlideShowId) ON DELETE CASCADE
    );

    CREATE INDEX IX_Slides_SlideShowId ON Slides(SlideShowId);
    CREATE INDEX IX_Slides_SlideShowId_DisplayOrder ON Slides(SlideShowId, DisplayOrder);

    PRINT 'Created Slides table';
END
ELSE
BEGIN
    PRINT 'Slides table already exists';
END
GO

-- Create SlideImages table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SlideImages')
BEGIN
    CREATE TABLE SlideImages (
        SlideImageId INT IDENTITY(1,1) PRIMARY KEY,
        SlideId INT NOT NULL,
        ImageUrl NVARCHAR(500) NOT NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        Position NVARCHAR(30) NOT NULL DEFAULT 'center',
        Size NVARCHAR(20) NOT NULL DEFAULT 'medium',
        Animation NVARCHAR(50) NOT NULL DEFAULT 'fadeIn',
        Duration INT NOT NULL DEFAULT 500,
        Delay INT NOT NULL DEFAULT 1500,
        BorderRadius NVARCHAR(50) NULL,
        Shadow NVARCHAR(50) NULL,
        Opacity INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_SlideImages_Slide FOREIGN KEY (SlideId) REFERENCES Slides(SlideId) ON DELETE CASCADE
    );

    CREATE INDEX IX_SlideImages_SlideId ON SlideImages(SlideId);
    CREATE INDEX IX_SlideImages_SlideId_DisplayOrder ON SlideImages(SlideId, DisplayOrder);

    PRINT 'Created SlideImages table';
END
ELSE
BEGIN
    PRINT 'SlideImages table already exists';
END
GO

-- Create SharedVideos table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SharedVideos')
BEGIN
    CREATE TABLE SharedVideos (
        VideoId INT IDENTITY(1,1) PRIMARY KEY,
        Url NVARCHAR(500) NOT NULL,
        Title NVARCHAR(200) NULL,
        ThumbnailUrl NVARCHAR(500) NULL,
        Category NVARCHAR(100) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        DisplayOrder INT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_SharedVideos_IsActive ON SharedVideos(IsActive);
    CREATE INDEX IX_SharedVideos_Category ON SharedVideos(Category);
    CREATE INDEX IX_SharedVideos_DisplayOrder ON SharedVideos(DisplayOrder);

    PRINT 'Created SharedVideos table';
END
ELSE
BEGIN
    PRINT 'SharedVideos table already exists';
END
GO

-- Create SharedImages table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SharedImages')
BEGIN
    CREATE TABLE SharedImages (
        ImageId INT IDENTITY(1,1) PRIMARY KEY,
        Url NVARCHAR(500) NOT NULL,
        Title NVARCHAR(200) NULL,
        ThumbnailUrl NVARCHAR(500) NULL,
        Category NVARCHAR(100) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        DisplayOrder INT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_SharedImages_IsActive ON SharedImages(IsActive);
    CREATE INDEX IX_SharedImages_Category ON SharedImages(Category);
    CREATE INDEX IX_SharedImages_DisplayOrder ON SharedImages(DisplayOrder);

    PRINT 'Created SharedImages table';
END
ELSE
BEGIN
    PRINT 'SharedImages table already exists';
END
GO

-- Insert sample slideshow with slides (optional - comment out if not needed)
IF NOT EXISTS (SELECT 1 FROM SlideShows WHERE Code = 'home-intro')
BEGIN
    -- Create sample slideshow
    INSERT INTO SlideShows (Code, Name, Description, IsActive, TransitionType, TransitionDuration, ShowProgress, AllowSkip)
    VALUES ('home-intro', 'Home Page Intro', 'Welcome slideshow for the home page', 1, 'fade', 500, 1, 1);

    DECLARE @SlideShowId INT = SCOPE_IDENTITY();

    -- Create sample slides
    INSERT INTO Slides (SlideShowId, DisplayOrder, Duration, UseRandomVideo, Layout, OverlayType, OverlayOpacity,
                       TitleText, TitleAnimation, TitleDuration, TitleDelay,
                       SubtitleText, SubtitleAnimation, SubtitleDuration, SubtitleDelay)
    VALUES
    (@SlideShowId, 0, 6000, 1, 'center', 'dark', 50,
     'Welcome to Our Community', 'slideUp', 800, 500,
     'Building connections that last a lifetime', 'fadeIn', 600, 1200),

    (@SlideShowId, 1, 5000, 1, 'left', 'gradient', 60,
     'Join Our Events', 'slideUp', 800, 500,
     'Discover exciting activities and meet new friends', 'fadeIn', 600, 1200),

    (@SlideShowId, 2, 5000, 1, 'center', 'dark', 50,
     'Become a Member', 'zoomIn', 800, 500,
     'Unlock exclusive benefits and opportunities', 'fadeIn', 600, 1200);

    PRINT 'Created sample home-intro slideshow with 3 slides';
END
GO

-- Verify the migration
SELECT 'SlideShows' AS TableName, COUNT(*) AS RowCount FROM SlideShows
UNION ALL
SELECT 'Slides', COUNT(*) FROM Slides
UNION ALL
SELECT 'SlideImages', COUNT(*) FROM SlideImages
UNION ALL
SELECT 'SharedVideos', COUNT(*) FROM SharedVideos
UNION ALL
SELECT 'SharedImages', COUNT(*) FROM SharedImages;
GO
