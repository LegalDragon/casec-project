-- Add ChineseName column to Users table
-- Run this script on the database to add support for Chinese names

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Users') AND name = 'ChineseName'
)
BEGIN
    ALTER TABLE Users
    ADD ChineseName NVARCHAR(100) NULL;

    PRINT 'ChineseName column added to Users table';
END
ELSE
BEGIN
    PRINT 'ChineseName column already exists';
END
