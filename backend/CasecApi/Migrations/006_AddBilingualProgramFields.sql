-- Migration: Add bilingual fields to EventProgram, ProgramSection, and ProgramItem tables
-- This enables Chinese and English content for program display
-- MS SQL Server 2014 compatible

-- EventPrograms: Add Chinese and English fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[EventPrograms]') AND name = 'TitleZh')
BEGIN
    ALTER TABLE [dbo].[EventPrograms] ADD [TitleZh] NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[EventPrograms]') AND name = 'TitleEn')
BEGIN
    ALTER TABLE [dbo].[EventPrograms] ADD [TitleEn] NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[EventPrograms]') AND name = 'SubtitleZh')
BEGIN
    ALTER TABLE [dbo].[EventPrograms] ADD [SubtitleZh] NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[EventPrograms]') AND name = 'SubtitleEn')
BEGIN
    ALTER TABLE [dbo].[EventPrograms] ADD [SubtitleEn] NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[EventPrograms]') AND name = 'DescriptionZh')
BEGIN
    ALTER TABLE [dbo].[EventPrograms] ADD [DescriptionZh] NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[EventPrograms]') AND name = 'DescriptionEn')
BEGIN
    ALTER TABLE [dbo].[EventPrograms] ADD [DescriptionEn] NVARCHAR(MAX) NULL;
END
GO

-- ProgramSections: Add Chinese and English fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramSections]') AND name = 'TitleZh')
BEGIN
    ALTER TABLE [dbo].[ProgramSections] ADD [TitleZh] NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramSections]') AND name = 'TitleEn')
BEGIN
    ALTER TABLE [dbo].[ProgramSections] ADD [TitleEn] NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramSections]') AND name = 'SubtitleZh')
BEGIN
    ALTER TABLE [dbo].[ProgramSections] ADD [SubtitleZh] NVARCHAR(500) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramSections]') AND name = 'SubtitleEn')
BEGIN
    ALTER TABLE [dbo].[ProgramSections] ADD [SubtitleEn] NVARCHAR(500) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramSections]') AND name = 'DescriptionZh')
BEGIN
    ALTER TABLE [dbo].[ProgramSections] ADD [DescriptionZh] NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramSections]') AND name = 'DescriptionEn')
BEGIN
    ALTER TABLE [dbo].[ProgramSections] ADD [DescriptionEn] NVARCHAR(MAX) NULL;
END
GO

-- ProgramItems: Add Chinese and English fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramItems]') AND name = 'TitleZh')
BEGIN
    ALTER TABLE [dbo].[ProgramItems] ADD [TitleZh] NVARCHAR(300) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramItems]') AND name = 'TitleEn')
BEGIN
    ALTER TABLE [dbo].[ProgramItems] ADD [TitleEn] NVARCHAR(300) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramItems]') AND name = 'PerformanceTypeZh')
BEGIN
    ALTER TABLE [dbo].[ProgramItems] ADD [PerformanceTypeZh] NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramItems]') AND name = 'PerformanceTypeEn')
BEGIN
    ALTER TABLE [dbo].[ProgramItems] ADD [PerformanceTypeEn] NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramItems]') AND name = 'DescriptionZh')
BEGIN
    ALTER TABLE [dbo].[ProgramItems] ADD [DescriptionZh] NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramItems]') AND name = 'DescriptionEn')
BEGIN
    ALTER TABLE [dbo].[ProgramItems] ADD [DescriptionEn] NVARCHAR(MAX) NULL;
END
GO

-- Copy existing Title to TitleZh as default (assuming existing content is Chinese)
UPDATE [dbo].[EventPrograms] SET [TitleZh] = [Title] WHERE [TitleZh] IS NULL AND [Title] IS NOT NULL;
GO

UPDATE [dbo].[ProgramSections] SET [TitleZh] = [Title] WHERE [TitleZh] IS NULL AND [Title] IS NOT NULL;
GO

UPDATE [dbo].[ProgramItems] SET [TitleZh] = [Title] WHERE [TitleZh] IS NULL AND [Title] IS NOT NULL;
GO
