"use strict";

var gameSession;
preLoadAndStart();

function preLoadAndStart() {
  $(document).ready(function() {

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
        gameSession.joinMultiPlayer(isDM());
      });
      $('#multiplayer-create').click((e)=> {
        gameSession.createMultiPlayer(isDM());
      });
      $('#multiplayer-isdm input').click((e)=> {
        $('#table-top').toggleClass('isDM');
        $('#multiplayer-hand').toggleClass('disabled');
        $('#multiplayer-create').toggleClass('disabled');
      });
    };
  });
}

function isDM() {
  return $('#multiplayer-isdm input').is(':checked');
}
