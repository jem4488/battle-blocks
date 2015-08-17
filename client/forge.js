var shardResources;
var usedShards = [];
var gemResources;
var selectedGemColor;
var crystalResources;
var recipeMapping = [0, 4, 2];

var selections = [];
var shardImages = ['redShard.png', 'greenShard.png', 'yellowShard.png', 'tealShard.png', 'blueShard.png', 'orangeShard.png', 'purpleShard.png'];

function findResources(resources, colorId, typeId)
{
   return _.where(resources, {Color: colorId, MinedResourceTypeID: typeId});
}

function populateResourceList(resources, typeId)
{  
   var list = [];
   for(var colorId = 0; colorId < 7; colorId++)
   {
      list.push(findResources(resources, colorId, typeId));
   }
   return list;
}

function getListItems(list, type)
{
   console.log(list);
   var resources = [];
   for(var i = 0; i < 7; i++)
   {
      if (list[i].length > 0) 
      {
         if (type == 'shard') {
            resources.push("<li class='color-" + i + "' onClick='selectShardToForge(this)' style='background-image: url(../" + globalColorNameMapping[i] 
               + "Shard.png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%'>" + list[i].length + '</li>');
         }
         else if (type == 'gem') {
            resources.push("<li data-color='" + i + "' onClick='selectGem(this)' style='background-image: url(../" + globalColorNameMapping[i] 
               + "Gem.png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%'>" 
               + list[i].length + '</li>');
         }
         else {   
            resources.push("<li style='background-image: url(../" + globalColorNameMapping[i] 
               + "Crystal.png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%'>" 
               + list[i].length + '</li>');          
         }
      }
         
   }   
   return resources;
}

function selectShardToForge(element)
{
   if(usedShards.length > 2)
      return;

   var colorAttr = $(element).attr("class");
   console.log(colorAttr);
   var color = colorAttr.substring(6);
   console.log(color);

   var shard = shardResources[color].pop();

   console.log("Selected Shard: ");
   console.log(shard);

   usedShards.push(shard);   
   console.log(shardResources);
   console.log(usedShards);

   $(element).text(shardResources[color].length);

   var shardId;
   for(var shardId = 1; shardId <= 3; shardId++)
   {
      if($('#shard' + shardId).attr('style'))
      {
      }
      else
      {
         break;
      }
   }
   
   $('#shard' + shardId)
      .attr('style', "background-image: url(../" + globalColorNameMapping[shard.Color] + "Shard.png); "
         + "background-repeat: no-repeat; background-position: center; background-size: 100% 100%; cursor: pointer;")
      .attr('onClick', 'deselectShardToForge(this)')
      .attr('data-colorIndex', shard.Color);

   if (usedShards.length == 3)
      $('#forgeGem').removeAttr('disabled');
}

function deselectShardToForge(element)
{
   if(usedShards.length == 0)
      return;

   var colorIndex = $(element).attr('data-colorIndex');
   console.log("Color Index: " + colorIndex);   

   var shard = _.find(usedShards, function (item) { return item.Color == colorIndex; });
   var index = usedShards.indexOf(shard);
   usedShards.splice(index, 1);
   shardResources[shard.Color].push(shard);
   console.log(usedShards);
   console.log(shardResources);

   $("#shardResources .color-" + shard.Color).text(shardResources[shard.Color].length);
   $(element).removeAttr('style').removeAttr('onClick').removeAttr('data-colorIndex');
   $('#forgeGem').attr('disabled', 'true');
}

function forgeGem()
{
   if (usedShards.length != 3)
      return;

   //$.post('/forge/forgeGem?name=' + sessionStorage.getItem('name'), JSON.stringify({ name: "Jody", ln: "Mason" }), function(response) {
   //   console.log(response);}, 'json');

   $.ajax({
     type: "POST",
     url: '/forge/forgeGem?name=' + sessionStorage.getItem('name'),
     contentType: 'application/json',
     data: JSON.stringify(usedShards),
     success: function(data) {
         console.log(data);
         window.location.reload();
      },
     dataType: 'json'
   });   
}

function selectGem(element) {
   if (selectedGemColor)
      $("#gemResources [data-color = " + selectedGemColor + "]").removeAttr('class');

   selectedGemColor = $(element).attr('data-color');
   $(element).attr('class', 'selected');
   $('#forgeCrystal').removeAttr('disabled');
}


function forgeCrystal()
{
   console.log("Forging Crystal");
   console.log("Selected color: " + selectedGemColor);
   console.log(gemResources[selectedGemColor]);

   if (selectedGemColor == undefined || gemResources[selectedGemColor].length < 3)
      return;

   var gems = gemResources[selectedGemColor].splice(0, 3);
   console.log(gems);

   $.ajax({
     type: "POST",
     url: '/forge/forgeCrystal?name=' + sessionStorage.getItem('name'),
     contentType: 'application/json',
     data: JSON.stringify(gems),
     success: function(data) {
         console.log(data);
         window.location.reload();
      },
     dataType: 'json'
   });   
}

/*
function addSelectedClass(element)
{
   console.log(element);

   var selected = _.find(selections, function(selection){ return selection === element; });
   if(selected)
   {
      $(element).removeAttr('class', 'selected');
      var index = selections.indexOf(selected);
      selections.splice(index, 1);
      console.log("Removed Selection");
      console.log(selections);
   }   
   else {
      $(element).attr('class', 'selected');
      selections.push(element);
      console.log("added selection");
      console.log(selections);   
   }   
}
*/

$(document).ready(function() {
   var name = sessionStorage.getItem('name');
   $("#name").text(name);

   console.log("requesting mined Resources");

   $.getJSON('/minedResources?name=' + name)
   .done(function(data) {
      console.log("Mined Resources received.")
      console.log(data);

      shardResources = populateResourceList(data, 1);
      $('#shardResources').append(getListItems(shardResources, 'shard').join(''));

      gemResources = populateResourceList(data, 2);
      $('#gemResources').append(getListItems(gemResources, 'gem').join(''));
      
      crystalResources = populateResourceList(data, 3);
      $('#crystalResources').append(getListItems(crystalResources, 'crystal').join(''));      
   });

   $.getJSON('/forge/forgeRules')
   .done(function (data) {
      var rules = [];
      $.each(data, function (i, item) {
         console.log(item);
         rules.push(createListItem(item));
      });
      $('#forgeRules').append(rules.join(''));
   });
});

function createListItem(item)
{
   var parts = item.recipe.split(',');

   var li = "<li class='gemRecipe'><div style='background-image: url(../" + globalColorNameMapping[item.gemColor] 
      + "Gem.png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%'></div>"
      + ' = ';

   for (var i = 0; i < parts.length; i++)
   {
      var partsLength = parts[i];
      for(var j = 0; j < partsLength; j++)
      {
         li += "<div style='background-image: url(../" + globalColorNameMapping[recipeMapping[i]] 
         + "Shard.png); background-repeat: no-repeat; background-position: center; background-size: 100% 100%'></div>";
      }
   }

   li += '</li>';   
   return li;
}