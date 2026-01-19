-- Migration: Add PasswordResetTokens table
-- Date: 2025-12-07
-- Description: Creates table for storing password reset tokens

-- Create PasswordResetTokens table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PasswordResetTokens')
BEGIN
    CREATE TABLE [dbo].[PasswordResetTokens] (
        [TokenId] INT IDENTITY(1,1) NOT NULL,
        [UserId] INT NOT NULL,
        [Token] NVARCHAR(100) NOT NULL,
        [ExpiresAt] DATETIME2 NOT NULL,
        [IsUsed] BIT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_PasswordResetTokens] PRIMARY KEY CLUSTERED ([TokenId] ASC),
        CONSTRAINT [FK_PasswordResetTokens_Users_UserId] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users] ([UserId]) ON DELETE CASCADE
    );
    PRINT 'Created PasswordResetTokens table';
END
GO

-- Create unique index on Token column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PasswordResetTokens_Token' AND object_id = OBJECT_ID('PasswordResetTokens'))
BEGIN
    CREATE UNIQUE INDEX [IX_PasswordResetTokens_Token] ON [dbo].[PasswordResetTokens] ([Token]);
    PRINT 'Created unique index on Token column';
END
GO

-- Create index on UserId for faster lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PasswordResetTokens_UserId' AND object_id = OBJECT_ID('PasswordResetTokens'))
BEGIN
    CREATE INDEX [IX_PasswordResetTokens_UserId] ON [dbo].[PasswordResetTokens] ([UserId]);
    PRINT 'Created index on UserId column';
END
GO

PRINT 'Migration AddPasswordResetTokens completed successfully';
