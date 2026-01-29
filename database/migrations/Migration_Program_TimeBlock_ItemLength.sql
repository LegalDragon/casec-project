-- Migration: Add TimeBlock to EventPrograms and EstimatedLength to ProgramItems
-- Run this migration to add time block and item duration fields

-- Add TimeBlock column to EventPrograms (e.g., "7:00 PM - 9:00 PM")
ALTER TABLE EventPrograms ADD COLUMN IF NOT EXISTS TimeBlock VARCHAR(100) NULL;

-- Add EstimatedLength column to ProgramItems (e.g., "5 min", "3分钟")
ALTER TABLE ProgramItems ADD COLUMN IF NOT EXISTS EstimatedLength VARCHAR(50) NULL;
