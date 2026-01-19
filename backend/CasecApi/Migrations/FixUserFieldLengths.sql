-- Migration: Fix User table field lengths to prevent truncation errors
-- Run this script against your database

-- Increase PasswordHash length (BCrypt hashes are ~60 chars, but allow room for other algorithms)
ALTER TABLE Users ALTER COLUMN PasswordHash NVARCHAR(255) NOT NULL;

-- Increase PhoneNumber length (to accommodate formatted numbers like +1 (123) 456-7890)
ALTER TABLE Users ALTER COLUMN PhoneNumber NVARCHAR(30) NULL;

-- Increase Hobbies length
ALTER TABLE Users ALTER COLUMN Hobbies NVARCHAR(500) NULL;

-- Set Bio to allow longer text
ALTER TABLE Users ALTER COLUMN Bio NVARCHAR(4000) NULL;

-- Set BoardBio to allow longer text
ALTER TABLE Users ALTER COLUMN BoardBio NVARCHAR(4000) NULL;

-- Increase LinkedInUrl length
ALTER TABLE Users ALTER COLUMN LinkedInUrl NVARCHAR(255) NULL;

-- Add ChineseName column if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'ChineseName')
BEGIN
    ALTER TABLE Users ADD ChineseName NVARCHAR(100) NULL;
END

PRINT 'User table field lengths updated successfully';
