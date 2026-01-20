-- Migration: Add SlideObjects and SlideBackgroundVideos
-- Date: 2026-01-20
-- Description: Adds object-oriented slideshow system with SlideObject and SlideBackgroundVideo tables

-- ============================================
-- 1. Add new columns to Slides table
-- ============================================

-- Add BackgroundType column (default to 'heroVideos' for backwards compatibility)
ALTER TABLE Slides ADD COLUMN IF NOT EXISTS BackgroundType VARCHAR(20) DEFAULT 'heroVideos';

-- Add BackgroundColor column
ALTER TABLE Slides ADD COLUMN IF NOT EXISTS BackgroundColor VARCHAR(50) NULL;

-- Add BackgroundImageUrl column
ALTER TABLE Slides ADD COLUMN IF NOT EXISTS BackgroundImageUrl VARCHAR(500) NULL;

-- Add UseRandomHeroVideos column
ALTER TABLE Slides ADD COLUMN IF NOT EXISTS UseRandomHeroVideos BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. Create SlideObjects table
-- ============================================

CREATE TABLE IF NOT EXISTS SlideObjects (
    SlideObjectId SERIAL PRIMARY KEY,
    SlideId INTEGER NOT NULL REFERENCES Slides(SlideId) ON DELETE CASCADE,

    -- Object type: 'text', 'image', 'video'
    ObjectType VARCHAR(20) NOT NULL DEFAULT 'text',

    SortOrder INTEGER DEFAULT 0,

    -- Position
    HorizontalAlign VARCHAR(20) DEFAULT 'center',
    VerticalAlign VARCHAR(20) DEFAULT 'middle',
    OffsetX INTEGER DEFAULT 0,
    OffsetY INTEGER DEFAULT 0,

    -- Animation In
    AnimationIn VARCHAR(50) DEFAULT 'fadeIn',
    AnimationInDelay INTEGER DEFAULT 0,
    AnimationInDuration INTEGER DEFAULT 500,

    -- Animation Out
    AnimationOut VARCHAR(50) NULL,
    AnimationOutDelay INTEGER NULL,
    AnimationOutDuration INTEGER NULL,
    StayOnScreen BOOLEAN DEFAULT TRUE,

    -- Type-specific properties (JSON)
    Properties TEXT NULL,

    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS IX_SlideObjects_SlideId ON SlideObjects(SlideId);

-- ============================================
-- 3. Create SlideBackgroundVideos table
-- ============================================

CREATE TABLE IF NOT EXISTS SlideBackgroundVideos (
    SlideBackgroundVideoId SERIAL PRIMARY KEY,
    SlideId INTEGER NOT NULL REFERENCES Slides(SlideId) ON DELETE CASCADE,

    -- Reference to SharedVideo (optional)
    VideoId INTEGER NULL REFERENCES SharedVideos(VideoId) ON DELETE SET NULL,

    -- Direct video URL (alternative to VideoId)
    VideoUrl VARCHAR(500) NULL,

    -- Duration to show this video (in ms)
    Duration INTEGER DEFAULT 5000,

    SortOrder INTEGER DEFAULT 0,

    -- If true, pick random from shared pool
    UseRandom BOOLEAN DEFAULT FALSE,

    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS IX_SlideBackgroundVideos_SlideId ON SlideBackgroundVideos(SlideId);
CREATE INDEX IF NOT EXISTS IX_SlideBackgroundVideos_VideoId ON SlideBackgroundVideos(VideoId);

-- ============================================
-- 4. Update existing slides to use new system
-- ============================================

-- For existing slides that have VideoUrl set, keep them working with legacy fields
-- The BackgroundType defaults to 'heroVideos' which will use the new system
-- But the frontend will fall back to legacy VideoUrl if no BackgroundVideos exist

-- Done!
SELECT 'Migration completed successfully' AS Status;
