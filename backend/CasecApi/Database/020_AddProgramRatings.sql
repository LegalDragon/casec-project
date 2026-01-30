-- 020_AddProgramRatings.sql
-- Create ProgramRatings table for gala program item ratings

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProgramRatings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ProgramRatings] (
        [ProgramRatingId] INT IDENTITY(1,1) NOT NULL,
        [EventProgramId] INT NOT NULL,
        [ProgramItemId] INT NULL,
        [PhoneNumber] NVARCHAR(20) NOT NULL,
        [Rating] INT NOT NULL,
        [Comment] NVARCHAR(500) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_ProgramRatings] PRIMARY KEY CLUSTERED ([ProgramRatingId] ASC),
        CONSTRAINT [FK_ProgramRatings_EventPrograms] FOREIGN KEY ([EventProgramId])
            REFERENCES [dbo].[EventPrograms] ([ProgramId]) ON DELETE CASCADE,
        CONSTRAINT [CK_ProgramRatings_Rating] CHECK ([Rating] >= 1 AND [Rating] <= 5)
    );

    -- Unique constraint: one rating per phone number per program item
    -- Note: ProgramItemId can be NULL (overall event rating), so we use a filtered unique index
    CREATE UNIQUE NONCLUSTERED INDEX [IX_ProgramRatings_ItemPhone]
        ON [dbo].[ProgramRatings] ([ProgramItemId], [PhoneNumber])
        WHERE [ProgramItemId] IS NOT NULL;

    -- For overall event ratings (ProgramItemId IS NULL), use a separate unique index
    CREATE UNIQUE NONCLUSTERED INDEX [IX_ProgramRatings_EventPhone_Overall]
        ON [dbo].[ProgramRatings] ([EventProgramId], [PhoneNumber])
        WHERE [ProgramItemId] IS NULL;

    -- Index for querying ratings by event
    CREATE NONCLUSTERED INDEX [IX_ProgramRatings_EventProgramId]
        ON [dbo].[ProgramRatings] ([EventProgramId]);

    PRINT 'Created ProgramRatings table with indexes';
END
ELSE
BEGIN
    PRINT 'ProgramRatings table already exists';
END
GO
