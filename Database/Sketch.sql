CREATE TABLE Sketch
(
   SketchID int IDENTITY PRIMARY KEY,
   CompetitorID int,
   AccumulatorTypeID int,
   SeqNum int
);

SELECT *
FROM Sketch;

INSERT INTO Sketch(CompetitorID, AccumulatorTypeID, SeqNum)
VALUES(1, 1, 1),
(1, 1, 4),
(1, 1, 5),
(1, 1, 6)

INSERT INTO Sketch(CompetitorID, AccumulatorTypeID, SeqNum)
VALUES(1, 2, 1),
(1, 2, 4),
(1, 2, 5),
(1, 2, 6),
(1, 2, 2),
(1, 2, 3)