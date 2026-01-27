-- Migration: Add DefaultSlideInterval column to SlideShows table
-- Date: 2026-01-27
-- Description: Adds the DefaultSlideInterval column that was missing

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'SlideShows' AND COLUMN_NAME = 'DefaultSlideInterval'
)
BEGIN
    ALTER TABLE [SlideShows] ADD [DefaultSlideInterval] int NOT NULL DEFAULT 5000;
    PRINT 'Added DefaultSlideInterval column to SlideShows table';
END
ELSE
BEGIN
    PRINT 'DefaultSlideInterval column already exists';
END

PRINT 'Migration completed successfully';
