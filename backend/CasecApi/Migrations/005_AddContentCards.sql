-- Migration: Add ContentCards table for rich content attached to program items and performers
-- This table stores cards that display detailed information when items/performers are clicked

CREATE TABLE IF NOT EXISTS ContentCards (
    CardId INT AUTO_INCREMENT PRIMARY KEY,

    -- Entity association (polymorphic)
    EntityType VARCHAR(50) NOT NULL,       -- 'ProgramItem' or 'Performer'
    EntityId INT NOT NULL,

    -- Bilingual title
    TitleZh VARCHAR(200) NULL,             -- Chinese title
    TitleEn VARCHAR(200) NULL,             -- English title

    -- Bilingual body text
    BodyTextZh TEXT NULL,                  -- Chinese body text
    BodyTextEn TEXT NULL,                  -- English body text

    -- Media
    MediaUrl VARCHAR(500) NULL,            -- URL to image or video
    MediaType VARCHAR(20) NOT NULL DEFAULT 'image',  -- 'image' or 'video'

    -- Layout options: 'left', 'right', 'top', 'bottom', 'overlay', 'fullwidth'
    LayoutType VARCHAR(20) NOT NULL DEFAULT 'left',

    -- Display order within the entity's cards
    DisplayOrder INT NOT NULL DEFAULT 0,

    -- Timestamps
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes for efficient querying
    INDEX idx_contentcards_entity (EntityType, EntityId),
    INDEX idx_contentcards_order (EntityType, EntityId, DisplayOrder)
);
