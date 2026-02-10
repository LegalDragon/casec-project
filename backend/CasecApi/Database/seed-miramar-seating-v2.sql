-- Seed Miramar Cultural Center Seating Chart
-- Uses correct table names: SeatingSections, SeatingSeats

DECLARE @ChartId INT;

-- Create the chart
INSERT INTO SeatingCharts (Name, Description, CreatedAt, UpdatedAt)
VALUES ('Miramar Cultural Center 2026', 'CASEC Spring Gala - February 15, 2026', GETUTCDATE(), GETUTCDATE());

SET @ChartId = SCOPE_IDENTITY();
PRINT 'Created chart with ID: ' + CAST(@ChartId AS VARCHAR);

-- Create sections
DECLARE @OrchLeftId INT, @OrchCenterId INT, @OrchRightId INT;
DECLARE @BalcLeftId INT, @BalcCenterId INT, @BalcRightId INT;

INSERT INTO SeatingSections (ChartId, Name, ShortName, DisplayOrder, SeatsPerRow, RowLabels, StartSeatNumber, CreatedAt)
VALUES (@ChartId, 'Orchestra Left', 'Orch-Left', 1, 11, 'D,E,F,G,H,J,K,L,M,N,P,Q,R,S,T,U,V,W', 1, GETUTCDATE());
SET @OrchLeftId = SCOPE_IDENTITY();

INSERT INTO SeatingSections (ChartId, Name, ShortName, DisplayOrder, SeatsPerRow, RowLabels, StartSeatNumber, CreatedAt)
VALUES (@ChartId, 'Orchestra Center', 'Orch-Center', 2, 14, 'A,B,C,D,E,F,G,H,J,K,L,M,N,P,Q,R,S,T,U,V,W', 101, GETUTCDATE());
SET @OrchCenterId = SCOPE_IDENTITY();

INSERT INTO SeatingSections (ChartId, Name, ShortName, DisplayOrder, SeatsPerRow, RowLabels, StartSeatNumber, CreatedAt)
VALUES (@ChartId, 'Orchestra Right', 'Orch-Right', 3, 11, 'D,E,F,G,H,J,K,L,M,N,P,Q,R,S,T,U,V,W', 1, GETUTCDATE());
SET @OrchRightId = SCOPE_IDENTITY();

INSERT INTO SeatingSections (ChartId, Name, ShortName, DisplayOrder, SeatsPerRow, RowLabels, StartSeatNumber, CreatedAt)
VALUES (@ChartId, 'Balcony Left', 'Balc-Left', 4, 8, 'AA,BB,CC,DD,EE,FF', 1, GETUTCDATE());
SET @BalcLeftId = SCOPE_IDENTITY();

INSERT INTO SeatingSections (ChartId, Name, ShortName, DisplayOrder, SeatsPerRow, RowLabels, StartSeatNumber, CreatedAt)
VALUES (@ChartId, 'Balcony Center', 'Balc-Center', 5, 14, 'AA,BB,CC,DD,EE,FF', 101, GETUTCDATE());
SET @BalcCenterId = SCOPE_IDENTITY();

INSERT INTO SeatingSections (ChartId, Name, ShortName, DisplayOrder, SeatsPerRow, RowLabels, StartSeatNumber, CreatedAt)
VALUES (@ChartId, 'Balcony Right', 'Balc-Right', 6, 8, 'AA,BB,CC,DD,EE,FF', 1, GETUTCDATE());
SET @BalcRightId = SCOPE_IDENTITY();

PRINT 'Created 6 sections';

-- Generate seats using a simpler approach
DECLARE @Row NVARCHAR(2), @SeatCount INT, @i INT, @SectionId INT, @StartNum INT;

-- Orchestra Left seats
DECLARE @OLRows TABLE (RowLabel NVARCHAR(2), SeatCount INT);
INSERT INTO @OLRows VALUES ('D',7),('E',8),('F',8),('G',9),('H',9),('J',10),('K',10),('L',10),('M',11),('N',11),('P',11),('Q',11),('R',11),('S',11),('T',11),('U',11),('V',11),('W',11);

DECLARE ol_cursor CURSOR FOR SELECT RowLabel, SeatCount FROM @OLRows;
OPEN ol_cursor;
FETCH NEXT FROM ol_cursor INTO @Row, @SeatCount;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @i = 1;
    WHILE @i <= @SeatCount
    BEGIN
        INSERT INTO SeatingSeats (ChartId, SectionId, RowLabel, SeatNumber, Status, CreatedAt, UpdatedAt)
        VALUES (@ChartId, @OrchLeftId, @Row, @i, 'Available', GETUTCDATE(), GETUTCDATE());
        SET @i = @i + 1;
    END
    FETCH NEXT FROM ol_cursor INTO @Row, @SeatCount;
END
CLOSE ol_cursor;
DEALLOCATE ol_cursor;
PRINT 'Created Orchestra Left seats';

-- Orchestra Center seats
DECLARE @OCRows TABLE (RowLabel NVARCHAR(2), SeatCount INT, StartNum INT);
INSERT INTO @OCRows VALUES ('A',6,105),('B',8,104),('C',12,102),('D',14,101),('E',14,101),('F',14,101),('G',14,101),('H',14,101),('J',14,101),('K',14,101),('L',14,101),('M',14,101),('N',14,101),('P',14,101),('Q',14,101),('R',14,101),('S',10,103),('T',10,103),('U',14,101),('V',14,101),('W',14,101);

DECLARE oc_cursor CURSOR FOR SELECT RowLabel, SeatCount, StartNum FROM @OCRows;
OPEN oc_cursor;
FETCH NEXT FROM oc_cursor INTO @Row, @SeatCount, @StartNum;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @i = 0;
    WHILE @i < @SeatCount
    BEGIN
        INSERT INTO SeatingSeats (ChartId, SectionId, RowLabel, SeatNumber, Status, CreatedAt, UpdatedAt)
        VALUES (@ChartId, @OrchCenterId, @Row, @StartNum + @i, 'Available', GETUTCDATE(), GETUTCDATE());
        SET @i = @i + 1;
    END
    FETCH NEXT FROM oc_cursor INTO @Row, @SeatCount, @StartNum;
END
CLOSE oc_cursor;
DEALLOCATE oc_cursor;
PRINT 'Created Orchestra Center seats';

-- Orchestra Right seats (same as Left)
DECLARE @ORRows TABLE (RowLabel NVARCHAR(2), SeatCount INT);
INSERT INTO @ORRows VALUES ('D',7),('E',8),('F',8),('G',9),('H',9),('J',10),('K',10),('L',10),('M',11),('N',11),('P',11),('Q',11),('R',11),('S',11),('T',11),('U',11),('V',11),('W',11);

DECLARE or_cursor CURSOR FOR SELECT RowLabel, SeatCount FROM @ORRows;
OPEN or_cursor;
FETCH NEXT FROM or_cursor INTO @Row, @SeatCount;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @i = 1;
    WHILE @i <= @SeatCount
    BEGIN
        INSERT INTO SeatingSeats (ChartId, SectionId, RowLabel, SeatNumber, Status, CreatedAt, UpdatedAt)
        VALUES (@ChartId, @OrchRightId, @Row, @i, 'Available', GETUTCDATE(), GETUTCDATE());
        SET @i = @i + 1;
    END
    FETCH NEXT FROM or_cursor INTO @Row, @SeatCount;
END
CLOSE or_cursor;
DEALLOCATE or_cursor;
PRINT 'Created Orchestra Right seats';

-- Balcony Left (8 seats per row, rows AA-FF)
DECLARE @BRows TABLE (RowLabel NVARCHAR(2));
INSERT INTO @BRows VALUES ('AA'),('BB'),('CC'),('DD'),('EE'),('FF');

DECLARE bl_cursor CURSOR FOR SELECT RowLabel FROM @BRows;
OPEN bl_cursor;
FETCH NEXT FROM bl_cursor INTO @Row;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @i = 1;
    WHILE @i <= 8
    BEGIN
        INSERT INTO SeatingSeats (ChartId, SectionId, RowLabel, SeatNumber, Status, CreatedAt, UpdatedAt)
        VALUES (@ChartId, @BalcLeftId, @Row, @i, 'Available', GETUTCDATE(), GETUTCDATE());
        SET @i = @i + 1;
    END
    FETCH NEXT FROM bl_cursor INTO @Row;
END
CLOSE bl_cursor;
DEALLOCATE bl_cursor;
PRINT 'Created Balcony Left seats';

-- Balcony Center (14 seats per row, 101-114)
DECLARE bc_cursor CURSOR FOR SELECT RowLabel FROM @BRows;
OPEN bc_cursor;
FETCH NEXT FROM bc_cursor INTO @Row;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @i = 101;
    WHILE @i <= 114
    BEGIN
        INSERT INTO SeatingSeats (ChartId, SectionId, RowLabel, SeatNumber, Status, CreatedAt, UpdatedAt)
        VALUES (@ChartId, @BalcCenterId, @Row, @i, 'Available', GETUTCDATE(), GETUTCDATE());
        SET @i = @i + 1;
    END
    FETCH NEXT FROM bc_cursor INTO @Row;
END
CLOSE bc_cursor;
DEALLOCATE bc_cursor;
PRINT 'Created Balcony Center seats';

-- Balcony Right (8 seats per row)
DECLARE br_cursor CURSOR FOR SELECT RowLabel FROM @BRows;
OPEN br_cursor;
FETCH NEXT FROM br_cursor INTO @Row;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @i = 1;
    WHILE @i <= 8
    BEGIN
        INSERT INTO SeatingSeats (ChartId, SectionId, RowLabel, SeatNumber, Status, CreatedAt, UpdatedAt)
        VALUES (@ChartId, @BalcRightId, @Row, @i, 'Available', GETUTCDATE(), GETUTCDATE());
        SET @i = @i + 1;
    END
    FETCH NEXT FROM br_cursor INTO @Row;
END
CLOSE br_cursor;
DEALLOCATE br_cursor;
PRINT 'Created Balcony Right seats';

-- Update totals
UPDATE SeatingCharts SET TotalSeats = (SELECT COUNT(*) FROM SeatingSeats WHERE ChartId = @ChartId) WHERE ChartId = @ChartId;

-- Output summary
SELECT 'Created chart' AS Status, @ChartId AS ChartId;
SELECT s.Name, COUNT(st.SeatId) AS SeatCount 
FROM SeatingSections s 
LEFT JOIN SeatingSeats st ON st.SectionId = s.SectionId
WHERE s.ChartId = @ChartId
GROUP BY s.Name, s.DisplayOrder
ORDER BY s.DisplayOrder;
