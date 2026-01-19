-- Migration: Add Gender, DateOfBirth, and MaritalStatus to Users table
-- Date: 2025-12-07
-- Description: Adds personal information fields to user profile

-- Add Gender column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'Gender')
BEGIN
    ALTER TABLE [dbo].[Users]
    ADD [Gender] NVARCHAR(20) NULL;
    PRINT 'Added Gender column to Users table';
END
GO

-- Add DateOfBirth column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'DateOfBirth')
BEGIN
    ALTER TABLE [dbo].[Users]
    ADD [DateOfBirth] DATETIME2 NULL;
    PRINT 'Added DateOfBirth column to Users table';
END
GO

-- Add MaritalStatus column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'MaritalStatus')
BEGIN
    ALTER TABLE [dbo].[Users]
    ADD [MaritalStatus] NVARCHAR(30) NULL;
    PRINT 'Added MaritalStatus column to Users table';
END
GO

PRINT 'Migration AddUserPersonalInfo completed successfully';
