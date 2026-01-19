-- Migration: Add Event Types and Categories
-- Run this after AddBoardMembersAndAvatar.sql

-- Add EventType column to Events table
ALTER TABLE Events
ADD EventType NVARCHAR(50) NOT NULL DEFAULT 'CasecEvent',
    EventCategory NVARCHAR(100) NULL,
    PartnerName NVARCHAR(200) NULL,
    PartnerLogo NVARCHAR(500) NULL,
    PartnerWebsite NVARCHAR(500) NULL,
    RegistrationUrl NVARCHAR(500) NULL,
    IsRegistrationRequired BIT NOT NULL DEFAULT 1,
    IsFeatured BIT NOT NULL DEFAULT 0;

GO

-- Add constraint to ensure valid event types
ALTER TABLE Events
ADD CONSTRAINT CK_Events_EventType 
CHECK (EventType IN ('CasecEvent', 'PartnerEvent', 'Announcement'));

GO

-- Create index for event filtering
CREATE INDEX IX_Events_EventType_Date 
ON Events(EventType, EventDate DESC);

GO

-- Update existing events to be CASEC events
UPDATE Events 
SET EventType = 'CasecEvent',
    IsRegistrationRequired = 1
WHERE EventType IS NULL OR EventType = '';

GO

-- Sample data for different event types

-- Partner Event Example
INSERT INTO Events (Title, Description, EventDate, Location, EventType, PartnerName, PartnerWebsite, EventFee, MaxCapacity, IsRegistrationRequired)
VALUES (
    'Tech Innovation Summit 2025',
    'Join us for a day of innovation with our partner TechCorp. Explore cutting-edge technology trends and network with industry leaders.',
    '2025-02-15 09:00:00',
    'TechCorp Conference Center, Downtown',
    'PartnerEvent',
    'TechCorp Solutions',
    'https://techcorp.example.com',
    25.00,
    150,
    1
);

-- Announcement Only Example
INSERT INTO Events (Title, Description, EventDate, Location, EventType, EventFee, MaxCapacity, IsRegistrationRequired)
VALUES (
    'Community Update: New Facilities Opening',
    'We are excited to announce the opening of our new community center! Details about the grand opening ceremony will be shared soon. Stay tuned for more information.',
    '2025-03-01 00:00:00',
    'CASEC Community Center',
    'Announcement',
    0,
    0,
    0
);

-- Featured CASEC Event Example
INSERT INTO Events (Title, Description, EventDate, Location, EventType, EventCategory, EventFee, MaxCapacity, IsRegistrationRequired, IsFeatured)
VALUES (
    'Annual CASEC Gala 2025',
    'Our premier annual event celebrating community achievements. Join us for an evening of recognition, networking, and celebration.',
    '2025-04-20 18:00:00',
    'Grand Ballroom, City Hotel',
    'CasecEvent',
    'Gala',
    100.00,
    250,
    1,
    1
);

-- CASEC Workshop Example
INSERT INTO Events (Title, Description, EventDate, Location, EventType, EventCategory, EventFee, MaxCapacity, IsRegistrationRequired)
VALUES (
    'Leadership Skills Workshop',
    'Develop your leadership skills in this interactive workshop. Learn proven strategies for effective team management and personal growth.',
    '2025-02-28 14:00:00',
    'CASEC Training Room B',
    'CasecEvent',
    'Workshop',
    30.00,
    25,
    1
);

GO

-- Create view for event summary with type information
IF OBJECT_ID('vw_EventSummary', 'V') IS NOT NULL
    DROP VIEW vw_EventSummary;
GO

CREATE VIEW vw_EventSummary AS
SELECT 
    e.EventId,
    e.Title,
    e.Description,
    e.EventDate,
    e.Location,
    e.EventType,
    e.EventCategory,
    e.PartnerName,
    e.EventFee,
    e.MaxCapacity,
    e.IsRegistrationRequired,
    e.IsFeatured,
    e.CreatedAt,
    COUNT(DISTINCT er.RegistrationId) as TotalRegistrations,
    (e.MaxCapacity - COUNT(DISTINCT er.RegistrationId)) as SpotsRemaining
FROM Events e
LEFT JOIN EventRegistrations er ON e.EventId = er.EventId
GROUP BY 
    e.EventId, e.Title, e.Description, e.EventDate, e.Location, 
    e.EventType, e.EventCategory, e.PartnerName, e.EventFee, 
    e.MaxCapacity, e.IsRegistrationRequired, e.IsFeatured, e.CreatedAt;

GO

PRINT 'Migration completed: Event types and categories added';
PRINT 'Event Types: CasecEvent, PartnerEvent, Announcement';
PRINT 'Features: Partner info, Registration options, Categories, Featured flag';
