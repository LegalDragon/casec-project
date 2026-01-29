-- Migration: Add ChatbotVisibility column to ThemeSettings
-- SQL Server 2014 compatible

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'ThemeSettings' 
    AND COLUMN_NAME = 'ChatbotVisibility'
)
BEGIN
    ALTER TABLE ThemeSettings
    ADD ChatbotVisibility NVARCHAR(20) NOT NULL 
        CONSTRAINT DF_ThemeSettings_ChatbotVisibility DEFAULT 'off';
END
GO
