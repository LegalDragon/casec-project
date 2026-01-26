-- Migration: Add PaymentMethods table
-- Description: Creates the PaymentMethods table to store configurable payment methods
-- Date: 2026-01-15

-- Create PaymentMethods table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PaymentMethods')
BEGIN
    CREATE TABLE PaymentMethods (
        PaymentMethodId INT IDENTITY(1,1) PRIMARY KEY,
        Code NVARCHAR(50) NOT NULL,
        Name NVARCHAR(100) NOT NULL,
        Instructions NVARCHAR(2000) NULL,
        Icon NVARCHAR(50) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        DisplayOrder INT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    -- Create unique index on Code
    CREATE UNIQUE INDEX IX_PaymentMethods_Code ON PaymentMethods(Code);

    -- Create index on DisplayOrder
    CREATE INDEX IX_PaymentMethods_DisplayOrder ON PaymentMethods(DisplayOrder);

    PRINT 'Created PaymentMethods table';
END
ELSE
BEGIN
    PRINT 'PaymentMethods table already exists';
END
GO

-- Insert default Zelle payment method if table is empty
IF NOT EXISTS (SELECT 1 FROM PaymentMethods)
BEGIN
    INSERT INTO PaymentMethods (Code, Name, Instructions, Icon, IsActive, DisplayOrder)
    VALUES (
        'Zelle',
        'Zelle',
        'Send payment via Zelle to treasurer@casec.org. Include your name and ''Membership'' in the memo.',
        'CreditCard',
        1,
        0
    );

    PRINT 'Inserted default Zelle payment method';
END
GO

-- Verify the migration
SELECT
    PaymentMethodId,
    Code,
    Name,
    LEFT(Instructions, 50) AS Instructions_Preview,
    IsActive,
    DisplayOrder
FROM PaymentMethods;
GO
