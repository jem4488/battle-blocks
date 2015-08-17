CREATE TABLE Competitor
(
   CompetitorID int IDENTITY PRIMARY KEY,
   UserName varchar(256),
   LastSketchAcquired date,
   LastShardAcquired date,
   LastCoinCollection datetimeoffset,
   Wins int DEFAULT(0),
   Losses int DEFAULT(0),
   Coins int DEFAULT(0),

);

DROP TABLE Competitor

SELECT *
FROM Competitor

INSERT INTO Competitor (UserName, LastSketchAcquired, LastShardAcquired, LastCoinCollection)
VALUES ('jody', SYSDATETIME(), SYSDATETIME(), SYSDATETIMEOFFSET())


UPDATE Competitor
SET LastSketchAcquired = '2000-01-01'
WHERE UserName = 'jody';

UPDATE Competitor
SET LastShardAcquired = '2000-01-01'
WHERE UserName = 'jody';

UPDATE Competitor
SET LastCoinCollection = '2015-07-29 12:55:28.8236272 -05:00'
WHERE UserName = 'jody';
