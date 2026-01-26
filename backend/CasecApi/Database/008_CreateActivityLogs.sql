-- Migration: Create ActivityLogs Table
-- Date: 2025-12-05
-- Description: Creates the ActivityLogs table for tracking user activity

-- Check if table exists before creating
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ActivityLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ActivityLogs] (
        [LogId] INT IDENTITY(1,1) NOT NULL,
        [UserId] INT NOT NULL,
        [ActivityType] NVARCHAR(50) NOT NULL,
        [Description] NVARCHAR(MAX) NULL,
        [IpAddress] NVARCHAR(50) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT [PK_ActivityLogs] PRIMARY KEY CLUSTERED ([LogId] ASC),
        CONSTRAINT [FK_ActivityLogs_Users] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users] ([UserId]) ON DELETE CASCADE
    );

    -- Create index for faster lookups by UserId
    CREATE NONCLUSTERED INDEX [IX_ActivityLogs_UserId]
        ON [dbo].[ActivityLogs] ([UserId]);

    -- Create index for faster lookups by ActivityType
    CREATE NONCLUSTERED INDEX [IX_ActivityLogs_ActivityType]
        ON [dbo].[ActivityLogs] ([ActivityType]);

    -- Create index for faster lookups by CreatedAt (for date range queries)
    CREATE NONCLUSTERED INDEX [IX_ActivityLogs_CreatedAt]
        ON [dbo].[ActivityLogs] ([CreatedAt] DESC);

    PRINT 'ActivityLogs table created successfully.';
END
ELSE
BEGIN
    PRINT 'ActivityLogs table already exists.';
END
GO
