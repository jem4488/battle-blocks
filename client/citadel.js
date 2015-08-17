var groupedFrameResources;
var groupedCrystalResources;
var groupedAccumulatorResources;

var selectedFrame;
var selectedCrystal;
var selectedAccumulator;

$(document).ready(function() {
   var name = sessionStorage.getItem('name');
   $("#name").text(name);

   console.log("requesting coin status");
   $.getJSON('/citadel/coinStatus?name=' + name)
   .done(function(data) {
      console.log("coin stats received.")
      console.log(data);           

      $('#moneyAmount').text(data.availableForCollection);
      $('#bankCoins').text(data.coins);
      if (data.availableForCollection > 0)
         $('#collectMoney').removeAttr('disabled');
   }); 

   console.log("requesting army");
   $.getJSON('/citadel/army?name=' + name)
   .done(function(data) {
      console.log("Army Resources received.")
      console.log(data);
      
      var resources = [];
      for(var i = 0; i < data.length; i++)
      {
         var robot = data[i];
         resources.push("<li>" 
               + "<div style='background-image: url(../" + robot.RobotImage 
               + ".png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%'></div>"
               + "<div style='background-image: url(../" + robot.AccumulatorImage 
               + ".png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%'></div>"
               + "<div style='background-image: url(../" + globalColorNameMapping[robot.Color] 
               + "Crystal.png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%'></div></li>");         
      }

      $('#army').append(resources.join(''));
   }); 

   console.log("requesting frames");
   $.getJSON('/citadel/frameResources?name=' + name)
   .done(function(data) {
      console.log("Frame Resources received.")
      console.log(data);
      groupedFrameResources = populateResourceList(data, 4, findFrameResources);
      console.log(groupedFrameResources);
      var resources = [];
      for(var i = 0; i < groupedFrameResources.length; i++)
      {
         resources.push("<li onClick='selectFrame(this)' data-groupResourceId='" + i + "' style='background-image: url(../" + groupedFrameResources[i][0].BaseImageName 
               + ".png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%'>" + groupedFrameResources[i].length + "</li>");         
      }

      $('#frames').append(resources.join(''));
   }); 

   console.log("requesting crystals");
   $.getJSON('/citadel/crystalResources?name=' + name)
   .done(function(data) {
      console.log("Crystal Resources received.")
      console.log(data);
      groupedCrystalResources = populateCrystalResourceList(data);
      console.log(groupedCrystalResources);
      var resources = [];
      for(var i = 0; i < groupedCrystalResources.length; i++)
      {
         resources.push("<li onClick='selectCrystal(this)' data-groupResourceId='" + i + "' style='background-image: url(../" + globalColorNameMapping[groupedCrystalResources[i][0].Color] 
               + "Crystal.png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%'>" + groupedCrystalResources[i].length + "</li>");         
      }

      $('#crystals').append(resources.join(''));
   }); 

   console.log("requesting accumulators");
   $.getJSON('/citadel/accumulatorResources?name=' + name)
   .done(function(data) {
      console.log("Accumulator Resources received.")
      console.log(data);
      groupedAccumulatorResources = populateResourceList(data, 5, findAccumulatorResources);
      console.log(groupedAccumulatorResources);
      var resources = [];
      for(var i = 0; i < groupedAccumulatorResources.length; i++)
      {
         resources.push("<li onClick='selectAccumulator(this)' data-groupResourceId='" + i + "' style='background-image: url(../" + groupedAccumulatorResources[i][0].BaseImageName 
               + ".png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%'>" + groupedAccumulatorResources[i].length + "</li>");         
      }

      $('#accumulators').append(resources.join(''));
   }); 

});

function collectMoney()
{
   var name = sessionStorage.getItem('name');
   $.getJSON('/citadel/collect?name=' + name)
   .done(function(data) {
      console.log("Mondy Resources received.")
      console.log(data);
      
      $('#moneyAmount').text(data.availableForCollection);
      $('#bankCoins').text(data.coins);
      if (data.availableForCollection == 0)
         $('#collectMoney').attr('disabled', 'true');
   }); 
};

function selectFrame(element)
{
   console.log("selectFrame");
   if (selectedFrame)
      $(selectedFrame).removeAttr('class', 'selectedResource');
   
   selectedFrame = element;

   $(element).attr('class', 'selectedResource');

   if(selectedFrame && selectedCrystal && selectedAccumulator)
      $('#constructRobot').removeAttr('disabled');
};

function selectCrystal(element)
{
   if (selectedCrystal)
      $(selectedCrystal).removeAttr('class', 'selectedResource');
   
   selectedCrystal = element;
   $(element).attr('class', 'selectedResource');

   if(selectedFrame && selectedCrystal && selectedAccumulator)
      $('#constructRobot').removeAttr('disabled');
};

function selectAccumulator(element)
{
   if (selectedAccumulator)
      $(selectedAccumulator).removeAttr('class', 'selectedResource');
   
   selectedAccumulator = element;
   $(element).attr('class', 'selectedResource');

   if(selectedFrame && selectedCrystal && selectedAccumulator)
      $('#constructRobot').removeAttr('disabled');
};

function constructRobot()
{
   if(selectedAccumulator && selectedCrystal && selectedFrame)
   {
      //Build Robot
      var frameId = groupedFrameResources[$(selectedFrame).attr('data-groupResourceId')][0].FrameID;
      var crystalId = groupedCrystalResources[$(selectedCrystal).attr('data-groupResourceId')][0].MinedResourceID;
      var accumId = groupedAccumulatorResources[$(selectedAccumulator).attr('data-groupResourceId')][0].AccumulatorID;
      console.log("Building Robot - FrameID: " + frameId + " CrystalID: " + crystalId + " AccumulatorID: " + accumId);

      $.ajax({
         type: "POST",
         url: '/citadel/buildRobot?name=' + sessionStorage.getItem('name'),
         contentType: 'application/json',
         data: JSON.stringify({frameId: frameId, crystalId: crystalId, accumId: accumId}),
         success: function(data) {
            console.log(data);
            window.location.reload();
         },
         dataType: 'json'
      });  
   }
};

function findAccumulatorResources(resources, typeId)
{
   return _.where(resources, {AccumulatorTypeID: typeId});
};

function findFrameResources(resources, typeId)
{
   return _.where(resources, {RobotTypeID: typeId});
};

function populateResourceList(resources, maxTypeId, findFunction)
{  
   var list = [];
   for(var typeId = 1; typeId <= maxTypeId; typeId++)
   {
      var items = findFunction(resources, typeId);    
      if (items.length > 0)
         list.push(items);
   }
   return list;
};

function populateCrystalResourceList(resources)
{
   var list = [];
   for(var i = 0; i < 7; i++)
   {
      var items = _.where(resources, {Color: i});
      if (items.length > 0)
         list.push(items);
   }
   return list;
}
