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
