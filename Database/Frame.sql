CREATE TABLE Frame
(
	FrameID int IDENTITY PRIMARY KEY,
	CompetitorID int,
	RobotTypeID int,
	Used bit DEFAULT(0)
);

--DROP TABLE Frame

SELECT *
FROM Frame

INSERT INTO Frame(CompetitorID, RobotTypeID)
VALUES (1, 4);