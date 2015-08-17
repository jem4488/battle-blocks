CREATE TABLE MinedResourceTypeLib
(
   MinedResourceTypeID int PRIMARY KEY,
   Name varchar(256) UNIQUE
);

INSERT INTO MinedResourceTypeLib(MinedResourceTypeID, Name)
VALUES (1, 'Shard'),
 (2, 'Gem'),
 (3, 'Crystal');

 SELECT *
 FROM MinedResourceTypeLib