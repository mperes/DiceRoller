"use strict";

var customRolls;
var m = "t";

function dice_initialize(container) {
    $t.remove($t.id('loading_text'));

    var canvas = $t.id('canvas');
    var customRollsWidth = ($('body').hasClass('show_custom_rolls')) ? 300 : 0;
    canvas.style.width = window.innerWidth - 1 - customRollsWidth + 'px';
    canvas.style.height = window.innerHeight - 1 + 'px';
    var label = $t.id('label');
    var set = $t.id('set');
    var selector_div = $t.id('selector_div');
    var info_div = $t.id('info_div');
    on_set_change();

    $t.dice.use_true_random = false;

    function on_set_change(ev) { set.style.width = set.value.length + 3 + 'ex'; }
    $t.bind(set, 'keyup', on_set_change);
    $t.bind(set, 'mousedown', function(ev) { ev.stopPropagation(); });
    $t.bind(set, 'mouseup', function(ev) { ev.stopPropagation(); });
    $t.bind(set, 'focus', function(ev) { $t.set(container, { class: '' }); });
    $t.bind(set, 'blur', function(ev) { $t.set(container, { class: 'noselect' }); });

    $t.bind($t.id('clear'), ['mouseup', 'touchend'], function(ev) {
        ev.stopPropagation();
        set.value = '0';
        on_set_change();
    });

    var params = $t.get_url_params();

    if (params.chromakey) {
        $t.dice.desk_color = 0x00ff00;
        info_div.style.display = 'none';
        $t.id('control_panel').style.display = 'none';
    }
    if (params.shadows == 0) {
        $t.dice.use_shadows = false;
    }
    if (params.color == 'white') {
        $t.dice.dice_color = '#808080';
        $t.dice.label_color = '#202020';
    }

    var box = new $t.dice.dice_box(canvas, { w: 500, h: 300 });
    box.animate_selector = false;
    m = box;

    $t.bind(window, 'resize', function() {
        var customRollsWidth = ($('body').hasClass('show_custom_rolls')) ? 300 : 0;
        canvas.style.width = window.innerWidth - 1 - customRollsWidth + 'px';
        canvas.style.height = window.innerHeight - 1 + 'px';
        box.reinit(canvas, { w: 500, h: 300 });
    });

    function show_selector() {
        info_div.style.display = 'none';
        selector_div.style.display = 'inline-block';
        box.draw_selector();
    }

    function before_roll(vectors, notation, callback) {
        info_div.style.display = 'none';
        selector_div.style.display = 'none';

        if(forceResults.length > 0) {
          callback(forceResults)
          forceResults = [];
        } else {
          var rollSet = notation.set.join('+') + "+" + notation.constant;
          var results = rollResults(notation.set);
          callback(results);
          sendRoll(rollSet, results);
        }
    }

    function notation_getter() {
        return $t.dice.parse_notation(set.value);
    }

    function after_roll(notation, result) {
        if (params.chromakey || params.noresult) return;
        var res = result.join(' ');
        if (notation.constant) {
            if (notation.constant > 0) res += ' +' + notation.constant;
            else res += ' -' + Math.abs(notation.constant);
        }
        if (result.length > 1) res += ' = ' +
                (result.reduce(function(s, a) { return s + a; }) + notation.constant);
        label.innerHTML = res;
        info_div.style.display = 'inline-block';
    }

    //box.bind_mouse(container, notation_getter, before_roll, after_roll);
    box.bind_throw($t.id('throw'), notation_getter, before_roll, after_roll);

    /*
    $t.bind(container, ['mouseup', 'touchend'], function(ev) {
        ev.stopPropagation();
        if (selector_div.style.display == 'none') {
            if (!box.rolling) show_selector();
            box.rolling = false;
            return;
        }
        var name = box.search_dice_by_mouse(ev);
        if (name != undefined) {
            var notation = $t.dice.parse_notation(set.value);
            notation.set.push(name);
            set.value = $t.dice.stringify_notation(notation);
            on_set_change();
        }
    });
    */

    if (params.notation) {
        set.value = params.notation;
    }
    if (params.roll) {
        $t.raise_event($t.id('throw'), 'mouseup');
    }
    else {
        show_selector();
    }
}

function showFile() {
   var preview = document.getElementById('show-text');
   var file = document.querySelector('input[type=file]').files[0];
   var reader = new FileReader()

   var textFile = /text.*/;

   if (file.type.match(textFile)) {
      reader.onload = function (event) {
         customRolls = JSON.parse(event.target.result);
         showCustomRolls();
         $('#custom_rolls_loader').hide();
      }
   } else {
      preview.innerHTML = "<span class='error'>It doesn't seem to be a text file!</span>";
   }
   reader.readAsText(file);
}

var sessionID, rollingID, roomID, ws;
var forceResults = [];

function showCustomRolls() {
  var customRollsContainer = $('<div id="custom_rolls" />');
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
  var multiplayer = $('<div id="multiplayer"><h4>Multiplayer</h4><input type="button" value="Create" onClick="startMultiPlayer();" /><input type="button" value="Join" onClick="joinMultiPlayer();" /></div>');
  customRollsContainer.prepend(multiplayer);
  $('body').prepend(customRollsContainer);
  $('body').addClass('show_custom_rolls');
  var customRollsWidth = ($('body').hasClass('show_custom_rolls')) ? 300 : 0;
  canvas.style.width = window.innerWidth - 1 - customRollsWidth + 'px';
  canvas.style.height = window.innerHeight - 1 + 'px';
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
      console.log(message.results);
      if(parseInt(message['sID']) === parseInt(sessionID)) return;
      forceResults = message['results'];
      rollForced(message['set'], "alguma coisa");
    }
  };

  // add event handler for diconnection
  ws.onclose= function(evt){
  	console.log('log: Diconnected');
    $('#multiplayer').html('<h4>Multiplayer</h4><input type="button" value="Create" onClick="startMultiPlayer();" /><input type="button" value="Join" onClick="joinMultiPlayer();" />');
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
    $('#multiplayer').html('<h4>Multiplayer</h4><p id="multiplayerID">'+multiplayerID+'</p><input type="button" value="Copy to Clipboard" onClick="copyID();" />');
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
