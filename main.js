"use strict";

var gameSession;
var characterSheet;
preLoadAndStart();

function preLoadAndStart() {
  $(document).ready(function() {
    characterSheet = new Sheet('#character-sheet');
    var tmpImg = new Image() ;
    tmpImg.src = 'img/fate_deck.jpg';
    tmpImg.onload = function() {
      $('body').removeClass('loading');
      $('#container').show();
      gameSession = new GameSession(false, 6);
      $('#multiplayer-player').change((e)=> {
        gameSession.setName($(e.target).val());
      });
      $('#multiplayer-hand').change((e)=> {
        gameSession.setHand($(e.target).val());
      });
      $('#multiplayer-join').click((e)=> {
        let handSize = getHandSize();
        if(handSize <= 0) {
          $('#multiplayer').addClass('error');
          return;
        }
        $('#multiplayer').removeClass('error');
        gameSession.joinMultiPlayer(isDM());
      });
      $('#multiplayer-create').click((e)=> {
        $('#multiplayer').removeClass('error');
        gameSession.createMultiPlayer(isDM());
      });
      $('#multiplayer-isdm input').click((e)=> {
        $('#table-top').toggleClass('isDM');
        $('#multiplayer-hand').toggleClass('disabled');
        $('#multiplayer-create').toggleClass('disabled');
      });

      for(let i=0; i<24; i++) {
        let src = 'img/avatars/avatar_'+i+'.jpg';
        let img = $('<img alt="avatar" src="" />').attr('src', src).click((e) => {
          $('#multiplayer-avatar-chosen').attr('src', src);
          gameSession._avatar = i;
          $('#multiplayer-avatar-list').toggle();
        });
        $('#multiplayer-avatar-list').append(img);
      }
      $('#multiplayer-avatar-chosen').click((e)=> {
        $('#multiplayer-avatar-list').toggle();
      });
    };
  });
}

function isDM() {
  return $('#multiplayer-isdm input').is(':checked');
}
function getHandSize() {
  let handSize = $('#multiplayer-hand').val();
  if(handSize.trim() === '') return 0;
  return parseInt(handSize);
}
