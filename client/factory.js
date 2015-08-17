var groupedSketchResources;
var groupedFramePieceResources;

$(document).ready(function() {
   var name = sessionStorage.getItem('name');
   $("#name").text(name);

   console.log("requesting sketches");
   $.getJSON('/sketchResources?name=' + name)
   .done(function(data) {
      console.log("Sketch Resources received.")
      console.log(data);
      groupedSketchResources = populateResourceList(data, 5, findAccumulatorResources);

      var resources = [];
      for(var i = 0; i < groupedSketchResources.length; i++)
      {
         if (groupedSketchResources[i].length == 0)
            continue;
         
         var list = groupedSketchResources[i];
         console.log("Sketches");
         console.log(groupedSketchResources[i]);

         resources.push("<h3>" + list[0][0].Name + "</h3>")
         resources.push("<ul class='list'>");
         $.each(list, function(j, item) {
            resources.push("<li><div style='background-image: url(../" + item[0].BaseImageName + item[0].SeqNum + ".png);" 
               + " background-repeat: no-repeat; background-position: center; background-size: 100% 100%'><span>" 
               + item[0].SeqNum + "</span></div>x&nbsp;" 
               + item.length + '</li>');
         });         
         resources.push("</ul>");         
         if(list.length == 6)
            resources.push("<button data-accumType='" + list[0][0].AccumulatorTypeID 
               + "' data-groupedResourceId='" + i + "' onClick='buildAccumulator(this)'>Build Accumulator</button>");
      }

/*
      var resources = [];
      resources.push("<ul class='list'>");
      $.each(data, function(i, item) {
         resources.push('<li>Type:' + item.Name + ' Number:' + item.SeqNum + '</li>');
      });
      resources.push("</ul>");
      */
      $('#accumResources').append(resources.join(''));
   });


   console.log("requesting frames");
   $.getJSON('/frameResources?name=' + name)
   .done(function(data) {
      console.log("Frame Resources received.")
      console.log(data);
      groupedFramePieceResources = populateResourceList(data, 4, findFrameResources);
      
      var resources = [];
      for(var i = 0; i < groupedFramePieceResources.length; i++)
      {
         if (groupedFramePieceResources[i].length == 0)
            continue;

         var list = groupedFramePieceResources[i];
         resources.push("<h3>" + list[0][0].Name + "</h3>")
         resources.push("<ul class='list'>");
         $.each(list, function(j, item) {
            resources.push("<li><div style='background-image: url(../" + item[0].BaseImageName + item[0].SeqNum + ".png);" 
               + " background-repeat: no-repeat; background-position: center; background-size: 100% 100%'><span>" 
               + item[0].SeqNum + "</span></div>x&nbsp;" 
               + item.length + '</li>');
         });
         resources.push("</ul>");
         if(list.length == 6)
            resources.push("<button data-robotType='" + list[0][0].RobotTypeID 
               + "' data-groupedResourceId='" + i + "' onClick='buildFrame(this)'>Build Robot Frame</button>");
      }
      

      $('#frameResources').append(resources.join(''));
   });
});

function findAccumulatorResources(resources, typeId, seq)
{
   return _.sortBy(_.where(resources, {AccumulatorTypeID: typeId, SeqNum: seq}), 'SeqNum');
};

function findFrameResources(resources, typeId, seq)
{
   return _.sortBy(_.where(resources, {RobotTypeID: typeId, SeqNum: seq}), 'SeqNum');
};

function populateResourceList(resources, maxTypeId, findFunction)
{  
   var list = [];
   for(var typeId = 1; typeId <= maxTypeId; typeId++)
   {
      var typeList = [];
      for(var seq = 1; seq <= 6; seq++)
      {
         var matchingResources = findFunction(resources, typeId, seq);
         if(matchingResources.length > 0)
            typeList.push(matchingResources);
      }
      list.push(typeList);
   }
   return list;
};

function buildAccumulator(button)
{
   //var accumTypeId = button.id.substring(6);
   var accumTypeId = $(button).attr('data-accumType');
   var groupedResourceId = $(button).attr('data-groupedResourceId');
   console.log(groupedResourceId)
   
   var list = groupedSketchResources[groupedResourceId];
   if (list.length != 6)
      return;

   var idList = list[0][0].SketchID;
   for (var i = 1; i < list.length; i++)
   {
      idList = idList + ', ' + list[i][0].SketchID;
   }
   console.log(idList);

   $.ajax({
     type: "POST",
     url: '/factory/buildAccumulator?name=' + sessionStorage.getItem('name'),
     contentType: 'application/json',
     data: JSON.stringify({typeId: accumTypeId, idList: idList}),
     success: function(data) {
         console.log(data);
         window.location.reload();
      },
     dataType: 'json'
   });  
};

function buildFrame(button)
{
   console.log("Build Frame");
   var robotTypeId = $(button).attr('data-robotType');
   var groupedResourceId = $(button).attr('data-groupedResourceId');

   var list = groupedFramePieceResources[groupedResourceId];
   if (list.length != 6)
      return;

   var idList = list[0][0].FramePieceID;
   for (var i = 1; i < list.length; i++)
   {
      idList = idList + ', ' + list[i][0].FramePieceID;
   }
   console.log(idList);

   $.ajax({
     type: "POST",
     url: '/factory/buildFrame?name=' + sessionStorage.getItem('name'),
     contentType: 'application/json',
     data: JSON.stringify({typeId: robotTypeId, idList: idList}),
     success: function(data) {
         console.log(data);
         window.location.reload();
      },
     dataType: 'json'
   });  
};
