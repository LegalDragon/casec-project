-- Migration: Add TimeBlock to EventPrograms and EstimatedLength to ProgramItems
-- Database: MS SQL Server 2014
-- Run this migration to add time block and item duration fields

-- Add TimeBlock column to EventPrograms (e.g., "7:00 PM - 9:00 PM")
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'EventPrograms') AND name = 'TimeBlock')
BEGIN
    ALTER TABLE EventPrograms ADD TimeBlock NVARCHAR(100) NULL;
END
GO

-- Add EstimatedLength column to ProgramItems (e.g., "5 min", "3分钟")
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'ProgramItems') AND name = 'EstimatedLength')
BEGIN
    ALTER TABLE ProgramItems ADD EstimatedLength NVARCHAR(50) NULL;
END
GO
