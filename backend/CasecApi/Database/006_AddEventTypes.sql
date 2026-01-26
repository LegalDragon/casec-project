-- Migration: Add EventTypes table
-- Date: 2024-12-15
-- Description: Creates EventTypes table for admin-configurable event types

-- Create EventTypes table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EventTypes')
BEGIN
    CREATE TABLE EventTypes (
        EventTypeId INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(50) NOT NULL,
        DisplayName NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        Icon NVARCHAR(50) NULL,
        Color NVARCHAR(20) NULL,
        AllowsRegistration BIT NOT NULL DEFAULT 1,
        IsActive BIT NOT NULL DEFAULT 1,
        DisplayOrder INT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    -- Create unique index on Code
    CREATE UNIQUE INDEX IX_EventTypes_Code ON EventTypes(Code);

    PRINT 'Created EventTypes table';
END
ELSE
BEGIN
    PRINT 'EventTypes table already exists';
END
GO

-- Insert default event types if table is empty
IF NOT EXISTS (SELECT 1 FROM EventTypes)
BEGIN
    INSERT INTO EventTypes (Code, DisplayName, Description, Icon, Color, AllowsRegistration, DisplayOrder)
    VALUES
        ('CasecEvent', 'Community Event', 'Official community events organized by the association', 'Calendar', 'primary', 1, 1),
        ('PartnerEvent', 'Partner Event', 'Events organized in collaboration with partner organizations', 'Handshake', 'accent', 1, 2),
        ('Announcement', 'Announcement', 'Important announcements and information sharing', 'Megaphone', 'info', 0, 3);

    PRINT 'Inserted default event types';
END
GO
