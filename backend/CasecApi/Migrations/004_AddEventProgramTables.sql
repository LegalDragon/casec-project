-- Migration: Add Event Program Tables
-- Date: 2026-01-26
-- Description: Creates tables for event program management system

-- Create EventPrograms table
CREATE TABLE [EventPrograms] (
    [ProgramId] int NOT NULL IDENTITY,
    [Title] nvarchar(200) NOT NULL,
    [Subtitle] nvarchar(200) NULL,
    [Description] nvarchar(2000) NULL,
    [ImageUrl] nvarchar(500) NULL,
    [EventDate] datetime2 NULL,
    [Venue] nvarchar(200) NULL,
    [VenueAddress] nvarchar(500) NULL,
    [SlideShowIds] nvarchar(max) NULL,
    [Status] nvarchar(50) NOT NULL DEFAULT 'Draft',
    [IsFeatured] bit NOT NULL DEFAULT 0,
    [Slug] nvarchar(100) NULL,
    [CreatedBy] int NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_EventPrograms] PRIMARY KEY ([ProgramId]),
    CONSTRAINT [FK_EventPrograms_Users_CreatedBy] FOREIGN KEY ([CreatedBy]) REFERENCES [Users] ([UserId]) ON DELETE SET NULL
);

-- Create indexes for EventPrograms
CREATE UNIQUE INDEX [IX_EventPrograms_Slug] ON [EventPrograms] ([Slug]) WHERE [Slug] IS NOT NULL;
CREATE INDEX [IX_EventPrograms_Status] ON [EventPrograms] ([Status]);
CREATE INDEX [IX_EventPrograms_IsFeatured] ON [EventPrograms] ([IsFeatured]);

-- Create ProgramSections table
CREATE TABLE [ProgramSections] (
    [SectionId] int NOT NULL IDENTITY,
    [ProgramId] int NOT NULL,
    [Title] nvarchar(200) NOT NULL,
    [Subtitle] nvarchar(500) NULL,
    [Description] nvarchar(2000) NULL,
    [DisplayOrder] int NOT NULL DEFAULT 0,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_ProgramSections] PRIMARY KEY ([SectionId]),
    CONSTRAINT [FK_ProgramSections_EventPrograms_ProgramId] FOREIGN KEY ([ProgramId]) REFERENCES [EventPrograms] ([ProgramId]) ON DELETE CASCADE
);

-- Create indexes for ProgramSections
CREATE INDEX [IX_ProgramSections_ProgramId] ON [ProgramSections] ([ProgramId]);
CREATE INDEX [IX_ProgramSections_ProgramId_DisplayOrder] ON [ProgramSections] ([ProgramId], [DisplayOrder]);

-- Create ProgramContents table (needed before ProgramItems due to FK)
CREATE TABLE [ProgramContents] (
    [ContentId] int NOT NULL IDENTITY,
    [Title] nvarchar(200) NOT NULL,
    [Slug] nvarchar(100) NULL,
    [ContentType] nvarchar(50) NOT NULL DEFAULT 'General',
    [Content] nvarchar(max) NULL,
    [FeaturedImageUrl] nvarchar(500) NULL,
    [GalleryImages] nvarchar(max) NULL,
    [Videos] nvarchar(max) NULL,
    [SlideShowId] int NULL,
    [Status] nvarchar(50) NOT NULL DEFAULT 'Draft',
    [MetaTitle] nvarchar(200) NULL,
    [MetaDescription] nvarchar(500) NULL,
    [CreatedBy] int NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_ProgramContents] PRIMARY KEY ([ContentId]),
    CONSTRAINT [FK_ProgramContents_Users_CreatedBy] FOREIGN KEY ([CreatedBy]) REFERENCES [Users] ([UserId]) ON DELETE SET NULL,
    CONSTRAINT [FK_ProgramContents_SlideShows_SlideShowId] FOREIGN KEY ([SlideShowId]) REFERENCES [SlideShows] ([SlideShowId]) ON DELETE SET NULL
);

-- Create indexes for ProgramContents
CREATE INDEX [IX_ProgramContents_Slug] ON [ProgramContents] ([Slug]);
CREATE INDEX [IX_ProgramContents_ContentType] ON [ProgramContents] ([ContentType]);
CREATE INDEX [IX_ProgramContents_Status] ON [ProgramContents] ([Status]);

-- Create Performers table
CREATE TABLE [Performers] (
    [PerformerId] int NOT NULL IDENTITY,
    [Name] nvarchar(200) NOT NULL,
    [ChineseName] nvarchar(200) NULL,
    [EnglishName] nvarchar(200) NULL,
    [Bio] nvarchar(4000) NULL,
    [PhotoUrl] nvarchar(500) NULL,
    [Website] nvarchar(500) NULL,
    [Instagram] nvarchar(200) NULL,
    [YouTube] nvarchar(200) NULL,
    [ContentPageId] int NULL,
    [IsActive] bit NOT NULL DEFAULT 1,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_Performers] PRIMARY KEY ([PerformerId]),
    CONSTRAINT [FK_Performers_ProgramContents_ContentPageId] FOREIGN KEY ([ContentPageId]) REFERENCES [ProgramContents] ([ContentId]) ON DELETE SET NULL
);

-- Create index for Performers
CREATE INDEX [IX_Performers_IsActive] ON [Performers] ([IsActive]);

-- Create ProgramItems table
CREATE TABLE [ProgramItems] (
    [ItemId] int NOT NULL IDENTITY,
    [SectionId] int NOT NULL,
    [ItemNumber] int NOT NULL DEFAULT 1,
    [Title] nvarchar(300) NOT NULL,
    [PerformanceType] nvarchar(100) NULL,
    [PerformerNames] nvarchar(500) NULL,
    [Description] nvarchar(2000) NULL,
    [ImageUrl] nvarchar(500) NULL,
    [ContentPageId] int NULL,
    [DisplayOrder] int NOT NULL DEFAULT 0,
    [DurationMinutes] int NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [PK_ProgramItems] PRIMARY KEY ([ItemId]),
    CONSTRAINT [FK_ProgramItems_ProgramSections_SectionId] FOREIGN KEY ([SectionId]) REFERENCES [ProgramSections] ([SectionId]) ON DELETE CASCADE,
    CONSTRAINT [FK_ProgramItems_ProgramContents_ContentPageId] FOREIGN KEY ([ContentPageId]) REFERENCES [ProgramContents] ([ContentId]) ON DELETE SET NULL
);

-- Create indexes for ProgramItems
CREATE INDEX [IX_ProgramItems_SectionId] ON [ProgramItems] ([SectionId]);
CREATE INDEX [IX_ProgramItems_SectionId_DisplayOrder] ON [ProgramItems] ([SectionId], [DisplayOrder]);

-- Create ProgramItemPerformers table (many-to-many join)
CREATE TABLE [ProgramItemPerformers] (
    [Id] int NOT NULL IDENTITY,
    [ItemId] int NOT NULL,
    [PerformerId] int NOT NULL,
    [DisplayOrder] int NOT NULL DEFAULT 0,
    [Role] nvarchar(100) NULL,
    CONSTRAINT [PK_ProgramItemPerformers] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProgramItemPerformers_ProgramItems_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [ProgramItems] ([ItemId]) ON DELETE CASCADE,
    CONSTRAINT [FK_ProgramItemPerformers_Performers_PerformerId] FOREIGN KEY ([PerformerId]) REFERENCES [Performers] ([PerformerId]) ON DELETE CASCADE
);

-- Create indexes for ProgramItemPerformers
CREATE INDEX [IX_ProgramItemPerformers_ItemId] ON [ProgramItemPerformers] ([ItemId]);
CREATE INDEX [IX_ProgramItemPerformers_PerformerId] ON [ProgramItemPerformers] ([PerformerId]);
CREATE UNIQUE INDEX [IX_ProgramItemPerformers_ItemId_PerformerId] ON [ProgramItemPerformers] ([ItemId], [PerformerId]);

PRINT 'Event Program tables created successfully';
