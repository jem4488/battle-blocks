CREATE TABLE RobotTypeLib
(
   RobotTypeID int PRIMARY KEY,
   Name varchar(256) UNIQUE,
   BaseImageName varchar(256) UNIQUE
);

--DROP TABLE RobotTypeLib;

INSERT INTO RobotTypeLib(RobotTypeID, Name, BaseImageName)
VALUES (1, 'Gladiator', 'gladiator'),
 (2, 'Samuri', 'samuri'),
 (3, 'Sentinel', 'sentinel'),
 (4, 'Valkerie', 'valkerie');

SELECT *
FROM RobotTypeLib