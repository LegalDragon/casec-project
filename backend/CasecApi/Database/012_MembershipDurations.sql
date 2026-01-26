-- Migration: Add Membership Durations
-- Date: 2025-12-06
-- Description: Adds MembershipDurations table and DurationId to MembershipPayments

USE CasecDB;
GO

-- ============================================
-- STEP 1: Create MembershipDurations table
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MembershipDurations')
BEGIN
    CREATE TABLE [dbo].[MembershipDurations] (
        [DurationId] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL,
        [Months] INT NOT NULL,
        [Description] NVARCHAR(MAX) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [DisplayOrder] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    PRINT 'Created MembershipDurations table.';
END
ELSE
BEGIN
    PRINT 'MembershipDurations table already exists.';
END
GO

-- ============================================
-- STEP 2: Add default durations
-- ============================================
IF NOT EXISTS (SELECT * FROM [dbo].[MembershipDurations])
BEGIN
    INSERT INTO [dbo].[MembershipDurations] ([Name], [Months], [Description], [IsActive], [DisplayOrder])
    VALUES
        ('1 Year', 12, 'Standard annual membership', 1, 1),
        ('2 Years', 24, 'Two-year membership with savings', 1, 2);

    PRINT 'Added default membership durations.';
END
ELSE
BEGIN
    PRINT 'Membership durations already exist.';
END
GO

-- ============================================
-- STEP 3: Add DurationId to MembershipPayments
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[MembershipPayments]') AND name = 'DurationId')
BEGIN
    ALTER TABLE [dbo].[MembershipPayments]
    ADD [DurationId] INT NULL;

    -- Add foreign key constraint
    ALTER TABLE [dbo].[MembershipPayments]
    ADD CONSTRAINT [FK_MembershipPayments_Duration]
    FOREIGN KEY ([DurationId]) REFERENCES [dbo].[MembershipDurations]([DurationId]) ON DELETE SET NULL;

    PRINT 'Added DurationId column to MembershipPayments table.';
END
ELSE
BEGIN
    PRINT 'DurationId column already exists in MembershipPayments table.';
END
GO

-- ============================================
-- STEP 4: Update existing payments with default duration
-- ============================================
-- Set existing payments to use 1 Year duration (ID = 1)
DECLARE @DefaultDurationId INT;
SELECT @DefaultDurationId = DurationId FROM [dbo].[MembershipDurations] WHERE Months = 12;

IF @DefaultDurationId IS NOT NULL
BEGIN
    UPDATE [dbo].[MembershipPayments]
    SET [DurationId] = @DefaultDurationId
    WHERE [DurationId] IS NULL;

    PRINT 'Updated existing payments with default duration.';
END
GO

-- ============================================
-- STEP 5: Create index for better performance
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MembershipDurations_IsActive' AND object_id = OBJECT_ID('MembershipDurations'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_MembershipDurations_IsActive]
    ON [dbo].[MembershipDurations] ([IsActive], [DisplayOrder]);

    PRINT 'Created index IX_MembershipDurations_IsActive.';
END
GO

PRINT 'Migration completed successfully!';
GO
