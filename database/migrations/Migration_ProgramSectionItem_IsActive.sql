-- ============================================================================
-- CASEC Program Section/Item IsActive Migration
-- Adds IsActive column to ProgramSections and ProgramItems tables
-- Allows admins to activate/deactivate sections and items without deleting them
-- ============================================================================

-- Add IsActive column to ProgramSections table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramSections]') AND name = 'IsActive')
BEGIN
    ALTER TABLE [dbo].[ProgramSections]
    ADD [IsActive] BIT NOT NULL DEFAULT 1;

    PRINT 'Added IsActive column to ProgramSections table';
END
GO

-- Add IsActive column to ProgramItems table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramItems]') AND name = 'IsActive')
BEGIN
    ALTER TABLE [dbo].[ProgramItems]
    ADD [IsActive] BIT NOT NULL DEFAULT 1;

    PRINT 'Added IsActive column to ProgramItems table';
END
GO

-- Create index for faster filtering of active sections
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[ProgramSections]') AND name = 'IX_ProgramSections_IsActive')
BEGIN
    CREATE INDEX IX_ProgramSections_IsActive ON [dbo].[ProgramSections] ([IsActive]);
    PRINT 'Created index IX_ProgramSections_IsActive';
END
GO

-- Create index for faster filtering of active items
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[ProgramItems]') AND name = 'IX_ProgramItems_IsActive')
BEGIN
    CREATE INDEX IX_ProgramItems_IsActive ON [dbo].[ProgramItems] ([IsActive]);
    PRINT 'Created index IX_ProgramItems_IsActive';
END
GO

PRINT 'Migration complete: ProgramSections and ProgramItems now have IsActive column';
