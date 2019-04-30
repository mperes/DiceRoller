//*---------------------------------------------------------------------
//* Player List
//* By Miguel Peres (m.peres@gmail.com)
//*---------------------------------------------------------------------
class PlayerList {
  constructor(container, gameSession) {
    this._view = $('<div id="player-list" />');
    this._list = [];
    $(container).prepend(this._view);
    this._gameSession = gameSession;
    this._checkOnlinePlayers = setInterval(this.checkOnlinePlayers.bind(this), 10000);
  }
  addPlayer(avatar, displayName, sessionID, handSize, isDM, isSelf) {
    let context = this;
    this._list.push({avatar: avatar, displayName: displayName, sessionID: sessionID, handSize: handSize, isDM: isDM, isSelf: isSelf, ping: false, pong: false});
    let thumbnail = $('<div class="thumbnail" />').text(displayName)
    let health = $('<div class="health"><div class="left"></div></div>');
    thumbnail.append(health)
    let avatarUrl = 'url(img/avatars/avatar_'+avatar+'.jpg)';
    console.log(avatarUrl);
    thumbnail.css('background', avatarUrl);
    thumbnail.click(function() {
      if(!context._gameSession._isDM) return;
      context.toggleTurn(sessionID);
      context._gameSession.sendMultiplayerAction(ACTION_GIVE_TURN, sessionID.toString());
    })
    let actions = $('<div class="actions" />');
    let giveInitialHand = this._getActionButton('give-hand', 'Give initial hand', function() {
      let deckOrder = context._gameSession._deck.getOrder();
      context._gameSession.sendSingleplayerAction(parseInt(sessionID), ACTION_GIVE_INITIAL_HAND, deckOrder);
    });
    let damage = this._getActionButton('give-damage', 'Damage', function() {
      context._gameSession.sendSingleplayerAction(parseInt(sessionID), ACTION_GIVE_DAMAGE);
    });
    let heal = this._getActionButton('give-heal', 'Heal', function() {
      let numberOfCards = prompt("How many cards do you want to heal?", "");
      if(numberOfCards === null) return;
      if(numberOfCards.trim() === '') return;
      let reg = /^\d+$/;
      if(!reg.test(numberOfCards)) return;
      if(parseInt(numberOfCards) <= 0) return;
      context._gameSession.sendSingleplayerAction(parseInt(sessionID), ACTION_HEAL, numberOfCards);
    });
    actions.append(heal);
    actions.append(damage);
    actions.append(giveInitialHand);
    let newPlayer = $('<div class="player" id="player-'+sessionID+'" />').append(thumbnail).append(actions);
    if(isSelf) newPlayer.addClass('self');
    if(isDM) {
      this._dmSessionID = sessionID;
      newPlayer.addClass('isDM');
      this._view.prepend(newPlayer);
    } else {
      this._view.append(newPlayer);
    }
  }
  _getActionButton(cssClass, label, action) {
    return $('<div class="'+cssClass+'" title="'+label+'" />').click(action);
  }
  index(sessionID) {
    let index = this._list.findIndex(player => parseInt(player.sessionID) === parseInt(sessionID));
    return index;
  }
  toggleTurn(sessionID) {
    let player = $('#player-'+sessionID);
    if(player.length === 0) return;
    player.toggleClass('hasTurn');
    if(parseInt(sessionID) === parseInt(this._gameSession._sessionID) && this._gameSession._player !== null)
      this._gameSession._player.toggleTurn();
  }
  updateHealth(sessionID, health) {
    let player = $('#player-'+sessionID);
    if(player.length === 0) return;
    player.find('.health .left').css('width', health+'%');
  }
  checkOnlinePlayers() {
    if($('body').hasClass('signed-in') && this._list.length > 1 && this._gameSession._isDM) {
      //Check for disconnection
      for(let i=0; i<this._list.length; i++) {
        let player = this._list[i];
        if(player.ping && !player.pong && !player.isDM) {
          this._gameSession.sendMultiplayerAction(ACTION_DISCONNECT, player.sessionID.toString());
          this.disconnectPlayer(player.sessionID);
        }
      }
      //Send ping
      for(let i=0; i<this._list.length; i++) {
        let player = this._list[i];
        player.ping = true;
        player.pong = (player.isDM) ? true : false;
        this._gameSession.sendMultiplayerAction(ACTION_PING);
      }
    }
  }
  pong(sessionID) {
    let index = this.index(sessionID);
    if(index > -1) this._list[index].pong = true;
  }
  disconnectPlayer(sessionID) {
    let index = this.index(sessionID);
    if(index > -1) {
      this._list.splice(index, 1);
      $('#player-list').find('#player-'+sessionID).remove();
    }
  }
  reset() {
    this._list = [];
    this._view.html('');
  }
}
