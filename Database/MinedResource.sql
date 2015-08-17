CREATE TABLE MinedResource
(
   MinedResourceID int IDENTITY PRIMARY KEY,
   CompetitorID int,
   MinedResourceTypeID int,
   Color int,
   Used bit DEFAULT(0)
);

DROP TABLE MinedResource

INSERT INTO MinedResource (CompetitorID, MinedResourceTypeID, Color) (
SELECT C.CompetitorID, 2, 4
FROM Competitor C
WHERE UserName = 'jody');

SELECT *
FROM MinedResource
