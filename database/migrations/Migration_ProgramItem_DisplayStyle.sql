-- Migration: Add DisplayStyle to ProgramItems table
-- Database: MS SQL Server 2014
-- Run this migration to add item display style support

-- Add DisplayStyle column (e.g., 'default', 'credits')
-- 'default' - shows item number, title, performer names, description
-- 'credits' - shows performer avatar and name after item title, no description
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'ProgramItems') AND name = 'DisplayStyle')
BEGIN
    ALTER TABLE ProgramItems ADD DisplayStyle NVARCHAR(50) NULL;
END
GO

-- Set default value for existing rows
UPDATE ProgramItems SET DisplayStyle = 'default' WHERE DisplayStyle IS NULL;
GO
