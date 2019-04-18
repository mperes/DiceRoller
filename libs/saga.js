const ON_PILE = 0;
const ON_TABLE = 1;
const ON_HAND = 2;
const ON_GRAVEYARD = 3;

const DECK_SIZE = 82;
const DEFAULT_CARD_WIDTH = 262;
const DEFAULT_CARD_HEIGHT = 375;

class GameSession {
  constructor(isDM, handSize) {
    this._flipped = (typeof isDM === 'boolean') ? isDM : false;
    this._deck = new Deck('#play-area', '#deck-pile', '#deck-graveyard', 150);
    this._player = new Player(isDM, this._deck, handSize, '#player-hand');
  }
}

class Deck {
  constructor(table, pile, graveyard, cardWidth) {
    this._container = {table: $(table), pile: $(pile), graveyard: $(graveyard)};
    this._cardWidth = (isNaN(cardWidth)) ? DEFAULT_CARD_WIDTH : cardWidth;
    this._cardHeight = Math.round(DEFAULT_CARD_HEIGHT * (this._cardWidth / DEFAULT_CARD_WIDTH));
    this._cardRatio = this._cardWidth / DEFAULT_CARD_WIDTH;
    this._graveyard = [];
    this._table = [];

    this._fateDeck = this.loadDeck(FATE_DECK);
    this._pile = this.cloneDeck(this._fateDeck);

    this.shuffle();
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
    }
  }
  draw(hand, view, amount) {
    if(isNaN(amount)) amount = 1;
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
  }
  sendCardFromTableToGraveyard() {
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
  shuffleGraveyardIntoPile() {
    if(this._graveyard.length === 0 || this._pile.length > 0) return;
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
  shuffle() {
    for (let i = this._pile.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this._pile[i], this._pile[j]] = [this._pile[j], this._pile[i]];
    }
  }
  getCardIndex(cardArray, id) {
    let index = cardArray.findIndex(card => card._id === id);
    return index;
  }
  setShadowSize(pile) {
    pile.attr('data-amount', pile.children().length);
  }
}

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

    this._deck.draw(this._hand, this._container.hand, this._handSize);

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
    this._deck.draw(this._hand, this._container.hand, this._numberOfCardsUsed);
    this._deck.sendCardFromTableToGraveyard();
    this._playing = false;
    this._trumped = false;
    this._numberOfCardsUsed = 0;
  }
  renderHand() {
    this._hand.forEach((card) => {
      console.log(card);
    });
  }
}
