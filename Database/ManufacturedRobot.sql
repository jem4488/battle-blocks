CREATE TABLE ManufacturedRobot
(
	ManufacturedRobotID int IDENTITY PRIMARY KEY,
	CompetitorID int,
	MinedResourceID int,
	FrameID int,
	AccumulatorID int,
);

SELECT *
FROM ManufacturedRobot