
var tetriminoSize = 40;
var boardHeight = 16;
var colors = ["#E60000", "#00E600", "#FFFF47", "#75FFFF", "#0033CC", "#FF9933", "#CC33FF"];
var images = ["redTetrimino.jpg", "greenTetrimino.jpg", "yellowTetrimino.jpg", "tealTetrimino.jpg", "blueTetrimino.jpg", "orangeTetrimino.jpg", "purpleTetrimino.jpg", "grayTetrimino.jpg"];
var robotTypes = [
   {name: "Gladiator", attackMultiplier: 1, life: 100, healMultiplier: 0, accumMultiplier: 1},
   {name: "Samuri", attackMultiplier: 2, life: 50, healMultiplier: 0, accumMultiplier: 1},
   {name: "Sentinel", attackMultiplier: 0, life: 100, healMultiplier: 1, accumMultiplier: 1},
   {name: "Valkerie", attackMultiplier: .5, life: 100, healMultiplier: 0, accumMultiplier: 1.5},
];
var rotations = [
   [[[1,1,0], [0,1,1]], [[0,1],[1,1],[1,0]]], // red z
   [[[0,1,1], [1,1,0]], [[1,0],[1,1],[0,1]]], // green s
   [[[1,1], [1,1]], [[1,1],[1,1]]], // yellow square
   [[[1], [1], [1], [1]], [[1,1,1,1]]], // lt blue l
   [[[1,0], [1,0], [1,1]], [[0,0,1],[1,1,1]], [[1,1],[0,1],[0,1]], [[0,0,0],[1,1,1],[1,0,0]]], // blue l
   [[[0,1], [0,1], [1,1]], [[0,0,0],[1,1,1],[0,0,1]], [[1,1],[1,0],[1,0]], [[1,0,0],[1,1,1]]], // orange j
   [[[0,1,0], [1,1,1]], [[0,1],[1,1],[0,1]], [[0,0,0],[1,1,1],[0,1,0]], [[1,0],[1,1],[1,0]]] // purple t
];
var KEY = {LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ROTATERIGHT: 70, ROTATELEFT: 68, HOLD:32}

var board;
var myBattleGrid = Array.apply(null, Array.apply(null, Array(3)));
var oppBattleGrid;

var piece;
var heldPiece;
var canHold = true;
var xOffset = 4;
var yOffset = 0;
var timer;
var startTimer;
var waitTime = 5;
var playing = false;
var totalLinesCleared = 0;
var pieces = [];
var attackPoints = [0, 0, 0, 0, 0, 0, 0];
var accumulatorPoints = [0, 0, 0, 0, 0, 0, 0];
//var accumulatorTotals = [0, 0, 0, 0, 0, 0, 0];
var numRobots = 5;
var placedRobots = 0;
var selectedRobotType;
var selectedRobotColor;


var socket = io.connect('http://tardis:8080');
socket.on('connect', function (data) {
   //var name = prompt("What is your name?");
   var name = sessionStorage.getItem('name');
   $("#name").text(name);
   socket.emit('join', name);
});

socket.on('opponentReady', function (data) {
   console.log("Oppoent is ready, waiting for you to place robots");
   $('#message').text(data + " is ready to begin. Please finish placing your robots.");
});

socket.on('waitingForPlacement', function (data) {
   console.log("Waiting for opponent to place robots");
   $('#message').text("Waiting for opponent to place their robots.");
});

socket.on('waitingForOpponent', function (data) {
   console.log("Waiting for opponent to join");
   $('#message').text("Waiting for opponent to join.");   
});

socket.on('opponentFound', function (data) {
   console.log("Opponents have been matched");
   $('#message').text("Please place your robots, then click ready.");
   $('#play').prop('disabled', false);
})

socket.on('startGame', function (data) {
   startTimer = window.setInterval(decreaseWait, 1000);
})

socket.on('updateOpponentInfo', function (data) {
   console.log("Received message from opponent");
   console.log(data);
   $("#opponentsLines").text(data.lineCount);
});

socket.on('battlePositions', function (data) {
   console.log("Received robot locations");
   console.log(data);
   oppBattleGrid = transposeOpponentsGrid(data);
   placeOpponentsRobots(oppBattleGrid);
});

socket.on('attack', function (data) {
   console.log("Received attack");
   processAttack(data.attacks);
});

socket.on('winner', function () {
   window.clearInterval(timer);
   console.log("Removing event listeners");
   document.removeEventListener("keydown", keydown);
   $("#message").attr('class', 'won').text("You are the winner!!");
});

$(document).ready(function() {
   //populate robot selections:
   var list = $('#robotTypes');
   $.each(robotTypes, function(index, value) {
      list.append('<li><button data-index=\'' + index + '\' onclick=\'robotTypeSelected(this)\'>' + value.name + '</button></li>');
   });

   list = $('#robotColors');
   $.each(colors, function(index, value) {
      list.append('<li><button data-index=\'' + index + '\' onclick=\'robotColorSelected(this)\' style=\'background-color:' + value + ';\'>&nbsp;</button></li>')
   });

   drawBattleGrids();
   var myGrid = document.getElementById("myBattleGrid");
   myGrid.addEventListener("click", gridClicked, false);
   myBattleGrid = initializeBattleGrid();
});

function decreaseWait() {
   console.log("Decreasing wait time from " + waitTime);
   if (waitTime > 0)
   {
      $("#message").text("Game will be starting in " + waitTime + " seconds.");
   }   
   else 
   {
      window.clearInterval(startTimer);
      startGame();
   }   
   waitTime--;
}

function processAttack(attackData)
{
   console.log("Processing Attack");
   console.log(attackData);

   for(var i = 0; i < attackData.length; i ++)
   {
      var attack = attackData[i];
      var position = findPositionById(attack.id);
      var robot = myBattleGrid[position.row][position.column];
      robot.life = robot.life - attack.damage;
      if (robot.life <= 0)
      {   
         robot = undefined;
         placedRobots--;
      }
      myBattleGrid[position.row][position.column] = robot;
      var currentLife = robot ? robot.life : "dead";
      console.log("Removed " + attack.damage + " life from robot at position " +
         position.row + ", " + position.column + ". Current life is now " +  currentLife);
   }

   drawRobotsOnGrid(getMyBattleGrid(), myBattleGrid);
   console.log("Sending updated robot information after processing attack");
   console.log(myBattleGrid);
   socket.emit('positions', myBattleGrid);
   if(placedRobots == 0)
      endGame();
}

function endGame() {
   window.clearInterval(timer);
   console.log("Removing event listeners");
   document.removeEventListener("keydown", keydown);
   socket.emit('end');
   $("#message").attr('class', 'lost').text("Sorry, you have lost!");
}

function findPositionById(id) {
   for(var i = 0; i < myBattleGrid.length; i ++)
   {
      for(var j = 0; j < myBattleGrid[i].length; j++)
      {
         var robot = myBattleGrid[i][j];
         if (robot && robot.id == id)
            return {
               row: i,
               column: j
            };
      }
   }
}

function initializeBattleGrid() {
   size = 3;
   var grid = [];
   while(size--) {
      grid.push([]);
   }
   return grid;
}

function drawRobotsOnGrid(grid, robots)
{
   drawBattleGrid(grid);
   for(var i = 0; i < robots.length; i++)
   {
      for(var j = 0; j < robots[i].length; j++)
      {
         if(robots[i][j])
         {
            grid.fillStyle = colors[robots[i][j].color];
            grid.fillRect(j * 50 + 10, i * 50 + 10, 30, 30);
            grid.font = "15px Arial";
            grid.fillStyle = "#000000"
            grid.fillText(robots[i][j].life, j * 50 + 10, i * 50 + 30);
         }
      }
   }
}

function placeOpponentsRobots(data) {
   console.log("Placing robots on grid");
   console.log(data);
   drawRobotsOnGrid(getOpponentsBattleGrid(), data);
}

function transposeOpponentsGrid(data) {
   console.log("Received grid");
   console.log(data);
   var newGrid = initializeBattleGrid();
   
   for (var row = 0; row < data.length; row++)
   {
      var newColumn = 0;
      for(var column = 2; column >= 0; column--)
      {
         if(data[row][column])
         {
            console.log("Robot detected at " + row + ", " + column + ". Will be moved to " + row + ", " + newColumn);
         }
         console.log("Setting " + row + ", " + newColumn + " equal to " + row + ", " + column);
         newGrid[row][newColumn] = data[row][column];
         newColumn++;
      }
   }

   console.log("Transposed grid");
   console.log(newGrid);
   return newGrid;
}

function robotTypeSelected(element)
{
   if(selectedRobotType >= 0)
   {
      var oldElement = $('#robotTypes button[data-index=' + selectedRobotType + ']');
      console.log(oldElement);
      oldElement.removeAttr('class', 'selected');
   }   

   console.log(element);
   $(element).attr('class', 'selected');
   //selectedRobotType = element.id;
   selectedRobotType = $(element).data("index");
   console.log("Selected type: " + selectedRobotType);
}

function robotColorSelected(element)
{
   if(selectedRobotColor >= 0)
   {
      var oldElement = $('#robotColors button[data-index=' + selectedRobotColor + ']');
      console.log(oldElement);
      oldElement.removeAttr('class', 'selected');
   }  

   console.log(element);
   $(element).attr('class', 'selected');
   selectedRobotColor = $(element).data("index");
   console.log("Selected color: " + selectedRobotColor);
}

function gridClicked(event) {
   var message;

   if (placedRobots >= numRobots)
   {   
      message = "You have already placed all your robots.";      
   }
   else if(!(selectedRobotType >= 0))
   {
      message = "Please select a type of robot.";
   }
   else if(!(selectedRobotColor >= 0))
   {
      message = "Please select a color for your robot.";
   }

   console.log("Message: " + message);
   
   if (message)
   {
      $('#robotMessage').text(message);
      return;
   }   

   
   var myGrid = document.getElementById("myBattleGrid");

   var position = this.getBoundingClientRect();
   var a = Math.floor((event.clientX - position.left)/50);
   var b = Math.floor((event.clientY - position.top)/50);

   myBattleGrid[b][a] = {id: placedRobots, color: selectedRobotColor, life: robotTypes[selectedRobotType].life, type: selectedRobotType, accum:0};
   drawRobotsOnGrid(getMyBattleGrid(), myBattleGrid);   
   console.log(myBattleGrid);

   $('#robotMessage').text("");
   placedRobots++;
}

function readyToStartGame() {
   socket.emit('ready');
   $("#play").prop('disabled', true);
   $("#battleSetup").fadeOut();
   $("#gameArea").fadeIn();
}

function startGame() {  
   $("#message").text(""); 
   document.addEventListener('keydown', keydown, false);
   console.log("Starting board setup.")
   playing = true;
   totalLinesCleared = 0;
   attackPoints = [0, 0, 0, 0, 0, 0, 0];
   accumulatorPoints = [0, 0, 0, 0, 0, 0, 0];
   clearCanvas();
   boardSetup();
   populatePieces(3);
   piece = getNextPiece();
   console.log(piece);
   startFallingPiece();
   console.log(attackPoints);
   console.log(accumulatorPoints);
   //remove click event so robots cannot be moved.
   socket.emit('positions', myBattleGrid);
}

function keydown(ev) {
   var handled = false;
   if (playing) {
      switch(ev.keyCode) {
         case KEY.LEFT:   movePiece(-1, 0);  handled = true; break;
         case KEY.RIGHT:  movePiece(1, 0); handled = true; break;
         case KEY.UP:     dropPiece();    handled = true; break;
         case KEY.DOWN:   movePieceDown();  handled = true; break;     
         case KEY.ROTATERIGHT: rotatePiece(-1);  handled = true; break;
         case KEY.ROTATELEFT: rotatePiece(1); handled = true; break; 
         case KEY.HOLD: holdPiece(); handled = true; break;    
      }
   }      
   if (handled)
      ev.preventDefault(); // prevent arrow keys from scrolling the page (supported in IE9+ and all other browsers)
}

function holdPiece() {
   if (!canHold)
      return;

   canHold = false;
   window.clearInterval(timer);
   tempPiece = heldPiece;
   console.log("Temp Piece: ");
   console.log(tempPiece);
   heldPiece = piece;
   console.log("Hold Piece:");
   console.log(heldPiece);
   drawHoldPiece();
   clearPiece();
   startNewPiece(tempPiece);
}

function startFallingPiece() {   
   drawPiece(getGameBoard(), piece, xOffset, yOffset, 1, findShadowLocation());
   timer = window.setInterval(movePieceDown, 1000);
}

function dropPiece() {
   while(movePieceDown()){}
}

function movePieceDown() {
   if (!movePiece(0, 1))
   {
      canHold = true;
      window.clearInterval(timer);
      addPieceToBoard();
      //check cleared lines
      clearLines();

      if (yOffset == 0)
      {
         //End the Game.
         endGame();
         return false;;
      }

      startNewPiece();
      return false;
   }
   return true;
}

function startNewPiece(newPiece)
{
      piece = newPiece || getNextPiece();
      xOffset = 4;
      yOffset = 0;
      startFallingPiece();
}

function movePiece(changeX, changeY) {
   if (canPieceMove(xOffset, yOffset, changeX, changeY))
   {
      clearPiece(piece, xOffset, yOffset);
      yOffset += changeY;
      xOffset += changeX;
      drawPiece(getGameBoard(), piece, xOffset, yOffset, 1, findShadowLocation());
      return true;
   }
   return false;  
}

function rotatePiece(direction) {
   //console.log("Rotate: " + direction + " Current Index: " + piece.rotationIndex);
   var newRotationIndex = piece.rotationIndex + direction;
   if(newRotationIndex == rotations[piece.color].length)
      newRotationIndex = 0;
   else if (newRotationIndex < 0)
      newRotationIndex = rotations[piece.color].length - 1;

   clearPiece();
   piece.shape = rotations[piece.color][newRotationIndex];
   piece.rotationIndex = newRotationIndex;
   drawPiece(getGameBoard(), piece, xOffset, yOffset, 1, findShadowLocation());
}

function clearBlock(x, y) {
   var board = getGameBoard();   
   board.clearRect(x * tetriminoSize, y * tetriminoSize, tetriminoSize, tetriminoSize);
}

function clearPiece()
{
   for(var y = 0; y < piece.shape.length; y++)
   {
      for(var x = 0; x < piece.shape[y].length; x++)
      {
         if (piece.shape[y][x] == 1)
         {
            clearBlock(x + xOffset, y + yOffset);
            clearBlock(x + xOffset, y + findShadowLocation());
         }   
      }
   }
}

function drawBlock(canvas, x, y, colorIndex, scale) {
   scale = scale || 1;
      
      var img = new Image();
      img.src = images[colorIndex]; //'redTetrimino.jpg';
      canvas.drawImage(img, x * tetriminoSize * scale, y * tetriminoSize * scale, tetriminoSize * scale, tetriminoSize * scale);
}

function drawPiece(canvas, piece, xOffset, yOffset, scale, shadowOffset)
{
   //console.log("Drawing piece to scale: " + scale);
   scale = scale || 1;
   //console.log("Drawing piece Row:" + yOffset + " Column:" + xOffset);
   for(var y = 0; y < piece.shape.length; y++)
   {
      for(var x = 0; x < piece.shape[y].length; x++)
      {
         if (piece.shape[y][x] == 1)
         {
            drawBlock(canvas, x + xOffset, y + yOffset, piece.color, scale);
            
            if (shadowOffset && shadowOffset != yOffset)
               drawBlock(canvas, x + xOffset, y + shadowOffset, 7, scale);
         }   
      }
   }
}

function drawHoldPiece()
{
   console.log("drawing hold piece");
   var canvas = getHoldCanvas();
   canvas.clearRect(0, 0, 100, 120);
   drawPiece(getHoldCanvas(), heldPiece, 1, 1, .5);
}

function canPieceMove(xOffset, yOffset, changeX, changeY)
{
   var bottom = yOffset + piece.shape.length;
   var right = xOffset + piece.shape[0].length;

   if (bottom >= boardHeight && changeY > 0)
      return false;
   else if (changeX > 0 && right >= 10)
      return false;
   else if (changeX < 0 && xOffset <= 0)
      return false;
   else if (detectPieceCollision(xOffset, yOffset, changeX, changeY))
      return false;
   return true;
}

function detectPieceCollision(xOffset, yOffset, changeX, changeY)
{
   for(var y = 0; y < piece.shape.length; y++)
   {
      for(var x = 0; x < piece.shape[y].length; x++)
      {
         if (piece.shape[y][x] == 1)
         {
            if (board[y + yOffset + changeY][x + xOffset + changeX] >= 0)
            {
               //console.log("Collision detected. Row: " + (y + yOffset) + "Column: " + (x + xOffset));
               return true;
            }  
         }
      }
   }   
   return false;
}

function findShadowLocation() {
   var y = yOffset;
   while(canPieceMove(xOffset, y, 0, 1))
   {
      y++;
   }
   return y;
}

function addPieceToBoard()
{
   for(var y = 0; y < piece.shape.length; y++)
   {
      for(var x = 0; x < piece.shape[y].length; x++)
      {
         if (piece.shape[y][x] == 1)
            board[y + yOffset][x + xOffset] = piece.color;
      }
   }   
   //console.log("Piece added to board");
   //console.log(logBoard());
}

function clearLines()
{
   var linesCleared = 0;
   for(var y = 0; y < boardHeight; y++)
   {
      var lineComplete = false;
      for(var x = 0; x < 10; x++)
      {
         if (board[y][x] < 0)
            break;
         else if (x == 9)
            lineComplete = true;
      }
      if (lineComplete)
      {
         linesCleared++;
         totalLinesCleared++;
         scoreLine(y, linesCleared);
         clearLine(y);
      }
   }
   if (linesCleared > 0)
   {
      console.log("Lines cleared by piece: " + linesCleared);
      console.log("Total lines cleared: " + totalLinesCleared);            
      console.log("Accumulator Points:");
      console.log(accumulatorPoints);


      socket.emit("linesCleared", {
         lineCount: totalLinesCleared, 
      });

      attack();
      updateAccumulatorTotals();
      $("#linesCleared").text("Total lines cleared: " + totalLinesCleared);
      //socket.emit('messages', "Total lines cleared: " + totalLinesCleared);
   }
}

function updateAccumulatorTotals()
{
   for(var i = 0; i < myBattleGrid.length; i ++)
   {
      for(var j = 0; j < myBattleGrid[i].length; j++)
      {
         var robot = myBattleGrid[i][j];
         if (robot)
         {
            //console.log("Color: " + robot.color + " Prev Total: " + accumulatorTotals[robot.color] + " Points: " + accumulatorPoints[robot.color] + " Multiplier: " + robotTypes[robot.type].accumMultiplier);
            //accumulatorTotals[robot.color] = accumulatorTotals[robot.color] + accumulatorPoints[robot.color] * robotTypes[robot.type].accumMultiplier;
            robot.accum = robot.accum + accumulatorPoints[robot.color] * robotTypes[robot.type].accumMultiplier;
            $("#" + robot.id + "Accum").text(robot.accum).css("color", colors[robot.color]);
         }
      }
   }
   accumulatorPoints = [0,0,0,0,0,0,0]; 
}

function clearLine(rowIndex)
{
   getGameBoard().clearRect(0, rowIndex * tetriminoSize, tetriminoSize * 10, tetriminoSize);   
   adjustBoard(rowIndex);
}

function scoreLine(rowIndex, linesCleared)
{
   var counts = calculateTetriminoColors(rowIndex);
   calculateAttackPoints(counts);
   calculateAccumulatorPoints(counts, linesCleared);
}

function calculateTetriminoColors(rowIndex)
{
   var tetriminoCounts = [0, 0, 0, 0, 0, 0, 0];
   for(var x = 0; x < 10; x++)
   {
      tetriminoCounts[board[rowIndex][x]] += 1;
   }
   return tetriminoCounts;
}

function calculateAttackPoints(counts)
{
   for(var i = 0; i < counts.length; i++)
   {
      attackPoints[i] = attackPoints[i] + counts[i];
   }
}

function calculateAccumulatorPoints(counts, linesCleared)
{
   console.log("Caclulation accumulator points.");
   console.log(counts);
   console.log("Lines cleared: " + linesCleared);
   if (linesCleared >= 2)
   {
      for(var i = 0; i < counts.length; i++)
      {
         accumulatorPoints[i] = accumulatorPoints[i] + counts[i] * linesCleared;
         console.log("Color: " + i + "Prev accum: " + accumulatorPoints[i]);
      }
   }
}

function attack()
{
   //dispense damage
   console.log("Attack Points");
   console.log(attackPoints);
   

   $("#attackPoints").text(attackPoints[0] + " " + 
      attackPoints[1] + " " + 
      attackPoints[2] + " " +
      attackPoints[3] + " " +
      attackPoints[4] + " " +
      attackPoints[5] + " " +
      attackPoints[6]);

   var tempGrid = oppBattleGrid;

   var attacks = [];
   for(var i = 0; i < myBattleGrid.length; i++)
   {
      for(var j = 0; j < myBattleGrid[i].length; j++)
      {
         var attackingRobot = myBattleGrid[i][j];         
         if(attackingRobot)
         {
            var attack = attackPoints[attackingRobot.color] * robotTypes[attackingRobot.type].attackMultiplier;

            while (attack > 0)
            {
               var position = findOpponent(i, tempGrid);
               if (!position)
               {
                  console.log("No robots to attack");
                  break;
               }
               var robot = tempGrid[position.row][position.column];           
               var damage = robot.life >= attack ? attack : robot.life;            

               attacks.push({
                  id: robot.id,
                  damage: damage
               });

               if (robot.life === damage)
                  tempGrid[position.row][position.column] = undefined;
               else
               {
                  robot.life = robot.life - damage;
                  tempGrid[position.row][position.column] = robot;
               }   

               attack = attack - damage;
            }
            if (robotTypes[attackingRobot.type].healMultiplier > 0)
            {
               attackingRobot.life += attackPoints[attackingRobot.color];
            }
         }
      }
   }
   console.log("Sending attack info:");
   console.log(attacks);
   drawRobotsOnGrid(getMyBattleGrid(), myBattleGrid);
   socket.emit('positions', myBattleGrid);
   socket.emit("attack", {
      attacks: attacks
   });

   attackPoints = [0, 0, 0, 0, 0, 0, 0];
}

function findOpponent(row, oppGrid)
{   
   searchOrder = getSearchOrder(row);
   for(var i = 0; i < searchOrder.length; i ++)
   {
      var opp = findOpponentInRow(searchOrder[i], oppGrid);
      if (opp)
         return opp;
   }
   return false;
}

function getSearchOrder(startingRow)
{
   var order = [];
   if (startingRow == 0)
   {
      order.push(0, 1, 2);
   }
   else if (startingRow == 1)
   {
      order.push(1, 2, 0);
   }
   else if (startingRow == 2)
   {
      order.push(2, 1, 0);
   }

   return order;
}

function findOpponentInRow(row, oppGrid) {
   for(var i = 0; i < oppGrid[row].length; i++)
   {
      if (oppGrid[row][i])
      {
         //return oppGrid[row][i].id;
         return {
            row: row,
            column: i
         };
      }
   }
   return undefined;
}

function getNextPiece()
{
   var nextPiece = pieces.shift();
   pieces.push(getRandomPiece());
   drawPiecePreview();
   return nextPiece;
}

function getRandomPiece() {
   var pieceIndex = Math.floor(Math.random() * 1000) % 7;
   return {shape: rotations[pieceIndex][0], rotationIndex: 0, color: pieceIndex};      
}

function getGameBoard() {
   var c = document.getElementById("gameBoard");
   var ctx = c.getContext("2d");
   return ctx;
}

function getMyBattleGrid() {
   var c = document.getElementById("myBattleGrid");
   var ctx = c.getContext("2d");
   return ctx;
}

function getOpponentsBattleGrid() {
   var c = document.getElementById("oppBattleGrid");
   var ctx = c.getContext("2d");
   return ctx;
}

function clearCanvas() {
   getGameBoard().clearRect(0, 0, 10 * tetriminoSize, boardHeight * tetriminoSize);
}

function adjustBoard(rowCleared) {
   for (var i = rowCleared; i > 0; i--)
   {
      board[i] = board[i-1];
   }
   board[0] = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
   redrawBoard();
}

function redrawBoard() {
   clearCanvas();
   for(var y = 0; y < boardHeight; y++)
   {
      for(var x = 0; x < 10; x++)
      {
         if (board[y][x] >= 0)
         {
            drawBlock(getGameBoard(), x, y, board[y][x]);
         }
      }
   }
}

function drawBattleGrids()
{
   drawBattleGrid(getMyBattleGrid());
   drawBattleGrid(getOpponentsBattleGrid());
}

function drawBattleGrid(gridCanvas) {
   gridCanvas.clearRect(0, 0, 150, 150);
   gridCanvas.beginPath();
   gridCanvas.moveTo(50,0);
   gridCanvas.lineTo(50,150);
   gridCanvas.stroke();

   gridCanvas.beginPath();
   gridCanvas.moveTo(100,0);
   gridCanvas.lineTo(100,150);
   gridCanvas.stroke();

   gridCanvas.beginPath();
   gridCanvas.moveTo(0,50);
   gridCanvas.lineTo(150,50);
   gridCanvas.stroke();

   gridCanvas.beginPath();
   gridCanvas.moveTo(0,100);
   gridCanvas.lineTo(150,100);
   gridCanvas.stroke();
}

function drawPiecePreview() {
   var preview = getPreviewCanvas();
   preview.clearRect(0, 0, 5 * tetriminoSize/2, 16 * tetriminoSize/2);
   var pieceCount = 0;
   while(pieceCount < pieces.length)
   {
      drawPiece(preview, pieces[pieceCount], 1, pieceCount * 5 + 1, .5);
      pieceCount++;
   }
}

function populatePieces(count)
{
   for(var i = 0; i < count; i++)
   {
      var randomPiece = getRandomPiece();
      pieces.push(randomPiece);
   }
}

function boardSetup() {
   board = [[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]]
   console.log("Board Setup Complete")
}

function logBoard() {
   var s;
   for(var i = 0; i < board.length; i ++)
   {
      for (var j = 0; j < board[i].length; j ++)
      {
         s = s + " " + board[i][j];
      }
      s = s + "\r\n";
   }
   return s;
}

function getPreviewCanvas()
{
   var c = document.getElementById("piecePreview");
   var ctx = c.getContext("2d");
   return ctx;
}

function getHoldCanvas()
{
   var c = document.getElementById("holdPiece");
   var ctx = c.getContext("2d");
   return ctx;
}
