-- Migration: Create Assets table for file storage tracking
-- Date: 2025-12-05

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Assets]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Assets] (
        [FileId] INT IDENTITY(1,1) NOT NULL,
        [FileName] NVARCHAR(255) NOT NULL,
        [OriginalFileName] NVARCHAR(255) NOT NULL,
        [ContentType] NVARCHAR(100) NOT NULL,
        [FileSize] BIGINT NOT NULL,
        [StorageProvider] NVARCHAR(50) NOT NULL,
        [StoragePath] NVARCHAR(1000) NOT NULL,
        [Folder] NVARCHAR(255) NULL,
        [ObjectType] NVARCHAR(100) NULL,
        [ObjectId] INT NULL,
        [UploadedBy] INT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [DeletedAt] DATETIME2 NULL,
        CONSTRAINT [PK_Assets] PRIMARY KEY CLUSTERED ([FileId] ASC),
        CONSTRAINT [FK_Assets_Users] FOREIGN KEY ([UploadedBy]) REFERENCES [dbo].[Users]([UserId]) ON DELETE SET NULL
    );

    -- Create indexes for common queries
    CREATE NONCLUSTERED INDEX [IX_Assets_ObjectType_ObjectId] ON [dbo].[Assets] ([ObjectType], [ObjectId]);
    CREATE NONCLUSTERED INDEX [IX_Assets_UploadedBy] ON [dbo].[Assets] ([UploadedBy]);
    CREATE NONCLUSTERED INDEX [IX_Assets_CreatedAt] ON [dbo].[Assets] ([CreatedAt] DESC);
    CREATE NONCLUSTERED INDEX [IX_Assets_Folder] ON [dbo].[Assets] ([Folder]);

    PRINT 'Assets table created successfully.';
END
ELSE
BEGIN
    PRINT 'Assets table already exists.';
END
GO
