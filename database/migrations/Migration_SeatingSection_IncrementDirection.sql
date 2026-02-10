-- Migration: Add SeatIncrement and Direction columns to SeatingSections
-- Purpose: Support odd/even seat numbering and left-to-right vs right-to-left display

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SeatingSections') AND name = 'SeatIncrement')
BEGIN
    ALTER TABLE SeatingSections ADD SeatIncrement INT NOT NULL DEFAULT 1;
    PRINT 'Added SeatIncrement column to SeatingSections';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SeatingSections') AND name = 'Direction')
BEGIN
    ALTER TABLE SeatingSections ADD Direction NVARCHAR(10) NOT NULL DEFAULT 'LTR';
    PRINT 'Added Direction column to SeatingSections';
END
GO
