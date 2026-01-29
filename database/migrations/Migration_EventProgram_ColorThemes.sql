-- Migration: Add ColorThemes and ShowBackgroundImage to EventPrograms table
-- Run this migration to add color theme customization and background image support

-- Add ColorThemes column (JSON array of theme objects)
ALTER TABLE EventPrograms ADD COLUMN IF NOT EXISTS ColorThemes TEXT NULL;

-- Add ShowBackgroundImage column (whether to show cover image as background)
ALTER TABLE EventPrograms ADD COLUMN IF NOT EXISTS ShowBackgroundImage BOOLEAN NOT NULL DEFAULT FALSE;

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
