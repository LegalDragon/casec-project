-- Add IsLocked column to SeatRaffleWinners table
-- This allows admins to "lock in" a winner so they won't be replaced when quantity is full

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'SeatRaffleWinners' AND COLUMN_NAME = 'IsLocked'
)
BEGIN
    ALTER TABLE SeatRaffleWinners ADD IsLocked BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsLocked column to SeatRaffleWinners';
END
ELSE
BEGIN
    PRINT 'IsLocked column already exists';
END
