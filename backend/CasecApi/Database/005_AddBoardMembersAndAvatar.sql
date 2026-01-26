-- Migration: Add Board Members and Avatar Support
-- Run this after the initial CreateTables.sql

-- Add new columns to Users table
ALTER TABLE Users
ADD AvatarUrl NVARCHAR(500) NULL,
    IsBoardMember BIT NOT NULL DEFAULT 0,
    BoardTitle NVARCHAR(100) NULL,
    BoardDisplayOrder INT NULL,
    BoardBio NVARCHAR(MAX) NULL,
    LinkedInUrl NVARCHAR(100) NULL,
    TwitterHandle NVARCHAR(100) NULL;

GO

-- Create index for board members query optimization
CREATE INDEX IX_Users_IsBoardMember_DisplayOrder 
ON Users(IsBoardMember, BoardDisplayOrder)
WHERE IsBoardMember = 1;

GO

-- Sample data: Add some board members (update UserIds as needed)
-- First, let's create a sample board member if you want
-- UPDATE Users SET 
--     IsBoardMember = 1,
--     BoardTitle = 'President',
--     BoardDisplayOrder = 1,
--     BoardBio = 'Leading CASEC with vision and dedication to community excellence.'
-- WHERE Email = 'president@casec.org';

-- UPDATE Users SET 
--     IsBoardMember = 1,
--     BoardTitle = 'Vice President',
--     BoardDisplayOrder = 2,
--     BoardBio = 'Supporting our mission to build stronger community connections.'
-- WHERE Email = 'vp@casec.org';

-- UPDATE Users SET 
--     IsBoardMember = 1,
--     BoardTitle = 'Treasurer',
--     BoardDisplayOrder = 3,
--     BoardBio = 'Managing finances and ensuring sustainable growth.'
-- WHERE Email = 'treasurer@casec.org';

-- UPDATE Users SET 
--     IsBoardMember = 1,
--     BoardTitle = 'Secretary',
--     BoardDisplayOrder = 4,
--     BoardBio = 'Maintaining records and facilitating communication.'
-- WHERE Email = 'secretary@casec.org';

GO

PRINT 'Migration completed: Board member fields and avatar support added';
