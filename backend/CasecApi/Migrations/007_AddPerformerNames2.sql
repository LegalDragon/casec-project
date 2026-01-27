-- Migration: Add PerformerNames2 column to ProgramItems table
-- This enables a second performer per program item
-- MS SQL Server 2014 compatible

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProgramItems]') AND name = 'PerformerNames2')
BEGIN
    ALTER TABLE [dbo].[ProgramItems] ADD [PerformerNames2] NVARCHAR(500) NULL;
END
GO
