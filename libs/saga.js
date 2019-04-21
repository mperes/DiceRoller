//*---------------------------------------------------------------------
//* Single card
//* By Miguel Peres (m.peres@gmail.com)
//*---------------------------------------------------------------------
class Card {
  constructor(id, suit, value, name, nature, behavior, color, background, width, flipped, deck) {
    this._width = (isNaN(width)) ? DEFAULT_CARD_WIDTH : width;
    this._flipped = (typeof flipped === 'boolean') ? flipped : true;
    this._height = Math.round(DEFAULT_CARD_HEIGHT * (this._width / DEFAULT_CARD_WIDTH));
    this._ratio = this._width / DEFAULT_CARD_WIDTH;
    this._id = id;
    this._suit = suit;
    this._value = value;
    this._name = name;
    this._nature = nature;
    this._behavior = behavior;
    this._color = color;
    this._background = background;
    this._view = null;
    this._state = ON_PILE;
    this._deck = deck;

    let context = this;
    this.flip = function(state) {
      if (typeof state === 'boolean') {
        if(state) {
          context._view.addClass('flipped');
          this._flipped = true;
        } else {
          context._view.removeClass('flipped');
          this._flipped = false;
        }
      } else {
        context._view.toggleClass('flipped');
        this._flipped = !this._flipped;
      }
    }
  }
  view() {
    const context = this;
    let card = $('<div/>');
    card.attr('id', 'card-'+this._id);
    card.addClass('card');
    if(this._flipped) card.addClass('flipped');
    let backgroundPositionX = -this._background[1] * this._width + 'px';
    let backgroundPositionY = -this._background[0] * this._height + 'px';
    let backgroundPosition = backgroundPositionX + ' ' + backgroundPositionY;
    let backgroundSize = this._width * 10 +'px ' + this._height * 9 + 'px';

    let front = $('<div />').addClass('front');
    let back = $('<div />').addClass('back');

    front.css('background-position', backgroundPosition);
    front.css('background-size', backgroundSize);
    front.css('border-radius', 15 * this._ratio + 'px');

    back.css('background-size', backgroundSize);
    back.css('border-radius', 15 * this._ratio + 'px');

    card.css('border-radius', 15 * this._ratio + 'px');
    card.width(this._width);
    card.height(this._height);

    card.append(front);
    card.append(back);

    this._view = $(card);
    this._view.click((e) => {
      let view = $(e.target);
      let dblClickEvent = new CustomEvent('cardClickCallback',{
        detail: { card: context, view: view }
      });
      document.dispatchEvent(dblClickEvent);
    });
    return this._view;
  }
}
class ChatBox {
  constructor(gameSession, container) {
    this._gameSession = gameSession;
    const self = this;
    this._title = 'ChatBox';
    this._view = $('<div id="chatbox" class="collapsed"><div class="title">'+this._title+'</div></div>');
    let messages = $('<ul class="messages"></div>').click((e) => {
      self.collapse();
    });
    let sendMSG = $('<input type="text" class="new-message" placeholder="What do you want to say?"/>').keyup(function(e){
      if(e.keyCode == 13) {
        let field = $(e.target);
        let msg = field.val();
        self.addMessage('You: '+ msg);
        self._gameSession.sendMultiplayerAction(ACTION_CHAT, msg);
        field.val('');
      }
    });
    this._view.append(messages);
    this._view.append(sendMSG);
    $(container).append(this._view);
  }
  collapse() {
    this._view.toggleClass('collapsed');
  }
  addMessage(msg) {
    if(this._view.find('.messages').children().length === 0) this._view.removeClass('collapsed');
    this._view.find('.messages').append('<li>'+msg+'</li>');
    this._view.find('.messages').scrollTop(this._view.find('.messages')[0].scrollHeight);
  }
  setTitle(title) {
    this._view.find('.title').text(title);
  }
}
const ON_PILE = 0;
const ON_TABLE = 1;
const ON_HAND = 2;
const ON_GRAVEYARD = 3;

const DECK_SIZE = 82;
const DEFAULT_CARD_WIDTH = 262;
const DEFAULT_CARD_HEIGHT = 375;

const ACTION_PLAYER_JOIN = 0;
const ACTION_DM_JOIN = 1;
const ACTION_PLAYER_SETUP = 2;
const ACTION_OK = 3;
const ACTION_ADD_DM = 4;
const ACTION_ADD_PLAYER = 5;
const ACTION_DRAW_TO_TABLE = 6;
const ACTION_SEND_TABLE_TO_GRAVEYARD = 7;
const ACTION_GIVE_INITIAL_HAND = 8;
const ACTION_DRAW_TO_POOL = 9;
const ACTION_GIVE_TURN = 10;
const ACTION_PUT_BACK_IN_POOL = 11;
const ACTION_PLAY_FROM_POOL = 12;
const ACTION_SHUFFLE_GRAVEYARD_INTO_PILE = 13;
const ACTION_CHAT = 14;
//*---------------------------------------------------------------------
//* Deck Class
//* By Miguel Peres (m.peres@gmail.com)
//*---------------------------------------------------------------------
class Deck {
  constructor(gameSession, table, pile, pool, graveyard, cardWidth, deckOrder) {
    this._gameSession = gameSession;
    this._container = {table: $(table), pile: $(pile), pool: $(pool), graveyard: $(graveyard)};
    this._cardWidth = (isNaN(cardWidth)) ? DEFAULT_CARD_WIDTH : cardWidth;
    this._cardHeight = Math.round(DEFAULT_CARD_HEIGHT * (this._cardWidth / DEFAULT_CARD_WIDTH));
    this._cardRatio = this._cardWidth / DEFAULT_CARD_WIDTH;
    this._graveyard = [];
    this._table = [];
    this._pool = [];

    this._fateDeck = this.loadDeck(FATE_DECK);
    if(deckOrder.length > 0) {
      this._pile = this.forceDeck(this._fateDeck, deckOrder);
    } else {
      this._pile = this.cloneDeck(this._fateDeck);
      this.shuffle();
    }
    this.renderPile();
    this.renderGraveyeard();
  }
  loadDeck(deck) {
    let loadedDeck = [];
    deck.forEach((cardData) => {
      let card = new Card(cardData[0], cardData[1], cardData[2], cardData[3], cardData[4], cardData[5], cardData[6], cardData[7], this._cardWidth, true, this);
      loadedDeck.push(card);
    });
    return loadedDeck;
  }
  cloneDeck(deck) {
    let copy = [];
    deck.forEach((card) => {
      copy.push(card);
    });
    return copy;
  }
  forceDeck(deck, deckOrder) {
    let forced = [];
    for(let i=0; i<deckOrder.length; i++) {
      let card = deck[parseInt(deckOrder[i])];
      forced.push(card);
    }
    return forced;
  }
  getOrder() {
    let order = [];
    this._pile.forEach((card) => {
      order.push(card._id);
    });
    return order.join(',');
  }
  play(player, card) {
    let cardIndex = this.getCardIndex(player._hand, card._id);
    player._hand.splice(cardIndex, 1);
    card._state = ON_TABLE;
    this._table.push(card);
    card._view.removeClass('ready');
    this._container.table.append(card._view);
    setTimeout(function(){
      card._view.addClass('ready');
      if(card._flipped) setTimeout(function() { card.flip(false); }, 700);
    }, 100 );
    this._gameSession.sendMultiplayerAction(ACTION_PLAY_FROM_POOL, card._id.toString());
  }
  playFromPool(cardID) {
    let cardIndex = this.getCardIndex(this._pool, cardID);
    let card = this._pool[cardIndex];
    this._pool.splice(cardIndex, 1);
    card._state = ON_TABLE;
    this._table.push(card);
    card._view.removeClass('ready');
    this._container.table.append(card._view);
    setTimeout(function(){
      card._view.addClass('ready');
      if(card._flipped) setTimeout(function() { card.flip(false); }, 700);
    }, 100 );
  }
  trump() {
    if(this._table.length <= 1 || this._table[this._table.length-1]._suit === this._table[this._table.length-2]._suit) {
      let card = this._pile[this._pile.length-1];
      this._pile.pop();
      card._state = ON_TABLE;
      setTimeout(card.flip, 500);
      this._table.push(card);
      card._view.addClass('trump');
      card._view.addClass('ready');
      this._container.table.append(card._view);
      card._view.css({ top: 0, left: 0});
      card._view.removeClass('even');
      this.setShadowSize(this._container.pile);
      this.shuffleGraveyardIntoPile();
      this._gameSession.sendMultiplayerAction(ACTION_DRAW_TO_TABLE, '1');
    }
  }
  dmPlay() {
    let amount = prompt("How many card would you like to draw?", "");
    if(amount === null) return;
    if(amount.trim() === '') return;
    this.drawToTable(parseInt(amount), true);
  }
  drawToTable(amount, propagate) {
    let total = amount;
    if(isNaN(amount)) amount = 1;
    propagate = (typeof propagate === 'undefined') ? false : propagate;
    if(propagate) {
      this._gameSession.sendMultiplayerAction(ACTION_DRAW_TO_TABLE, total.toString());
    }
    while(amount > 0) {
      let card = this._pile[this._pile.length-1];
      this._pile.pop();
      card._state = ON_TABLE;
      setTimeout(card.flip, (total-amount)*500 + 500);
      this._table.push(card);
      card._view.addClass('dmPlay');
      card._view.addClass('ready');
      this._container.table.append(card._view);
      card._view.css({ top: 0, left: 0});
      card._view.removeClass('even');
      this.setShadowSize(this._container.pile);
      this.shuffleGraveyardIntoPile();
      amount--;
    }
    this.setShadowSize(this._container.pile);
    this.shuffleGraveyardIntoPile();
  }
  drawToPool(amount, propagate) {
    let total = amount;
    if(isNaN(amount)) amount = 0;
    propagate = (typeof propagate === 'undefined') ? false : propagate;
    if(propagate) {
      this._gameSession.sendMultiplayerAction(ACTION_DRAW_TO_TABLE, total.toString());
    }
    while(amount > 0) {
      let card = this._pile[this._pile.length-1];
      this._pile.pop();
      card._state = ON_HAND;
      this._pool.push(card);
      this._container.pool.append(card._view);
      card.flip();
      card._view.css({ top: 0, left: 0});
      card._view.removeClass('even');
      this.setShadowSize(this._container.pile);
      this.shuffleGraveyardIntoPile();
      amount--;
    }
    this.setShadowSize(this._container.pile);
    this.shuffleGraveyardIntoPile();
  }
  draw(hand, view, amount, propagate) {
    if(isNaN(amount)) amount = 1;
    let total = amount;
    propagate = (typeof propagate === 'undefined') ? false : propagate;
    if(propagate) {
      this._gameSession.sendMultiplayerAction(ACTION_DRAW_TO_POOL, total.toString());
    }
    while(amount > 0) {
      let card = this._pile[this._pile.length-1];
      this._pile.pop();
      card._state = ON_HAND;
      card.flip();
      hand.push(card);
      view.append(card._view);
      card._view.css({ top: 0, left: 0});
      card._view.removeClass('even');
      setTimeout(function(){
        card._view.addClass('ready');
      }, amount * 100);
      amount--;
    }
    this.setShadowSize(this._container.pile);
    this.shuffleGraveyardIntoPile();
  }
  getBack(player, card)  {
    let cardIndex = this.getCardIndex(this._table, card._id);
    this._table.splice(cardIndex, 1);
    card._state = ON_HAND;
    player._hand.push(card);
    card._view.removeClass('ready');
    setTimeout(function(){
      player._container.hand.append(card._view);
    }, 500);
    setTimeout(function(){
      card._view.addClass('ready');
    }, 700);
    this._gameSession.sendMultiplayerAction(ACTION_PUT_BACK_IN_POOL, card._id.toString());
  }
  putBackInPool(cardID)  {
    let cardIndex = this.getCardIndex(this._table, cardID);
    let card = this._table[cardIndex];
    this._table.splice(cardIndex, 1);
    card._state = ON_HAND;
    this._pool.push(card);
    card._view.removeClass('ready');
    this._container.pool.append(card._view);
    card._view.addClass('ready');
  }
  sendCardFromTableToGraveyard(propagate) {
    propagate = (typeof propagate === 'undefined') ? false : propagate;
    if(propagate) {
      this._gameSession.sendMultiplayerAction(ACTION_SEND_TABLE_TO_GRAVEYARD);
    }
    let top = (this._graveyard.length > 0) ? this._container.graveyard.children().last().position().top : 0;
    let left = (this._graveyard.length > 0) ? this._container.graveyard.children().last().position().left : 0;
    for(let i=this._table.length-1; i>=0; i--) {
      let card = this._table[i];
      this._table.pop();
      card._state = ON_GRAVEYARD;
      this._graveyard.push(card);
      let even = (i % 2 === 0);
      if(even) card._view.addClass('even');
      top -= Math.random()/2 * this._cardRatio;
      left -= Math.random()/2 * this._cardRatio;
      card._view.css({ top: Math.round(top), left: Math.round(left)});
      this._container.graveyard.append(card._view);
      card._view.removeClass('trump');
      card._view.removeClass('ready');
    }
    this.setShadowSize(this._container.graveyard);
  }
  shuffleGraveyardIntoPile(deckOrder) {
    if(this._graveyard.length === 0 || this._pile.length > 0) return;

    let forceDeck = true;
    if(typeof deckOrder === 'undefined') forceDeck = false;
    if(Array.isArray(deckOrder) && deckOrder.length === 0) forceDeck = false;

    if(forceDeck) {
      let top = 0;
      let left = 0;
      let order = deckOrder.split(',');
      for(let i=0; i<order.length; i++) {
        let ramdomCardIndex = parseInt(order[i]);
        let randomCard = this._graveyard[this.getCardIndex(this._graveyard, ramdomCardIndex)];
        randomCard._state = ON_PILE;
        this._pile.push(randomCard);
        top -= Math.random()/2 * this._cardRatio;
        left -= Math.random()/2 * this._cardRatio;
        randomCard._view.css({ top: Math.round(top), left: Math.round(left)});
        randomCard.flip();
        this._container.pile.append(randomCard._view);
        this.setShadowSize(this._container.pile);
        this.setShadowSize(this._container.graveyard);
      }
      this._graveyard = [];
    } else {
      if(this._gameSession._isDM !== true) return;
      let top = 0;
      let left = 0;
      while (this._graveyard.length > 0) {
        let ramdomCardIndex = Math.round(Math.random() * (this._graveyard.length-1));
        let randomCard = this._graveyard[ramdomCardIndex];
        this._graveyard.splice(ramdomCardIndex, 1);
        randomCard._state = ON_PILE;
        this._pile.push(randomCard);
        top -= Math.random()/2 * this._cardRatio;
        left -= Math.random()/2 * this._cardRatio;
        randomCard._view.css({ top: Math.round(top), left: Math.round(left)});
        randomCard.flip();
        this._container.pile.append(randomCard._view);
        this.setShadowSize(this._container.pile);
        this.setShadowSize(this._container.graveyard);
      }
      this._gameSession.sendMultiplayerAction(ACTION_SHUFFLE_GRAVEYARD_INTO_PILE, this.getOrder());
    }
  }
  renderPile() {
    this._container.pile.width(this._cardWidth)
    this._container.pile.height(this._cardHeight);
    this._container.pile.html('');
    var top = 0;
    var left = 0;
    for(let i=0; i<this._pile.length; i++) {
      let card = this._pile[i].view();
      let even = (i % 2 === 0);
      if(even) card.addClass('even');
      top -= Math.random()/2 * this._cardRatio;
      left -= Math.random()/2 * this._cardRatio;
      card.css({ top: Math.round(top), left: Math.round(left)});
      this._container.pile.append(card);
    }
    this.setShadowSize(this._container.pile);
  }
  renderGraveyeard() {
    this._container.graveyard.width(this._cardWidth)
    this._container.graveyard.height(this._cardHeight);
  }
  renderTable() {
    this._container.table.html('');
    this._table.forEach((card) => {
      this._container.table.append(card.view());
    });
  }
  shuffle(deckOrder) {
    for (let i = this._pile.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this._pile[i], this._pile[j]] = [this._pile[j], this._pile[i]];
    }
  }
  getCardIndex(cardArray, id) {
    let index = cardArray.findIndex(card => parseInt(card._id) === parseInt(id));
    return index;
  }
  setShadowSize(pile) {
    pile.attr('data-amount', pile.children().length);
  }
}
//*---------------------------------------------------------------------
//* Dungeon Master Toolbar
//* By Miguel Peres (m.peres@gmail.com)
//*---------------------------------------------------------------------
class DmToolbar {
  constructor(deck, container) {
    const context = this;
    this._deck = deck;

    this.discardTable = function() {
      context._deck.sendCardFromTableToGraveyard(true);
    }

    this.draw = function() {
      context._deck.dmPlay();
    }

    this._view = $('<div id="dm-toolbar" />');
    this._view.append(this._getActionButton('dm-draw', 'Draw Card', this.draw));
    this._view.append(this._getActionButton('dm-table-clear', 'Discard Table', this.discardTable));
    $(container).prepend(this._view);
  }
  _getActionButton(id, label, action) {
    return $('<div id="'+id+'" class="action"><span class="label">'+label+'</span></div>').click(action);
  }
}
//*---------------------------------------------------------------------
//* Dungeon Master
//* By Miguel Peres (m.peres@gmail.com)
//*---------------------------------------------------------------------
class DungeonMaster {
  constructor(deck) {
    this.isDM = true;
    this._deck = deck;
    this._toolbar = new DmToolbar(this._deck, '#table-top');

    const context = this;
    document.addEventListener('cardClickCallback', function (event) {
      let card = event.detail.card;
      let view = event.detail.view;
      switch(card._state) {
        case ON_PILE:
          context._deck.dmPlay();
          break;
        case ON_GRAVEYARD:
          break;
        case ON_TABLE:
          break;
        default:
      }
    }, false);

    this.setupTurnButton();
  }
  setupTurnButton() {
    const context = this;
    $('#player-turn-begin').click((e) => {
      $('#player-turn').toggleClass('playing');
      this.beginTurn();
    });
    $('#player-turn-end').click((e) => {
      $('#player-turn').toggleClass('playing');
      this.endTurn();
    });
  }
  beginTurn() {
    this._playing = true;
  }
  endTurn() {
    // this._deck.draw(this._hand, this._container.hand, this._numberOfCardsUsed);
    // this._deck.sendCardFromTableToGraveyard(true);
    // this._playing = false;
    // this._trumped = false;
    // this._numberOfCardsUsed = 0;
  }
}
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
  loading(state) {
    if(state) {
      var loadingBlocker = $('<div id="tabletop-loading-blocker" />').click(function() {});
      var loadingSpinner = $('<div id="tabletop-loading-spinner" />');
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
    context._ws = new WebSocket('wss://cloud.achex.ca/tabletop');
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
    this._chatBox = new ChatBox(this, '#table-top');
    this._chatBox.setTitle('Session ID: '+this._roomID.split('_')[1]);
  }
  setupPlayer(deckOrder) {
    this._deck = new Deck(this, '#play-area', '#deck-pile', '#pool', '#deck-graveyard', 150, deckOrder.split(','));
    this._player = new Player(false, this._deck, this._handSize, '#player-hand');
    this._chatBox = new ChatBox(this, '#table-top');
    this._chatBox.setTitle('Session ID: '+this._roomID.split('_')[1]);
  }
}
//*---------------------------------------------------------------------
//* Player
//* By Miguel Peres (m.peres@gmail.com)
//*---------------------------------------------------------------------
class Player {
  constructor(isDM, deck, handSize, handContainer) {
    this.isDM = isDM;
    this._container = {hand: $(handContainer)};
    this._hand = [];
    this._deck = deck;
    this._handSize = (isNaN(handSize)) ? 1 : handSize;
    this._playing = false;
    this._trumped = false;
    this._numberOfCardsUsed = 0;
    this._maxNumberOfCardsPerAction = 1;

    const context = this;
    document.addEventListener('cardClickCallback', function (event) {
      let card = event.detail.card;
      let view = event.detail.view;
      switch(card._state) {
        case ON_PILE:
          if(!context._playing) return;
          if(context._numberOfCardsUsed === 0) return;
          context._deck.trump();
          context._trumped = true;
          break;
        case ON_HAND:
          if(context._numberOfCardsUsed < context._maxNumberOfCardsPerAction && context._playing) {
            context._deck.play(context, card);
            context._numberOfCardsUsed++;
          } else {
            card.flip();
          }
          break;
        case ON_TABLE:
          if(!context._playing) return;
          if(!context._trumped) {
            context._deck.getBack(context, card);
            context._numberOfCardsUsed--;
          }
          break;
        default:
      }
    }, false);

    //this._deck.draw(this._hand, this._container.hand, this._handSize);

    this.setupTurnButton();
  }
  setupTurnButton() {
    const context = this;
    $('#player-turn-begin').click((e) => {
      $('#player-turn').toggleClass('playing');
      this.beginTurn();
    });
    $('#player-turn-end').click((e) => {
      $('#player-turn').toggleClass('playing');
      this.endTurn();
    });
  }
  toggleTurn() {
    if(this._playing) {
      console.log('Your turn has finished');
      this.endTurn();
    } else {
      console.log('It is your turn!');
      this.beginTurn();
    }
  }
  beginTurn() {
    this._playing = true;
  }
  draw(hand, view, amount, propagate) {
    this._deck.draw(this._hand, this._container.hand, amount, true);
  }
  giveInitialHand() {
    this.draw(this._hand, this._container.hand, this._handSize, true);
  }
  endTurn() {
    this._deck.draw(this._hand, this._container.hand, this._numberOfCardsUsed, true);
    this._deck.sendCardFromTableToGraveyard(true);
    this._playing = false;
    this._trumped = false;
    this._numberOfCardsUsed = 0;
  }
}
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
    let player = $('#player-'+sessionID);
    if(player.length === 0) return;
    player.toggleClass('hasTurn');
    if(parseInt(sessionID) === parseInt(this._gameSession._sessionID) && this._gameSession._player !== null)
      this._gameSession._player.toggleTurn();
  }
}
