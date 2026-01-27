-- Migration: Add bilingual fields to EventProgram, ProgramSection, and ProgramItem tables
-- This enables Chinese and English content for program display

-- EventPrograms: Add Chinese and English fields
ALTER TABLE EventPrograms
    ADD COLUMN TitleZh VARCHAR(200) NULL AFTER Title,
    ADD COLUMN TitleEn VARCHAR(200) NULL AFTER TitleZh,
    ADD COLUMN SubtitleZh VARCHAR(200) NULL AFTER Subtitle,
    ADD COLUMN SubtitleEn VARCHAR(200) NULL AFTER SubtitleZh,
    ADD COLUMN DescriptionZh TEXT NULL AFTER Description,
    ADD COLUMN DescriptionEn TEXT NULL AFTER DescriptionZh;

-- ProgramSections: Add Chinese and English fields
ALTER TABLE ProgramSections
    ADD COLUMN TitleZh VARCHAR(200) NULL AFTER Title,
    ADD COLUMN TitleEn VARCHAR(200) NULL AFTER TitleZh,
    ADD COLUMN SubtitleZh VARCHAR(500) NULL AFTER Subtitle,
    ADD COLUMN SubtitleEn VARCHAR(500) NULL AFTER SubtitleZh,
    ADD COLUMN DescriptionZh TEXT NULL AFTER Description,
    ADD COLUMN DescriptionEn TEXT NULL AFTER DescriptionZh;

-- ProgramItems: Add Chinese and English fields
ALTER TABLE ProgramItems
    ADD COLUMN TitleZh VARCHAR(300) NULL AFTER Title,
    ADD COLUMN TitleEn VARCHAR(300) NULL AFTER TitleZh,
    ADD COLUMN PerformanceTypeZh VARCHAR(100) NULL AFTER PerformanceType,
    ADD COLUMN PerformanceTypeEn VARCHAR(100) NULL AFTER PerformanceTypeZh,
    ADD COLUMN DescriptionZh TEXT NULL AFTER Description,
    ADD COLUMN DescriptionEn TEXT NULL AFTER DescriptionZh;

-- Copy existing Title to TitleZh as default (assuming existing content is Chinese)
UPDATE EventPrograms SET TitleZh = Title WHERE TitleZh IS NULL;
UPDATE ProgramSections SET TitleZh = Title WHERE TitleZh IS NULL;
UPDATE ProgramItems SET TitleZh = Title WHERE TitleZh IS NULL;
