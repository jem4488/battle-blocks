CREATE TABLE Accumulator
(
	AccumulatorID int IDENTITY PRIMARY KEY,
	CompetitorID int,
	AccumulatorTypeID int,
	Used bit DEFAULT(0)
);

SELECT *
FROM Accumulator

INSERT INTO Accumulator(CompetitorID, AccumulatorTypeID)
VALUES (1, 2), (1, 4);