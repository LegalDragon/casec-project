-- Migration: Add trigger for automatic password reset email
-- Date: 2025-12-07
-- Description: Creates trigger to send password reset email when token is created

-- First, create or update the stored procedure
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'csp_ResetPWD_EMail')
    DROP PROCEDURE csp_ResetPWD_EMail;
GO

CREATE PROCEDURE csp_ResetPWD_EMail
    @TokenID int
AS
SET NOCOUNT ON

DECLARE @UID int,
        @FName nvarchar(100),
        @LName nvarchar(100),
        @Email varchar(100),
        @Token varchar(100),
        @Url varchar(200) = 'https://casec.dink1.com/reset-password?token='

SELECT @UID = [UserId],
       @Token = [Token]
FROM [PasswordResetTokens]
WHERE TokenID = @TokenID

SELECT @FName = FirstName,
       @LName = LastName,
       @Email = Email
FROM Users
WHERE UserID = @UID

INSERT INTO FXEmail.dbo.EmailOutbox (
    taskid,
    ObjectId,
    tolist,
    bodyjson,
    NextAttemptAt,
    status,
    CreatedAt
)
VALUES (
    12,
    @UID,
    @Email,
    '{"FName":"' + @FName + '","LName":"' + @LName + '","RESET_URL":"' + @Url + @Token + '"}',
    GETDATE(),
    10,
    GETDATE()
)
GO

-- Drop existing trigger if it exists
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_PasswordResetTokens_SendEmail')
    DROP TRIGGER TR_PasswordResetTokens_SendEmail;
GO

-- Create trigger to automatically send email on insert
CREATE TRIGGER TR_PasswordResetTokens_SendEmail
ON [dbo].[PasswordResetTokens]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TokenID int;

    -- Get the TokenId from the inserted row
    SELECT @TokenID = TokenId FROM inserted;

    -- Call the email procedure
    EXEC csp_ResetPWD_EMail @TokenID;
END
GO

PRINT 'Created trigger TR_PasswordResetTokens_SendEmail on PasswordResetTokens table';
