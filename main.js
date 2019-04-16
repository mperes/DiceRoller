"use strict";

var customRolls;
var m = "t";
var sessionID, rollingID, roomID, ws, sheet;
var forceResults = [];

function showFile() {
   var preview = document.getElementById('show-text');
   var file = document.querySelector('input[type=file]').files[0];
   var reader = new FileReader()

   var textFile = /text.*/;

   if (file.type.match(textFile)) {
      reader.onload = function (event) {
         sheet = new Sheet('#custom_rolls', event.target.result);
         $('body').addClass('sheetLoaded');
         $('#custom_rolls_save input').click((e) => sheet.save());
      }
   } else {
      preview.innerHTML = "<span class='error'>It doesn't seem to be a text file!</span>";
   }
   reader.readAsText(file);
}

function showCustomRolls() {
  var customRollsContainer = $('#custom_rolls');
  customRollsContainer.html('');
  for(var i=0; i<customRolls.groups.length; i++) {
      var customRollsList = $('<ul />');
      var group = customRolls.groups[i];
      customRollsList.append('<li class="title">'+group.group+'</li>');
      for (var roll in group.rolls) {
        if (group.rolls.hasOwnProperty(roll)) {
          var rollLabel = roll;
          var rollValue = group.rolls[roll];
          var customRollsListItem = $('<li onclick="rollCustom(\''+rollValue+'\',\''+rollLabel+'\',);"><div class="roll_label">'+rollLabel+'</div><div class="roll_value">'+rollValue+'</div></li>');
          customRollsList.append(customRollsListItem);
        }
      }
      customRollsContainer.append(customRollsList);
  }
  //var multiplayer = $('<div id="multiplayer"><h4>Multiplayer</h4><input type="button" value="Create" onClick="startMultiPlayer();" /><input type="button" value="Join" onClick="joinMultiPlayer();" /></div>');
  //customRollsContainer.prepend(multiplayer);
  //$('#custom_rolls').prepend(customRollsContainer);
  //$('body').addClass('show_custom_rolls');
  //var customRollsWidth = ($('body').hasClass('show_custom_rolls')) ? 300 : 0;
  //canvas.style.width = window.innerWidth - 1 - customRollsWidth + 'px';
  //canvas.style.height = window.innerHeight - 1 + 'px';
  m.reinit(canvas, { w: 500, h: 300 });
}

function rollCustom(roll, label) {
  $('#set').val(roll);
  $('#label').show();
  $('#label').text('Rolling '+label+'...');
  Trigger.mousedown($("#throw"));
  Trigger.mouseup($("#throw"));
  forceResults = [];
}

function rollForced(roll, label) {
  $('#set').val(roll);
  $('#label').show();
  $('#label').text('Rolling '+label+'...');
  Trigger.mousedown($("#throw"));
  Trigger.mouseup($("#throw"));
}

$('#label').hide();

function startMultiPlayer() {
  var multiplayerID = uuid();
  connect(multiplayerID);
  $('#multiplayerID').val(multiplayerID);
}

function joinMultiPlayer() {
  var multiplayerID = prompt("Please enter your Session ID", "");
  if(multiplayerID === '') return;
  connect(multiplayerID);
}

function connect(multiplayerID) {
  ws = new WebSocket('ws://achex.ca:4010');
  // add event handler for incomming message
  ws.onmessage = function(evt){
  	var message = JSON.parse(evt.data);
    if(message.hasOwnProperty('SID')) {
      sessionID = message['SID']
    }
    else if(message.hasOwnProperty('type') && message['type'] === 'roll') {
      if(parseInt(message['sID']) === parseInt(sessionID)) return;
      forceResults = message['results'];
      rollForced(message['set'], "alguma coisa");
    }
  };

  // add event handler for diconnection
  ws.onclose= function(evt){
  	console.log('log: Diconnected');
    jQuery('body').removeClass('signed-in');
  };

  // add event handler for error
  ws.onerror= function(evt){
  	console.log('log: Error');
  };

  // add event handler for new connection
  ws.onopen= function(evt){
  	console.log('log: Connected');
    var id = 'DiceRoller_' + multiplayerID;
    send('{"setID":"'+id+'", "passwd":"none"}');
    roomID = id;
    $('#multiplayer .sign-off p').text(multiplayerID);
    jQuery('body').addClass('signed-in');
  };
}

// make a simple send function
function send(value){
  if(ws) ws.send(value);
}

function sendRoll(rollSet, result) {
  var userID = roomID;
  var roll = {
    to: userID,
    player: 'Miguel',
    type: 'roll',
    set: rollSet,
    results: result
  };
  send(JSON.stringify(roll));
}

function copyID() {
  var id = jQuery('#multiplayerID').text();
  var textArea = jQuery('<input id="textToCopy" value="'+id+'" style="positon: fixed; top: -9999; left:-9999;"/>');
  jQuery('body').append(textArea);
  jQuery('#textToCopy')[0].select();
  document.execCommand('copy');
  jQuery('#textToCopy').remove();
}

function uuid() {
  return Math.floor(Math.random()*1E16);
}

function rollResults(set) {
  var results = [];
  for(var i=0; i<set.length; i++) {
    var dice = parseInt(set[i].substring(1));
    results.push(getRandomInt(dice));
  }
  return results;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max)) + 1;
}

function createNewSheet() {
  sheet = new Sheet('#custom_rolls');
  $('body').addClass('sheetLoaded');
  $('#custom_rolls_save input').click((e) => sheet.save());
}

var gameSession;
preLoadAndStart();

function preLoadAndStart() {
  $(document).ready(function() {
    var tmpImg = new Image() ;
    tmpImg.src = 'img/fate_deck.jpg';
    tmpImg.onload = function() {
      $('body').addClass('ready');
      gameSession = new GameSession(false, 6);
    };
  });
}
