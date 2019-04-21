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
  }
  addPlayer(displayName, sessionID, handSize, isDM, isSelf) {
    let context = this;
    this._list.push({displayName: displayName, sessionID: sessionID, handSize: handSize, isDM: isDM, isSelf: isSelf});
    let thumbnail = $('<div class="thumbnail" />').text(displayName);
    thumbnail.attr('id', 'player-'+sessionID);
    thumbnail.click(function() {
      context.toggleTurn(sessionID);
      context._gameSession.sendMultiplayerAction(ACTION_GIVE_TURN, sessionID.toString());
    })
    let actions = $('<div class="actions" />');
    let setupAction = $('<div class="setup" data-id="" />').click((e) => {
      let view = $(e.target);
      let setupPlayerEvent = new CustomEvent('playerListEvent',{
        detail: { action: ACTION_PLAYER_SETUP, displayName, sessionID: sessionID, handSize: handSize }
      });
      document.dispatchEvent(setupPlayerEvent);
    });
    let giveInitialHand = this._getActionButton('give-hand', 'Give initial hand', function() {
      context._gameSession.sendSingleplayerAction(parseInt(sessionID), ACTION_GIVE_INITIAL_HAND);
    });
    let damage = this._getActionButton('give-damage', 'Damage', function() {
      context._gameSession.sendSingleplayerAction(parseInt(sessionID), ACTION_GIVE_DAMAGE);
    });
    actions.append(damage);
    actions.append(giveInitialHand);
    actions.append(setupAction);
    let newPlayer = $('<div class="player"/>').append(thumbnail).append(actions);
    if(isSelf) newPlayer.addClass('self');
    if(isDM) {
      this._dmSessionID = sessionID;
      newPlayer.addClass('isDM');
      this._list.push(newPlayer);
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
    let player = $('#player-'+sessionID).parent();
    if(player.length === 0) return;
    player.toggleClass('hasTurn');
    if(parseInt(sessionID) === parseInt(this._gameSession._sessionID) && this._gameSession._player !== null)
      this._gameSession._player.toggleTurn();
  }
}
