-- Migration: Add Membership Payment Tracking System
-- Date: 2025-12-06
-- Description: Enhances MembershipPayments table with payment workflow, proof uploads,
--              and family membership support. Adds MembershipValidUntil to Users table.

USE CasecDB;
GO

-- ============================================
-- STEP 1: Add MembershipValidUntil to Users table
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'MembershipValidUntil')
BEGIN
    ALTER TABLE [dbo].[Users]
    ADD [MembershipValidUntil] DATETIME2 NULL;

    PRINT 'Added MembershipValidUntil column to Users table.';
END
ELSE
BEGIN
    PRINT 'MembershipValidUntil column already exists in Users table.';
END
GO

-- ============================================
-- STEP 2: Rename PaymentStatus to Status in MembershipPayments
-- ============================================
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[MembershipPayments]') AND name = 'PaymentStatus')
   AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[MembershipPayments]') AND name = 'Status')
BEGIN
    EXEC sp_rename 'MembershipPayments.PaymentStatus', 'Status', 'COLUMN';
    PRINT 'Renamed PaymentStatus to Status in MembershipPayments table.';
END
GO

-- ============================================
-- STEP 3: Add new columns to MembershipPayments table
-- ============================================

-- Add ProofOfPaymentUrl column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[MembershipPayments]') AND name = 'ProofOfPaymentUrl')
BEGIN
    ALTER TABLE [dbo].[MembershipPayments]
    ADD [ProofOfPaymentUrl] NVARCHAR(500) NULL;

    PRINT 'Added ProofOfPaymentUrl column to MembershipPayments table.';
END
GO

-- Add PaymentScope column (Self or Family)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[MembershipPayments]') AND name = 'PaymentScope')
BEGIN
    ALTER TABLE [dbo].[MembershipPayments]
    ADD [PaymentScope] NVARCHAR(50) NOT NULL DEFAULT 'Self';

    PRINT 'Added PaymentScope column to MembershipPayments table.';
END
GO

-- Add ConfirmedBy column (Admin who confirmed)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[MembershipPayments]') AND name = 'ConfirmedBy')
BEGIN
    ALTER TABLE [dbo].[MembershipPayments]
    ADD [ConfirmedBy] INT NULL;

    -- Add foreign key constraint
    ALTER TABLE [dbo].[MembershipPayments]
    ADD CONSTRAINT [FK_MembershipPayments_ConfirmedBy]
    FOREIGN KEY ([ConfirmedBy]) REFERENCES [dbo].[Users]([UserId]) ON DELETE NO ACTION;

    PRINT 'Added ConfirmedBy column to MembershipPayments table.';
END
GO

-- Add ConfirmedAt column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[MembershipPayments]') AND name = 'ConfirmedAt')
BEGIN
    ALTER TABLE [dbo].[MembershipPayments]
    ADD [ConfirmedAt] DATETIME2 NULL;

    PRINT 'Added ConfirmedAt column to MembershipPayments table.';
END
GO

-- Add RejectionReason column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[MembershipPayments]') AND name = 'RejectionReason')
BEGIN
    ALTER TABLE [dbo].[MembershipPayments]
    ADD [RejectionReason] NVARCHAR(MAX) NULL;

    PRINT 'Added RejectionReason column to MembershipPayments table.';
END
GO

-- Add RenewalOfPaymentId column (for tracking renewal chain)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[MembershipPayments]') AND name = 'RenewalOfPaymentId')
BEGIN
    ALTER TABLE [dbo].[MembershipPayments]
    ADD [RenewalOfPaymentId] INT NULL;

    -- Add foreign key constraint (self-referencing)
    ALTER TABLE [dbo].[MembershipPayments]
    ADD CONSTRAINT [FK_MembershipPayments_RenewalOf]
    FOREIGN KEY ([RenewalOfPaymentId]) REFERENCES [dbo].[MembershipPayments]([PaymentId]) ON DELETE NO ACTION;

    PRINT 'Added RenewalOfPaymentId column to MembershipPayments table.';
END
GO

-- Add CoveredFamilyMemberIds column (JSON array of user IDs)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[MembershipPayments]') AND name = 'CoveredFamilyMemberIds')
BEGIN
    ALTER TABLE [dbo].[MembershipPayments]
    ADD [CoveredFamilyMemberIds] NVARCHAR(MAX) NULL;

    PRINT 'Added CoveredFamilyMemberIds column to MembershipPayments table.';
END
GO

-- Add UpdatedAt column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[MembershipPayments]') AND name = 'UpdatedAt')
BEGIN
    ALTER TABLE [dbo].[MembershipPayments]
    ADD [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE();

    PRINT 'Added UpdatedAt column to MembershipPayments table.';
END
GO

-- ============================================
-- STEP 4: Update existing records
-- ============================================

-- Update existing payments to have 'Confirmed' status if they were 'Completed'
UPDATE [dbo].[MembershipPayments]
SET [Status] = 'Confirmed'
WHERE [Status] = 'Completed';

-- Update existing users' MembershipValidUntil based on their latest confirmed payment
UPDATE u
SET u.[MembershipValidUntil] = p.[ValidUntil]
FROM [dbo].[Users] u
INNER JOIN (
    SELECT [UserId], MAX([ValidUntil]) AS [ValidUntil]
    FROM [dbo].[MembershipPayments]
    WHERE [Status] = 'Confirmed'
    GROUP BY [UserId]
) p ON u.[UserId] = p.[UserId]
WHERE u.[MembershipValidUntil] IS NULL;

PRINT 'Updated existing records with membership validity dates.';
GO

-- ============================================
-- STEP 5: Create indexes for performance
-- ============================================

-- Index for filtering by status
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MembershipPayments_Status' AND object_id = OBJECT_ID('MembershipPayments'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_MembershipPayments_Status]
    ON [dbo].[MembershipPayments] ([Status]);

    PRINT 'Created index IX_MembershipPayments_Status.';
END
GO

-- Index for filtering by confirmed date
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MembershipPayments_ConfirmedAt' AND object_id = OBJECT_ID('MembershipPayments'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_MembershipPayments_ConfirmedAt]
    ON [dbo].[MembershipPayments] ([ConfirmedAt] DESC)
    WHERE [ConfirmedAt] IS NOT NULL;

    PRINT 'Created index IX_MembershipPayments_ConfirmedAt.';
END
GO

-- Index for membership expiration queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_MembershipValidUntil' AND object_id = OBJECT_ID('Users'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Users_MembershipValidUntil]
    ON [dbo].[Users] ([MembershipValidUntil])
    WHERE [MembershipValidUntil] IS NOT NULL;

    PRINT 'Created index IX_Users_MembershipValidUntil.';
END
GO

-- ============================================
-- STEP 6: Update the view for user dashboard
-- ============================================

-- Drop and recreate the dashboard view to include new fields
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_UserDashboard')
BEGIN
    DROP VIEW [dbo].[vw_UserDashboard];
END
GO

CREATE VIEW [dbo].[vw_UserDashboard] AS
SELECT
    u.UserId,
    u.FirstName,
    u.LastName,
    u.Email,
    mt.Name AS MembershipType,
    mt.AnnualFee,
    u.MembershipValidUntil,
    CASE
        WHEN u.MembershipValidUntil IS NULL THEN 'Unknown'
        WHEN u.MembershipValidUntil < GETUTCDATE() THEN 'Expired'
        WHEN u.MembershipValidUntil < DATEADD(DAY, 30, GETUTCDATE()) THEN 'Expiring Soon'
        ELSE 'Active'
    END AS MembershipStatus,
    COUNT(DISTINCT cm.ClubId) AS ClubCount,
    COUNT(DISTINCT er.EventId) AS EventCount
FROM Users u
INNER JOIN MembershipTypes mt ON u.MembershipTypeId = mt.MembershipTypeId
LEFT JOIN ClubMemberships cm ON u.UserId = cm.UserId AND cm.IsActive = 1
LEFT JOIN EventRegistrations er ON u.UserId = er.UserId AND er.RegistrationStatus = 'Registered'
WHERE u.IsActive = 1
GROUP BY u.UserId, u.FirstName, u.LastName, u.Email, mt.Name, mt.AnnualFee, u.MembershipValidUntil;
GO

PRINT 'Updated vw_UserDashboard view.';
GO

-- ============================================
-- STEP 7: Create view for pending payments (admin use)
-- ============================================

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_PendingPayments')
BEGIN
    DROP VIEW [dbo].[vw_PendingPayments];
END
GO

CREATE VIEW [dbo].[vw_PendingPayments] AS
SELECT
    mp.PaymentId,
    mp.UserId,
    u.FirstName + ' ' + u.LastName AS UserName,
    u.Email AS UserEmail,
    mp.MembershipTypeId,
    mt.Name AS MembershipTypeName,
    mp.Amount,
    mp.PaymentDate,
    mp.PaymentMethod,
    mp.TransactionId,
    mp.Status,
    mp.ProofOfPaymentUrl,
    mp.PaymentScope,
    mp.ValidFrom,
    mp.ValidUntil,
    mp.Notes,
    mp.CreatedAt,
    DATEDIFF(DAY, mp.CreatedAt, GETUTCDATE()) AS DaysPending
FROM MembershipPayments mp
INNER JOIN Users u ON mp.UserId = u.UserId
INNER JOIN MembershipTypes mt ON mp.MembershipTypeId = mt.MembershipTypeId
WHERE mp.Status = 'Pending';
GO

PRINT 'Created vw_PendingPayments view.';
GO

PRINT 'Migration completed successfully!';
GO
