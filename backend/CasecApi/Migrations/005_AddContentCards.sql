-- Migration: Add ContentCards table for rich content attached to program items and performers
-- This table stores cards that display detailed information when items/performers are clicked
-- MS SQL Server 2014 compatible

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ContentCards]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ContentCards] (
        [CardId] INT IDENTITY(1,1) NOT NULL,

        -- Entity association (polymorphic)
        [EntityType] NVARCHAR(50) NOT NULL,       -- 'ProgramItem' or 'Performer'
        [EntityId] INT NOT NULL,

        -- Bilingual title
        [TitleZh] NVARCHAR(200) NULL,             -- Chinese title
        [TitleEn] NVARCHAR(200) NULL,             -- English title

        -- Bilingual body text
        [BodyTextZh] NVARCHAR(MAX) NULL,          -- Chinese body text
        [BodyTextEn] NVARCHAR(MAX) NULL,          -- English body text

        -- Media
        [MediaUrl] NVARCHAR(500) NULL,            -- URL to image or video
        [MediaType] NVARCHAR(20) NOT NULL DEFAULT 'image',  -- 'image' or 'video'

        -- Layout options: 'left', 'right', 'top', 'bottom', 'overlay', 'fullwidth'
        [LayoutType] NVARCHAR(20) NOT NULL DEFAULT 'left',

        -- Display order within the entity's cards
        [DisplayOrder] INT NOT NULL DEFAULT 0,

        -- Timestamps
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT [PK_ContentCards] PRIMARY KEY CLUSTERED ([CardId] ASC)
    );

    -- Indexes for efficient querying
    CREATE NONCLUSTERED INDEX [IX_ContentCards_Entity]
        ON [dbo].[ContentCards] ([EntityType], [EntityId]);

    CREATE NONCLUSTERED INDEX [IX_ContentCards_EntityOrder]
        ON [dbo].[ContentCards] ([EntityType], [EntityId], [DisplayOrder]);
END
GO
