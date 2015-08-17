CREATE TABLE AccumulatorTypeLib
(
   AccumulatorTypeID int PRIMARY KEY,
   Name varchar(256) UNIQUE,
   BaseImageName varchar(256) UNIQUE
);

--DROP TABLE AccumulatorTypeLib

INSERT INTO AccumulatorTypeLib(AccumulatorTypeID, Name, BaseImageName)
VALUES (1, 'Horizontal Beam', 'horizontal'),
 (2, 'Vertical Beam', 'vertical'),
 (3, 'X Bomb', 'x'),
 (4, '+ Bomb', 'plus'),
 (5, 'Teleport Shield', 'shield');

SELECT *
FROM AccumulatorTypeLib;