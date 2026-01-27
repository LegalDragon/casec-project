-- Migration: Add Status column to SharedImages table
-- Date: 2026-01-26
-- Description: Adds the Status column that was missing from the SharedImages table

-- Check if column exists before adding
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'SharedImages' AND COLUMN_NAME = 'Status'
)
BEGIN
    ALTER TABLE [SharedImages] ADD [Status] nvarchar(50) NOT NULL DEFAULT 'Active';
    PRINT 'Added Status column to SharedImages table';
END
ELSE
BEGIN
    PRINT 'Status column already exists in SharedImages table';
END

-- Create index if it doesn't exist
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_SharedImages_Status' AND object_id = OBJECT_ID('SharedImages')
)
BEGIN
    CREATE INDEX [IX_SharedImages_Status] ON [SharedImages] ([Status]);
    PRINT 'Created index IX_SharedImages_Status';
END
ELSE
BEGIN
    PRINT 'Index IX_SharedImages_Status already exists';
END

PRINT 'Migration completed successfully';
