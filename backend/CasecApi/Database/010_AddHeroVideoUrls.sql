-- Migration: Add HeroVideoUrls to ThemeSettings
-- Date: 2024-12-15
-- Description: Adds HeroVideoUrls column to ThemeSettings table for storing hero video URLs as JSON array

-- Add HeroVideoUrls column to ThemeSettings
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ThemeSettings') AND name = 'HeroVideoUrls')
BEGIN
    ALTER TABLE ThemeSettings
    ADD HeroVideoUrls NVARCHAR(MAX) NULL;

    PRINT 'Added HeroVideoUrls column to ThemeSettings table';
END
ELSE
BEGIN
    PRINT 'HeroVideoUrls column already exists in ThemeSettings table';
END
GO
