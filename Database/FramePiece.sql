CREATE TABLE FramePiece
(
   FramePieceID int IDENTITY PRIMARY KEY,
   CompetitorID int,
   RobotTypeID int,
   SeqNum int
);

SELECT *
FROM FramePiece;


INSERT INTO FramePiece (CompetitorID, RobotTypeID, SeqNum)
VALUES (1, 1, 1),
(1, 1, 3),
(1, 3, 2),
(1, 3, 1),
(1, 4, 6)

INSERT INTO FramePiece (CompetitorID, RobotTypeID, SeqNum)
VALUES (1, 2, 3),
(1, 2, 4),
(1, 2, 6),
(1, 2, 5),
(1, 2, 2),
(1, 2, 1)

UPDATE FramePiece
SET RobotTypeID = 1
WHERE RobotTypeID = 2
