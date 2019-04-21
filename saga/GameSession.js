//*---------------------------------------------------------------------
//* Game Session Class
//* By Miguel Peres (m.peres@gmail.com)
//*---------------------------------------------------------------------
class GameSession {
  constructor(displayName, handSize) {
    this._isDM = (typeof isDM === 'boolean') ? isDM : false;
    this._ws = null;
    this._sessionID = null;
    this._roomID = null;
    this._displayName = this.setDefaultIfEmpty(displayName, 'Jonh Doe');
    this._container = {
      playerList: $("#player-list")
    }
    this._dmSessionID = null;
    this._handSize = handSize;

    this._deck = null;
    this._player = null;
    this._chatBox = null;

    const context = this;

    document.addEventListener('playerListEvent', function (event) {
      switch (event.detail.action) {
        case ACTION_PLAYER_SETUP:
          let deckOrder = context._deck.getOrder();
          context.sendSingleplayerAction(parseInt(event.detail.sessionID), ACTION_PLAYER_SETUP, deckOrder);
          break;
        default:

      }
    });

    this._playerList = new PlayerList('#table-top', this);
  }
  setName(name) {
    this._displayName = this.setDefaultIfEmpty(name, 'John Doe');
  }
  setHand(size) {
    this._handSize = parseInt(size);
  }
  loading(state, msg) {
    let loadingMessage = (typeof msg === 'undefined') ? 'Please wait...' : msg;
    if(state) {
      var loadingBlocker = $('<div id="tabletop-loading-blocker" />').click(function() {});
      var loadingSpinner = $('<div id="tabletop-loading-spinner"><span>'+loadingMessage+'<span/></div>');
      $('body').append(loadingBlocker).append(loadingSpinner);
    } else {
      $('#tabletop-loading-blocker, #tabletop-loading-spinner').remove();
    }
  }
  setDefaultIfEmpty(value, defaultValue) {
    if(!(typeof value === 'string')) return defaultValue;
    if(value.trim() === '') return defaultValue;
    return value;
  }
  createMultiPlayer(isDM) {
    //this.setupDM();
    //$('#container').removeClass('logged-off');
    this.loading(true);
    this._isDM = (typeof isDM === 'boolean') ? isDM : false;
    if(isDM) this._handSize = 0;
    let multiplayerID = this.uuid();
    this.connect(multiplayerID);
    console.log('Session ID: ' + multiplayerID);
  }
  joinMultiPlayer(isDM) {
    this._isDM = (typeof isDM === 'boolean') ? isDM : false;
    let multiplayerID = prompt("Please enter your Session ID", "");
    if(multiplayerID === null) return;
    if(multiplayerID.trim() === '') return;
    this.loading(true);
    this.connect(multiplayerID);
  }
  connect(multiplayerID) {
    let context = this;
    context._ws = new WebSocket('wss://cloud.achex.ca/tabletop_'+multiplayerID);
    context._ws.onmessage = function(evt){
      let message = JSON.parse(evt.data);
      if(message.hasOwnProperty('SID') && !message.hasOwnProperty('action')) {
        //Player has signed-up
        context._sessionID = message['SID'];
        if(context._isDM) context.setupDM();
        let action = (context._isDM) ? ACTION_DM_JOIN : ACTION_PLAYER_JOIN;
        context.sendMultiplayerAction(action);
        context.loading(false);
        let isSelf = (parseInt(message.SID) === parseInt(context._sessionID)) ? true : false;
        context._playerList.addPlayer(context._displayName, context._sessionID, context._handSize, context._isDM, isSelf);
        $('#container').removeClass('logged-off');
        context._chatBox = new ChatBox(context, '#table-top');
        context._chatBox.setTitle('Session ID: '+multiplayerID);
        if(!context._isDM) context.loading(true, 'Waiting for your lazy DM...');
      }
      else {
        if(parseInt(message.sID) === parseInt(context._sessionID)) return;
        switch (message.action) {
          case ACTION_PLAYER_JOIN:
            context._playerList.addPlayer(message.displayName, message.sID, context._handSize, false, false);
            if(context._isDM) {
              context.sendSingleplayerAction(message.sID, ACTION_ADD_DM);
            } else {
              context.sendSingleplayerAction(message.sID, ACTION_ADD_PLAYER);
            }
            break;
          case ACTION_DM_JOIN:
            context._playerList.addPlayer(message.displayName, message.sID, 0, true, false);
            context.sendSingleplayerAction(message.sID, ACTION_ADD_PLAYER);
            break;
          case ACTION_DRAW_TO_TABLE:
            let amount = parseInt(message.details);
            if(context._deck !== null)
              context._deck.drawToTable(amount, false);
            if(message.fromDM)
              context.sendSingleplayerAction(message.sID, ACTION_OK, 'ACTION_DRAW_TO_TABLE');
            break;
          case ACTION_SEND_TABLE_TO_GRAVEYARD:
            context._deck.sendCardFromTableToGraveyard(false);
            if(message.fromDM)
              context.sendSingleplayerAction(message.sID, ACTION_OK, 'ACTION_SEND_TABLE_TO_GRAVEYARD');
            break;
          case ACTION_ADD_PLAYER:
            context._playerList.addPlayer(message.displayName, message.sID, context._handSize, false, false);
            break;
          case ACTION_ADD_DM:
            context._playerList.addPlayer(message.displayName, message.sID, 0, true, false);
            break;
          case ACTION_PLAYER_SETUP:
            context.setupPlayer(message.details);
            if(message.fromDM)
              context.sendSingleplayerAction(message.sID, ACTION_OK, 'ACTION_PLAYER_SETUP');
            break;
          case ACTION_GIVE_INITIAL_HAND:
            if(context._deck !== null)
              context._player.giveInitialHand();
            if(message.fromDM)
              context.sendSingleplayerAction(message.sID, ACTION_OK, 'ACTION_GIVE_INITIAL_HAND');
            break;
          case ACTION_DRAW_TO_POOL:
            if(context._deck !== null)
              context._deck.drawToPool(parseInt(message.details));
            if(message.fromDM)
              context.sendSingleplayerAction(message.sID, ACTION_OK, 'ACTION_DRAW_TO_POOL');
            break;
          case ACTION_GIVE_TURN:
            context._playerList.toggleTurn(message.details);
            if(message.fromDM && parseInt(message.details) === parseInt(context._sessionID))
              context.sendSingleplayerAction(message.sID, ACTION_OK, 'ACTION_GIVE_TURN');
            break;
          case ACTION_PUT_BACK_IN_POOL:
            context._deck.putBackInPool(message.details);
            break;
          case ACTION_PLAY_FROM_POOL:
            context._deck.playFromPool(message.details);
            break;
          case ACTION_SHUFFLE_GRAVEYARD_INTO_PILE:
              context._deck.shuffleGraveyardIntoPile(message.details);
            if(message.fromDM && parseInt(message.details) === parseInt(context._sessionID))
              context.sendSingleplayerAction(message.sID, ACTION_OK, 'ACTION_SHUFFLE_GRAVEYARD_INTO_PILE');
            break;
          case ACTION_OK:
            context._chatBox.addMessage(message.displayName +' ('+ message.sID +') - '+message.details);
            break;
          case ACTION_CHAT:
            context._chatBox.addMessage(message.displayName +': '+ message.details);
            break;
          default:

        }
      }
    };
    context._ws.onclose= function(evt){
      console.log('log: Diconnected');
      $('#container').addClass('logged-off');
      context.loading(false);
    };
    context._ws.onerror= function(evt){
      console.log('log: Error');
      context.loading(false);
    };
    context._ws.onopen= function(evt){
      console.log('log: Connected');
      let id = 'TableTop_' + multiplayerID;
      this.send('{"setID":"'+id+'", "passwd":"none"}');
      context._roomID = id;
      $('#multiplayer .sign-off p').text(multiplayerID);
      jQuery('body').addClass('signed-in');
    };
  }
  sendMultiplayerAction(action, details, callback) {
    if(this._ws) {
      let command = {
          to: this._roomID,
          displayName: this._displayName,
          fromDM: this._isDM,
          action: action,
          details:  this.setDefaultIfEmpty(details, ''),
          callback: this.setDefaultIfEmpty(callback, '')
      };
      this._ws.send(JSON.stringify(command));
    }
  }
  sendSingleplayerAction(sessionID, action, details, callback) {
    if(this._ws) {
      let command = {
          toS: parseInt(sessionID),
          displayName: this._displayName,
          fromDM: this._isDM,
          action: action,
          details:  this.setDefaultIfEmpty(details, ''),
          callback: this.setDefaultIfEmpty(callback, '')
      };
      this._ws.send(JSON.stringify(command));
    }
  }
  uuid() {
    return Math.floor(Math.random()*1E16);
  }
  setupDM() {
    this._deck = new Deck(this, '#play-area', '#deck-pile', '#pool','#deck-graveyard', 150, []);
    this._player = new DungeonMaster(this._deck);
  }
  setupPlayer(deckOrder) {
    this._deck = new Deck(this, '#play-area', '#deck-pile', '#pool', '#deck-graveyard', 150, deckOrder.split(','));
    this._player = new Player(false, this._deck, this._handSize, '#player-hand');
    this.loading(false);
  }
}
