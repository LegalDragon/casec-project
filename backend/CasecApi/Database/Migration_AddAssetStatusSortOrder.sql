-- Migration: Add Status, SortOrder, and Caption columns to Assets table
-- Date: 2025-12-06
-- Purpose: Support asset visibility control and ordering for event galleries

-- Add Status column (Public, Private, MembersOnly)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'Status')
BEGIN
    ALTER TABLE [dbo].[Assets]
    ADD [Status] NVARCHAR(50) NOT NULL DEFAULT 'Private';

    PRINT 'Added Status column to Assets table.';
END
ELSE
BEGIN
    PRINT 'Status column already exists in Assets table.';
END
GO

-- Add SortOrder column for controlling display order
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'SortOrder')
BEGIN
    ALTER TABLE [dbo].[Assets]
    ADD [SortOrder] INT NOT NULL DEFAULT 0;

    PRINT 'Added SortOrder column to Assets table.';
END
ELSE
BEGIN
    PRINT 'SortOrder column already exists in Assets table.';
END
GO

-- Add Caption column for optional descriptions
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND name = 'Caption')
BEGIN
    ALTER TABLE [dbo].[Assets]
    ADD [Caption] NVARCHAR(500) NULL;

    PRINT 'Added Caption column to Assets table.';
END
ELSE
BEGIN
    PRINT 'Caption column already exists in Assets table.';
END
GO

-- Create index on Status for filtering assets by visibility
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Assets_Status' AND object_id = OBJECT_ID(N'[dbo].[Assets]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Assets_Status] ON [dbo].[Assets] ([Status]);
    PRINT 'Created index IX_Assets_Status.';
END
GO

-- Create index on ObjectType, ObjectId, Status for efficient event asset queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Assets_ObjectType_ObjectId_Status' AND object_id = OBJECT_ID(N'[dbo].[Assets]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Assets_ObjectType_ObjectId_Status] ON [dbo].[Assets] ([ObjectType], [ObjectId], [Status]) INCLUDE ([SortOrder]);
    PRINT 'Created index IX_Assets_ObjectType_ObjectId_Status.';
END
GO
