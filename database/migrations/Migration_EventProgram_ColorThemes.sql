-- Migration: Add ColorThemes and ShowBackgroundImage to EventPrograms table
-- Database: MS SQL Server 2014
-- Run this migration to add color theme customization and background image support

-- Add ColorThemes column (JSON stored as NVARCHAR for theme objects)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'EventPrograms') AND name = 'ColorThemes')
BEGIN
    ALTER TABLE EventPrograms ADD ColorThemes NVARCHAR(MAX) NULL;
END
GO

-- Add ShowBackgroundImage column (whether to show cover image as background)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'EventPrograms') AND name = 'ShowBackgroundImage')
BEGIN
    ALTER TABLE EventPrograms ADD ShowBackgroundImage BIT NOT NULL DEFAULT 0;
END
GO

-- Example of ColorThemes JSON structure:
-- [
--   {
--     "name": "Theme 1",
--     "primary": "#facc15",
--     "bgFrom": "#7f1d1d",
--     "bgVia": "#991b1b",
--     "bgTo": "#78350f"
--   },
--   {
--     "name": "Theme 2",
--     "primary": "#60a5fa",
--     "bgFrom": "#1e3a5f",
--     "bgVia": "#1e40af",
--     "bgTo": "#3730a3"
--   }
-- ]
