-- ============================================================================
-- CASEC Email/SMS Notification System
-- Migration script for notification infrastructure
-- Based on the sp_EN_Create, sp_EN_Attach, sp_EN_Release pattern
-- ============================================================================

-- Create EmailNotifications table if not exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmailNotifications]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[EmailNotifications] (
        [ENID] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] INT NULL,                          -- Optional: linked user
        [SendType] VARCHAR(50) NOT NULL DEFAULT 'email',  -- 'email' or 'phone'
        [UserPhone] VARCHAR(25) NULL,               -- Phone number for SMS
        [UserEmail] VARCHAR(100) NULL,              -- Email address
        [Subject] NVARCHAR(500) NULL,               -- Email subject (not used for SMS)
        [Body] NVARCHAR(MAX) NOT NULL,              -- HTML body for email, plain text for SMS
        [BodyJSON] NVARCHAR(MAX) NULL,              -- Original JSON payload
        [Status] VARCHAR(50) NOT NULL DEFAULT 'Pending',  -- Pending, Released, Sent, Failed
        [InstantSend] BIT NOT NULL DEFAULT 0,       -- If true, send immediately
        [SentAt] DATETIME2 NULL,                    -- When notification was sent
        [ErrorMessage] NVARCHAR(MAX) NULL,          -- Error details if failed
        [RetryCount] INT NOT NULL DEFAULT 0,        -- Number of retry attempts
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_EmailNotifications_Status ON [dbo].[EmailNotifications] ([Status]);
    CREATE INDEX IX_EmailNotifications_SendType ON [dbo].[EmailNotifications] ([SendType]);
    CREATE INDEX IX_EmailNotifications_UserId ON [dbo].[EmailNotifications] ([UserId]);
    CREATE INDEX IX_EmailNotifications_CreatedAt ON [dbo].[EmailNotifications] ([CreatedAt] DESC);

    PRINT 'Created EmailNotifications table';
END
GO

-- Create EmailNotificationAttachments table if not exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmailNotificationAttachments]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[EmailNotificationAttachments] (
        [AttachmentId] INT IDENTITY(1,1) PRIMARY KEY,
        [ENID] INT NOT NULL,                        -- FK to EmailNotifications
        [DocumentName] NVARCHAR(200) NOT NULL,      -- Display name of document
        [MimeType] VARCHAR(100) NOT NULL,           -- MIME type (application/pdf, image/png, etc.)
        [StorageUrl] VARCHAR(500) NOT NULL,         -- URL to the file in storage
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT FK_EmailNotificationAttachments_ENID
            FOREIGN KEY ([ENID]) REFERENCES [dbo].[EmailNotifications]([ENID]) ON DELETE CASCADE
    );

    CREATE INDEX IX_EmailNotificationAttachments_ENID ON [dbo].[EmailNotificationAttachments] ([ENID]);

    PRINT 'Created EmailNotificationAttachments table';
END
GO

-- ============================================================================
-- sp_EN_Create - Create a new email or SMS notification
-- ============================================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_EN_Create]') AND type = 'P')
    DROP PROCEDURE [dbo].[sp_EN_Create];
GO

CREATE PROCEDURE [dbo].[sp_EN_Create]
    @UserId INT = NULL,
    @SendType VARCHAR(50) = 'email',
    @InstantSend BIT = 0,
    @UserPhone VARCHAR(25) = NULL,
    @UserEmail VARCHAR(100) = NULL,
    @BodyJSON NVARCHAR(MAX),
    @ENID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Subject NVARCHAR(500);
    DECLARE @Body NVARCHAR(MAX);

    -- Parse JSON to extract subject and body
    -- Expected format: {"SUBJECT": "...", "BODY": "..."}
    SET @Subject = JSON_VALUE(@BodyJSON, '$.SUBJECT');
    SET @Body = JSON_VALUE(@BodyJSON, '$.BODY');

    -- If body extraction failed, use the entire JSON as body (for SMS)
    IF @Body IS NULL
        SET @Body = @BodyJSON;

    -- Determine initial status
    DECLARE @Status VARCHAR(50) = CASE WHEN @InstantSend = 1 THEN 'Released' ELSE 'Pending' END;

    -- Insert the notification
    INSERT INTO [dbo].[EmailNotifications] (
        [UserId],
        [SendType],
        [UserPhone],
        [UserEmail],
        [Subject],
        [Body],
        [BodyJSON],
        [Status],
        [InstantSend],
        [CreatedAt],
        [UpdatedAt]
    )
    VALUES (
        @UserId,
        @SendType,
        @UserPhone,
        @UserEmail,
        @Subject,
        @Body,
        @BodyJSON,
        @Status,
        @InstantSend,
        GETUTCDATE(),
        GETUTCDATE()
    );

    SET @ENID = SCOPE_IDENTITY();

    RETURN 0;
END
GO

PRINT 'Created sp_EN_Create stored procedure';
GO

-- ============================================================================
-- sp_EN_Attach - Attach a document to a notification
-- ============================================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_EN_Attach]') AND type = 'P')
    DROP PROCEDURE [dbo].[sp_EN_Attach];
GO

CREATE PROCEDURE [dbo].[sp_EN_Attach]
    @ENID INT,
    @DocName NVARCHAR(200),
    @MimeType VARCHAR(100),
    @StorageUrl VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate the notification exists
    IF NOT EXISTS (SELECT 1 FROM [dbo].[EmailNotifications] WHERE [ENID] = @ENID)
    BEGIN
        RAISERROR('Notification with ENID %d not found', 16, 1, @ENID);
        RETURN 1;
    END

    -- Validate storage URL is not empty
    IF @StorageUrl IS NULL OR LEN(TRIM(@StorageUrl)) = 0
    BEGIN
        RAISERROR('Storage URL cannot be empty', 16, 1);
        RETURN 1;
    END

    -- Insert the attachment
    INSERT INTO [dbo].[EmailNotificationAttachments] (
        [ENID],
        [DocumentName],
        [MimeType],
        [StorageUrl],
        [CreatedAt]
    )
    VALUES (
        @ENID,
        @DocName,
        @MimeType,
        @StorageUrl,
        GETUTCDATE()
    );

    RETURN 0;
END
GO

PRINT 'Created sp_EN_Attach stored procedure';
GO

-- ============================================================================
-- sp_EN_Release - Release a notification for sending
-- ============================================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_EN_Release]') AND type = 'P')
    DROP PROCEDURE [dbo].[sp_EN_Release];
GO

CREATE PROCEDURE [dbo].[sp_EN_Release]
    @ENID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate the notification exists
    IF NOT EXISTS (SELECT 1 FROM [dbo].[EmailNotifications] WHERE [ENID] = @ENID)
    BEGIN
        RAISERROR('Notification with ENID %d not found', 16, 1, @ENID);
        RETURN 1;
    END

    -- Update status to Released
    UPDATE [dbo].[EmailNotifications]
    SET [Status] = 'Released',
        [UpdatedAt] = GETUTCDATE()
    WHERE [ENID] = @ENID
      AND [Status] = 'Pending';

    RETURN 0;
END
GO

PRINT 'Created sp_EN_Release stored procedure';
GO

-- ============================================================================
-- sp_EN_GetPending - Get pending notifications ready to send (for background job)
-- ============================================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_EN_GetPending]') AND type = 'P')
    DROP PROCEDURE [dbo].[sp_EN_GetPending];
GO

CREATE PROCEDURE [dbo].[sp_EN_GetPending]
    @BatchSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@BatchSize)
        n.[ENID],
        n.[UserId],
        n.[SendType],
        n.[UserPhone],
        n.[UserEmail],
        n.[Subject],
        n.[Body],
        n.[CreatedAt],
        n.[RetryCount]
    FROM [dbo].[EmailNotifications] n
    WHERE n.[Status] = 'Released'
      AND n.[RetryCount] < 3
    ORDER BY n.[CreatedAt] ASC;
END
GO

PRINT 'Created sp_EN_GetPending stored procedure';
GO

-- ============================================================================
-- sp_EN_MarkSent - Mark a notification as sent
-- ============================================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_EN_MarkSent]') AND type = 'P')
    DROP PROCEDURE [dbo].[sp_EN_MarkSent];
GO

CREATE PROCEDURE [dbo].[sp_EN_MarkSent]
    @ENID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE [dbo].[EmailNotifications]
    SET [Status] = 'Sent',
        [SentAt] = GETUTCDATE(),
        [UpdatedAt] = GETUTCDATE()
    WHERE [ENID] = @ENID;

    RETURN 0;
END
GO

PRINT 'Created sp_EN_MarkSent stored procedure';
GO

-- ============================================================================
-- sp_EN_MarkFailed - Mark a notification as failed
-- ============================================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_EN_MarkFailed]') AND type = 'P')
    DROP PROCEDURE [dbo].[sp_EN_MarkFailed];
GO

CREATE PROCEDURE [dbo].[sp_EN_MarkFailed]
    @ENID INT,
    @ErrorMessage NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE [dbo].[EmailNotifications]
    SET [RetryCount] = [RetryCount] + 1,
        [ErrorMessage] = @ErrorMessage,
        [Status] = CASE WHEN [RetryCount] >= 2 THEN 'Failed' ELSE [Status] END,
        [UpdatedAt] = GETUTCDATE()
    WHERE [ENID] = @ENID;

    RETURN 0;
END
GO

PRINT 'Created sp_EN_MarkFailed stored procedure';
GO

PRINT 'Notification system migration complete!';
GO
