var sql = require('mssql');
var config = {
   user: 'BattleBlocksAdmin',
   password: 'BattleBlocksAdmin',
   server: 'localhost',
   database: 'BattleBlocks',
};

/*
var pg = require('pg');
var conString = "postgres://postgres:PostgresAdmin$$@localhost/postgres";
*/

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
app.use(express.static('client'));
var parseJson = bodyParser.json();
//app.use(bodyParser.json());

//app.use(bodyParser.urlencoded({ extended: false }));

var allClients = [];

var maxAccumulatorTypeId = 5;
var maxSequenceNum = 6;
var maxMinedResourceTypeId = 3;
var maxColor = 2;
var colorMapping = [0, 2, 4];
var forgeRulesRBY = [{recipe:'3,0,0', gemColor:0}, {recipe:'0,1,2', gemColor:1}, {recipe:'0,0,3', gemColor:2}, 
                     {recipe:'0,2,1', gemColor:3}, {recipe:'0,3,0', gemColor:4}, {recipe:'2,0,1', gemColor:5}, 
                     {recipe:'2,1,0', gemColor:6}];


/*io.on('connection', function(client) {
   client.on('messages', function (data) {
      console.log(data);
   });

   console.log('Client connected...');

   client.emit('messages', {message: 'Hello World!'});
});
*/

io.on('connection', function(client) {
   allClients.push(client);

   console.log("AllClients: " + allClients.length);

   client.on('join', function (name) {
      client.name = name;
      console.log('Client ' + client.name + ' connected...');
      var opp = findOpponent(client);
      if (opp)
      {
         console.log("setting opponents.  Client id: " + client.id + " Opponent id: " + opp.id);
         client.opponent = opp;
         opp.opponent = client;

         console.log("emitting opponent found events");
         client.emit("opponentFound");
         opp.emit("opponentFound");
      }
      else
      {
         console.log("No Opponent Found");
         client.emit("waitingForOpponent");
      }
   });

   client.on('ready', function() {
      client.ready = true; 
      if (!client.opponent.ready)
      {
         client.opponent.emit("opponentReady", client.name);
         client.emit("waitingForPlacement");
      }
      else {
         client.opponent.emit("startGame");
         client.emit("startGame");
      }
   });

   client.on('linesCleared', function (data) {
      console.log(client.name + ": " + data);
      client.opponent.emit("updateOpponentInfo", 
         {
            lineCount: client.name + " has cleared " + data.lineCount + " lines.",
         });
   });

   client.on('positions', function (data) {
      console.log("Received position data from " + client.name);
      console.log(data);
      client.opponent.emit("battlePositions", data);
   });

   client.on('attack', function (data) {
      console.log("Received attack from " + client.name);
      client.opponent.emit("attack", data);
   });

   client.on('end', function () {
      console.log("Game ended.  " + client.name + " lost.");
      client.opponent.emit("winner");
   });

   client.on('disconnect', function() { 
      if (client.opponent)
         client.opponent.emit("winner");

      var i = allClients.indexOf(client);     

      console.log("Client " + client.name + "disconnected. " + allClients.length + " clients connected.");
      allClients.splice(0, 1);
   })
});

app.get('/', function (req, res) {
   console.log("Page requested: login");
   res.sendFile(__dirname + '/client/login.html');
});

app.get('/lobby', function (req, res) {
   console.log("Page requested: lobby");
   //create user if necessary
   verfiyUserAndRespond(req.query.name, res);   
});

app.get('/dailyResources', function (req, res) {
   console.log("Daily resources requested for " + req.query.name);
   var resources = getDailyResources(req.query.name, res);//{shardCollected: false, sketchCollected: false};
   console.log("After calling getDailyResources()");
});

app.get('/factory', function (req, res) {
   console.log("Page requested: factory");
   res.sendFile(__dirname + '/client/factory.html');
});

app.get('/sketchResources', function (req, res) {
   console.log("Page requested: sketchResources");
   getSketchResourcesAndRespond(req.query.name, res);
});

app.get('/frameResources', function (req, res) {
   console.log("Page requested: frameResources");
   getFramePieceResourcesAndRespond(req.query.name, res);
});

app.post('/factory/buildAccumulator', parseJson, function (req, res) {
   console.log("Request: buildAccumulator");
   console.log(req.body);
   saveAccumulatorAndRespond(req.query.name, req.body, res);
});

app.post('/factory/buildFrame', parseJson, function (req, res) {
   console.log("Request: buildFrame");
   console.log(req.body);
   saveFrameAndRespond(req.query.name, req.body, res);
});

app.get('/collectSketch', function (req, res) {
   console.log("Sketch requested");
   var sketch = getRandomSketch();
   saveSketchAndRespond(req.query.name, sketch, res);
});

app.get('/mine', function (req, res) {
   console.log("Page requested: mine");
   res.sendFile(__dirname + '/client/mine.html');
});

app.get('/collectShard', function (req, res) {
   console.log("Shard requested");
   var colorId = getRandomShardColor();
   saveShardAndRespond(req.query.name, colorId, res);
   //res.json(shard);
});

app.get('/archive', function (req, res) {
   console.log("Page requested: archive");
   res.sendFile(__dirname + '/client/archive.html');
});

app.get('/forge', function (req, res) {
   console.log("Page requested: forge");
   res.sendFile(__dirname + '/client/forge.html');
});

app.get('/forge/forgeRules', function (req, res) {
   console.log("Page requested: forgeRules");
   res.json(forgeRulesRBY);
});

app.get('/minedResources', function (req, res) {
   console.log("Page requested: minedResources");
   getMinedResourcesAndRespond(req.query.name, res);
});

app.post('/forge/forgeGem', parseJson, function (req, res) {
   console.log("Request: forgeGem");
   //console.log(jsonParser);
   console.log(req.body);
   saveCreatedGemAndRespond(req.query.name, req.body, res);
});

app.post('/forge/forgeCrystal', parseJson, function (req, res) {
   console.log("Request: forgeCrystal");
   //console.log(jsonParser);
   console.log(req.body);
   saveCreatedCrystalAndRespond(req.query.name, req.body, res);
});

app.get('/citadel', function (req, res) {
   console.log("Page requested: citadel");
   res.sendFile(__dirname + '/client/citadel.html');
});

app.get('/citadel/coinStatus', function (req, res) {
   console.log("Page requested: coinStatus");
   getCoinStatusAndRespond(req.query.name, res);
});

app.get('/citadel/collect', function (req, res) {
   console.log("Page requested: collect");
   getUpdatedCoinStatusAndRespond(req.query.name, res);
});

app.get('/citadel/army', function (req, res) {
   console.log("Page requested: armyResources");
   getArmyResourcesAndRespond(req.query.name, res);
});

app.get('/citadel/frameResources', function (req, res) {
   console.log("Page requested: frameResources");
   getFrameResourcesAndRespond(req.query.name, res);
});

app.get('/citadel/crystalResources', function (req, res) {
   console.log("Page requested: crystalResources");
   getCrystalResourcesAndRespond(req.query.name, res);
});

app.get('/citadel/accumulatorResources', function (req, res) {
   console.log("Page requested: accumulatorResources");
   getAccumulatorResourcesAndRespond(req.query.name, res);
});

app.post('/citadel/buildRobot', parseJson, function (req, res) {
   console.log("Request: buildRobot");
   //console.log(jsonParser);
   console.log(req.body);
   saveRobotAndRespond(req.query.name, req.body, res);
});

app.get('/coliseum', function (req, res) {
   console.log("Page requested: coliseum");
   //console.log(req.query.name);
   res.sendFile(__dirname + '/client/play.html');
});

server.listen(8080);

function findOpponent(client) {
   for (var i = 0; i < allClients.length; i ++)
   {
      var potentialOppenent = allClients[i];
      if (client != potentialOppenent && !potentialOppenent.opponent)
      {
         console.log("Opponent found");
         console.log(potentialOppenent.id);
         return potentialOppenent;
      }
   }
}

function getDailyResources(name, res) {
   var lastShardReceived;
   var lastSketchReceived;
   //var response = res;
   var connection = new sql.Connection (config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }

      var request = new sql.Request(connection);
      request.query("SELECT * FROM Competitor WHERE UserName = '" + name + "'", function(err, recordset) {
         if (err) {
            console.error("Error running query: " + err);
            return;
         }

         var today = new Date();
         console.log(today);
         if (recordset[0])
         {
            lastSketchReceived = new Date(recordset[0].LastSketchAcquired);
            lastShardReceived = new Date(recordset[0].LastShardAcquired);
            console.log("Sketch: " + lastSketchReceived);
            console.log("Shard: " + lastShardReceived);
         }
         connection.close();

         var now = new Date();
         var diff = Math.abs(now - lastSketchReceived);
         var sketchReceived = diff < 86400000;
         console.log(diff);

         diff = Math.abs(now - lastShardReceived);
         var shardReceived = diff < 86400000;
         console.log(diff);
         //console.log(response);
         res.json({shardCollected: shardReceived, sketchCollected: sketchReceived});
      });
   });
};

function verfiyUserAndRespond(username, response) {
   var connection = new sql.Connection (config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }

      var request = new sql.Request(connection);
      request.query("INSERT INTO Competitor (username, LastSketchAcquired, LastShardAcquired) "
         + "SELECT '" + username + "', '2000-01-01', '2000-01-01' "
         + "WHERE NOT EXISTS ("
            + "SELECT UserName FROM Competitor WHERE UserName = '" + username + "');", function(err, recordset) {
         if (err) {
            console.error("Error running query: " + err);
            return;
         }
         
         connection.close();
         
         response.sendFile(__dirname + '/client/lobby.html');
      });
   });
};

function getRandomShardColor() {
   var rand = Math.floor(Math.random() * 1000) % maxColor;
   console.log("Random color: " + rand);
   return colorMapping[rand];
};

function getRandomSketch() {

   return {typeId: Math.floor(Math.random() * 1000) % maxAccumulatorTypeId + 1, seqNum: Math.floor(Math.random() * 1000) % maxSequenceNum + 1};
};

function saveShardAndRespond(username, colorId, response) {
   var connection = new sql.Connection (config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }

      var request = new sql.Request(connection);
      request.query(
         "INSERT INTO MinedResource (CompetitorID, MinedResourceTypeID, Color) "
         + "(SELECT C.CompetitorID, 1, " + colorId 
         + " FROM Competitor C "
         + "WHERE UserName = '" + username + "');", function(err, recordset) {

        /* pgClient.query("INSERT INTO MinedResource (CompetitorID, MinedResourceTypeID, Color) (
SELECT C.CompetitorID, 1, " + colorId + "
FROM Competitor C
WHERE UserName = '" + username + "');", function(err, result) {*/
         if (err) {
            console.error("Error running query: " + err);
            return;
         }

         request.query("UPDATE Competitor " 
            + "SET LastShardAcquired = SYSDATETIME() "
            + "WHERE UserName = '" + username + "';", function (err, recordset) {
               if (err) {
                  console.error('Error running query' + err);
                  return;
               }

               connection.close();     
               response.json({color: colorId});
         });
      });
   });
};

function saveSketchAndRespond(username, sketch, response) {
   var connection = new sql.Connection (config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }

      var request = new sql.Request(connection);
      request.query(
         "INSERT INTO Sketch (CompetitorID, AccumulatorTypeID, SeqNum) "
         + "(SELECT C.CompetitorID, " + sketch.typeId + ", " + sketch.seqNum 
         + " FROM Competitor C "
         + "WHERE UserName = '" + username + "');", function(err, recordset) {
        
         if (err) {
            console.error("Error running query: " + err);
            return;
         }

         request.query("UPDATE Competitor " 
            + "SET LastSketchAcquired = SYSDATETIME() "
            + "WHERE UserName = '" + username + "';", function (err, recordset) {
               if (err) {
                  console.error('Error running query' + err);
                  return;
               }

               connection.close();     
               response.json(sketch);
         });
      });
   });
};

function getMinedResourcesAndRespond(userName, response) {
   var connection = new sql.Connection(config, function(err) {
       if (err) {
         console.log('Could not connect: ' + err);
         return;
       }
       
       var request = new sql.Request(connection); // or: var request = connection.request(); 
       request.query("SELECT MR.MinedResourceID, MR.MinedResourceTypeID, MRTL.Name, MR.Color, MR.Used"
         +" FROM MinedResource MR"
         +"   INNER JOIN Competitor C ON MR.CompetitorID = C.CompetitorID"
         +"   INNER JOIN MinedREsourceTypeLib MRTL ON MR.MinedResourceTypeID = MRTL.MinedResourceTypeID"
         +" WHERE C.UserName = '" + userName + "';", function(err, recordset) {

           if (err) {
               console.log("Error running query:" + err)
               return;
           }
           console.log(recordset);
           connection.close();
           response.json(recordset);
       });
       
       // Stored Procedure 
       
       /*var request = new sql.Request(connection);
       request.input('input_parameter', sql.Int, 10);
       request.output('output_parameter', sql.VarChar(50));
       request.execute('procedure_name', function(err, recordsets, returnValue) {
           // ... error checks 
           
           console.dir(recordsets);
       });
       */
   });   
};

function getSketchResourcesAndRespond(userName, response) {
   var connection = new sql.Connection(config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }
      var request = new sql.Request(connection);
      request.query(
         "SELECT S.SketchID, S.AccumulatorTypeID, ATL.Name, ATL.BaseImageName, S.SeqNum"
         +" FROM Sketch S"
         +"   INNER JOIN Competitor C ON S.CompetitorID = C.CompetitorID"
         +"   INNER JOIN AccumulatorTypeLib ATL ON S.AccumulatorTypeID = ATL.AccumulatorTypeID"
         +" WHERE C.UserName = '" + userName + "';", function(err, recordset) {
        
         if (err) {
            console.error('Error running query: ' + err);
            return;
         }
         
         console.log(recordset);
         connection.close();
         response.json(recordset);         
      });
   });
};

function getFramePieceResourcesAndRespond(userName, response) {
   var connection = new sql.Connection(config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }
      var request = new sql.Request(connection);
      request.query(
         "SELECT FP.FramePieceID, FP.RobotTypeID, RTL.Name, RTL.BaseImageName, FP.SeqNum"
         +" FROM FramePiece FP"
         +"   INNER JOIN Competitor C ON FP.CompetitorID = C.CompetitorID"
         +"   INNER JOIN RobotTypeLib RTL ON FP.RobotTypeID = RTL.RobotTypeID"
         +" WHERE C.UserName = '" + userName + "';", function(err, recordset) {
        
         if (err) {
            console.error('Error running query: ' + err);
            return;
         }
         
         console.log(recordset);
         connection.close();
         response.json(recordset);         
      });
   });
};

function getCoinStatusAndRespond(userName, response) {
   var connection = new sql.Connection(config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }
      var request = new sql.Request(connection);
      request.query(
         "SELECT LastCoinCollection, Coins "
         + "FROM Competitor "
         + "WHERE UserName = '" + userName + "';", function(err, recordset) {
        
         if (err) {
            console.error('Error running query: ' + err);
            return;
         }
         
         console.log(recordset);
         connection.close();

         var diff = Math.abs(new Date() - new Date(recordset[0].LastCoinCollection));
         var hours = Math.floor(diff/3600000);
         if (hours > 6)
            hours = 6;         

         response.json({availableForCollection: hours * 100, coins: recordset[0].Coins});         
      });
   });
};

function getUpdatedCoinStatusAndRespond(userName, response) {
   var connection = new sql.Connection(config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }
      var request = new sql.Request(connection);
      request.query(
         "SELECT LastCoinCollection, Coins "
         + "FROM Competitor "
         + "WHERE UserName = '" + userName + "';", function(err, recordset) {
        
         if (err) {
            console.error('Error running query: ' + err);
            return;
         }            

         var diff = Math.abs(new Date() - new Date(recordset[0].LastCoinCollection));
         var hours = Math.floor(diff/3600000);
         if (hours > 6)
            hours = 6;   

         var coins = recordset[0].Coins + hours * 100;
         request.query(
            "UPDATE Competitor "
            + "SET LastCoinCollection = SYSDATETIMEOFFSET(), Coins = " + coins
            + "WHERE UserName = '" + userName + "';", function(err, recordset) {

               if (err) {
                  console.error('Error running query: ' + err);
                  return;
               }

               connection.close();
               response.json({availableForCollection: 0, coins: coins});
         });         
      });
   });
};

function getArmyResourcesAndRespond(userName, response) {
   var connection = new sql.Connection(config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }
      var request = new sql.Request(connection);
      request.query(
         "SELECT MR.ManufacturedRobotID, MRC.Color, RTL.Name AS RobotType, RTL.BaseImageName AS RobotImage, ATL.Name AS AccumulatorType, ATL.BaseImageName AS AccumulatorImage "
         + "FROM ManufacturedRobot MR "
            + "INNER JOIN Competitor C ON MR.CompetitorID = C.CompetitorID "
            + "INNER JOIN MinedResource MRC ON MR.MinedResourceID = MRC.MinedResourceID "
            + "INNER JOIN Frame F ON MR.FrameID = F.FrameID "
            + "INNER JOIN RobotTypeLib RTL ON F.RobotTypeID = RTL.RobotTypeID "
            + "INNER JOIN Accumulator A ON MR.AccumulatorID = A.AccumulatorID "
            + "INNER JOIN AccumulatorTypeLib ATL ON A.AccumulatorTypeID = ATL.AccumulatorTypeID "
         + "WHERE C.UserName = '" + userName + "';", function(err, recordset) {
        
         if (err) {
            console.error('Error running query: ' + err);
            return;
         }
         
         console.log(recordset);
         connection.close();
         response.json(recordset);         
      });
   });
};

function getFrameResourcesAndRespond(userName, response) {
   var connection = new sql.Connection(config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }
      var request = new sql.Request(connection);
      request.query(
         "SELECT F.FrameID, F.RobotTypeID, RTL.Name, RTL.BaseImageName, F.Used"
         +" FROM Frame F"
         +"   INNER JOIN Competitor C ON F.CompetitorID = C.CompetitorID"
         +"   INNER JOIN RobotTypeLib RTL ON F.RobotTypeID = RTL.RobotTypeID"
         +" WHERE C.UserName = '" + userName + "' AND F.Used = 0;", function(err, recordset) {
        
         if (err) {
            console.error('Error running query: ' + err);
            return;
         }
         
         console.log(recordset);
         connection.close();
         response.json(recordset);         
      });
   });
};

function getCrystalResourcesAndRespond(userName, response) {
   var connection = new sql.Connection(config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }
      var request = new sql.Request(connection);
      request.query(
         "SELECT MR.MinedResourceID, MR.MinedResourceTypeID, MRTL.Name, MR.Color, MR.Used"
         +" FROM MinedResource MR"
         +"   INNER JOIN Competitor C ON MR.CompetitorID = C.CompetitorID"
         +"   INNER JOIN MinedResourceTypeLib MRTL ON MR.MinedResourceTypeID = MRTL.MinedResourceTypeID"
         +" WHERE C.UserName = '" + userName + "' AND MR.MinedResourceTypeID = 3 AND MR.Used = 0;", function(err, recordset) {
        
         if (err) {
            console.error('Error running query: ' + err);
            return;
         }
         
         console.log(recordset);
         connection.close();
         response.json(recordset);         
      });
   });
};

function getAccumulatorResourcesAndRespond(userName, response) {
   var connection = new sql.Connection(config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }
      var request = new sql.Request(connection);
      request.query(
         "SELECT A.AccumulatorID, A.AccumulatorTypeID, ATL.Name, A.Used, ATL.BaseImageName"
         +" FROM Accumulator A"
         +"   INNER JOIN Competitor C ON A.CompetitorID = C.CompetitorID"
         +"   INNER JOIN AccumulatorTypeLib ATL ON A.AccumulatorTypeID = ATL.AccumulatorTypeID"
         +" WHERE C.UserName = '" + userName + "' AND A.Used = 0;", function(err, recordset) {
        
         if (err) {
            console.error('Error running query: ' + err);
            return;
         }
         
         console.log(recordset);
         connection.close();
         response.json(recordset);         
      });
   });
};

function saveCreatedGemAndRespond(userName, shards, response) {
   if (shards.length != 3)
      response.send({Status: 401});

   var color = verifyRecipe(shards);
   if (color == undefined)
      response.send({Status: 401});
   else
   {
      var idList = shards[0].MinedResourceID + ", " + shards[1].MinedResourceID + ", " + shards[2].MinedResourceID;
      console.log("IDList: " + idList);
      var connection = new sql.Connection(config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }
      var request = new sql.Request(connection);
      request.query(
         "INSERT INTO MinedResource (CompetitorID, MinedResourceTypeID, Color) "
         + "(SELECT C.CompetitorID, 2, " + color 
         + " FROM Competitor C "
         + " WHERE UserName = '" + userName + "');", function(err, recordset) {
        
         if (err) {
            console.error('Error running query: ' + err);
            return;
         }

         request.query("DELETE FROM MinedResource " 
            + "WHERE MinedResourceID IN (" + idList + ");", function (err, recordset) {
               if (err) {
                  console.error('Error running query' + err);
                  return;
               }

               connection.close();     
               response.json("Gem successfully created.");
         });
         
         //console.log("RecordSet: " + recordset);
         //connection.close();
         //response.json(recordset);         
      });
   });
      //response.json({"gemColor": color});
   }
};

function saveRobotAndRespond(userName, data, response)
{   
   var connection = new sql.Connection(config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }

      var request = new sql.Request(connection);
      request.query(
         "INSERT INTO ManufacturedRobot (CompetitorID, MinedResourceID, FrameID, AccumulatorID) "
         + "(SELECT C.CompetitorID, " + data.crystalId + ", " + data.frameId + ", " + data.accumId 
         + " FROM Competitor C "
         + " WHERE UserName = '" + userName + "');", function(err, recordset) {
        
         if (err) {
            console.error('Error running query: ' + err);
            return;
         }

         request.query("UPDATE MinedResource "
            + "SET Used = 1" 
            + "WHERE MinedResourceID = " + data.crystalId + ";", function (err, recordset) {
            
            if (err) {
               console.error('Error running query' + err);
               return;
            }

               request.query("UPDATE Frame "
                  + "SET Used = 1" 
                  + "WHERE FrameID = " + data.frameId + ";", function (err, recordset) {
               
               if (err) {
                  console.error('Error running query' + err);
                  return;
               }
                  request.query("UPDATE Accumulator "
                  + "SET Used = 1" 
                  + "WHERE AccumulatorID = " + data.accumId + ";", function (err, recordset) {
                     if (err) {
                        console.error('Error running query' + err);
                        return;
                     }

                     connection.close();     
                     response.json("Robot successfully created.");
                  });
               });
         });        
      });
   });
};

function verifyRecipe(shards) {
   console.log("Logging Shards: ");
   console.log(shards);
   var red = 0;
   var yellow = 0;
   var blue = 0;

   for(var i = 0; i < shards.length; i++)
   {
      var shardColor = shards[i].Color;
      console.log("Shard color: " + shardColor);
      if (shardColor == 0)
         red++;
      else if (shardColor == 2)
         yellow++;
      else if (shardColor == 4)
         blue++;
   }

   var recipe = red + "," + blue + "," + yellow;
   console.log("Recipe: " + recipe);
   var index;
   for (index = 0; index < forgeRulesRBY.length; index++)
   {

      console.log("Rule: " + forgeRulesRBY[index].recipe);
      if (forgeRulesRBY[index].recipe == recipe)
      {   

         console.log("Found recipe at index " + index);
         break;
      }
   }

   if (index < forgeRulesRBY.length)
   {
      console.log("Rule Found");
      return forgeRulesRBY[index].gemColor;
   }
   else
   {
      console.log("No Rule Found");
      return undefined;
   }
};


function saveCreatedCrystalAndRespond(userName, gems, response) {
   if (gems.length != 3)
   {   
      response.send({Status: 401});
   }
   else
   {
      var color = gems[0].Color
      var idList = gems[0].MinedResourceID + ", " + gems[1].MinedResourceID + ", " + gems[2].MinedResourceID;
      console.log("IDList: " + idList);
      var connection = new sql.Connection(config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }
      var request = new sql.Request(connection);
      request.query(
         "INSERT INTO MinedResource (CompetitorID, MinedResourceTypeID, Color) "
         + "(SELECT C.CompetitorID, 3, " + color 
         + " FROM Competitor C "
         + " WHERE UserName = '" + userName + "');", function(err, recordset) {
        
         if (err) {
            console.error('Error running query: ' + err);
            return;
         }

         request.query("DELETE FROM MinedResource " 
            + "WHERE MinedResourceID IN (" + idList + ");", function (err, recordset) {
               if (err) {
                  console.error('Error running query' + err);
                  return;
               }

               connection.close();     
               response.json("Crystal successfully created.");
         });
      });
   });
   }
};

function saveAccumulatorAndRespond(userName, data, response) {   
   console.log("IDList: " + data.idList);
   console.log("TypeId: " + data.typeId);

   var connection = new sql.Connection(config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }
      var request = new sql.Request(connection);
      request.query(
         "INSERT INTO Accumulator (CompetitorID, AccumulatorTypeID) "
         + "(SELECT C.CompetitorID, " + data.typeId 
         + " FROM Competitor C "
         + " WHERE UserName = '" + userName + "');", function(err, recordset) {
        
         if (err) {
            console.error('Error running query: ' + err);
            return;
         }

         request.query("DELETE FROM Sketch " 
            + "WHERE SketchID IN (" + data.idList + ");", function (err, recordset) {
               if (err) {
                  console.error('Error running query' + err);
                  return;
               }

               connection.close();     
               response.json("Accumulator successfully created.");
         });
      });
   });
};

function saveFrameAndRespond(userName, data, response) {   
   console.log("IDList: " + data.idList);
   console.log("TypeId: " + data.typeId);

   var connection = new sql.Connection(config, function(err) {
      if (err) {
         console.error('Could not connect: ' + err);
         return;
      }
      var request = new sql.Request(connection);
      request.query(
         "INSERT INTO Frame (CompetitorID, RobotTypeID) "
         + "(SELECT C.CompetitorID, " + data.typeId 
         + " FROM Competitor C "
         + " WHERE UserName = '" + userName + "');", function(err, recordset) {
        
         if (err) {
            console.error('Error running query: ' + err);
            return;
         }

         request.query("DELETE FROM FramePiece " 
            + "WHERE FramePieceID IN (" + data.idList + ");", function (err, recordset) {
               if (err) {
                  console.error('Error running query' + err);
                  return;
               }

               connection.close();     
               response.json("Accumulator successfully created.");
         });
      });
   });
};