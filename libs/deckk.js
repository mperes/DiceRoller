const CARD_RED = 0;
const CARD_BLACK = 1;
const CARD_WHITE = 2;

const SUIT_ARROW = 0;
const SUIT_CROWN = 1;
const SUIT_DRAGON = 2;
const SUIT_HEART = 3;
const SUIT_HELM = 4;
const SUIT_MOON = 5;
const SUIT_ORB = 6;
const SUIT_SHIELD = 7;
const SUIT_SWORD = 8;

const ON_PILE = 0;
const ON_TABLE = 1;

const CARD_COLORS = ['White', 'Red', 'Black'];
const CARD_SUITS = ['Arrow', 'Crown', 'Dragon', 'Heart', 'Helm', 'Moon', 'Orb', 'Shield', 'Sword'];

class Deck {
  constructor(table, pile, graveyard, cardWidth) {
    this._container = {table: $(table), pile: $(pile), graveyard: $(graveyard)};
    this._cardWidth = (isNaN(cardWidth)) ? 262 : cardWidth;
    this._cardHeight = 375 * (this._cardWidth / 262);
    this._cardRatio = this._cardWidth / 262;
    this._graveyard = [];
    this._table = [];

    let context = this;
    this._cardDblclickCallback = function(card, view) {
      switch(card._state) {
        case ON_PILE:
          context.draw();
          break;
        case ON_TABLE:
          card.flip(view);
          break;
        default:
      }
    }

    this._pile = DECK_OF_FATE;
    this.shuffle();
    this.renderPile();
  }
  draw(amount) {
    if(isNaN(amount)) amount = 1;
    while(amount > 0) {
      let card = this._pile[this._pile.length-1];
      this._pile.pop();
      card._state = ON_TABLE;
      card.flip(card._view);
      this._table.push(card);
      this._container.table.append(card._view);
      amount--;
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
      card.offset({ top: top, left: left});
      this._container.pile.append(card);
    }
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
}

class Card {
  constructor(id, suit, value, name, nature, behavior, color, background, width, flipped, cardDblclickCallback) {
    this._width = (isNaN(width)) ? 262 : width;
    this._flipped = (typeof flipped === 'boolean') ? flipped : true;
    this._height = 375 * (this._width / 262);
    this._ratio = this._width / 262;
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
    this._cardDblclickCallback = cardDblclickCallback;
  }
  view() {
    let context = this;
    let card = $('<div/>');
    card.attr('id', 'card-'+this._id);
    card.attr('data-suit', CARD_SUITS[this._suit]);
    card.attr('data-value', this._value);
    card.attr('data-name', this._name);
    card.attr('data-nature', this._nature);
    card.attr('data-behavior', this._behavior);
    card.attr('data-color', CARD_COLORS[this._color]);
    card.addClass('card');
    if(this._flipped) card.addClass('flipped');
    let backgroundPositionX = -this._background[1] * this._width + 'px';
    let backgroundPositionY = -this._background[0] * this._height + 'px';
    let backgroundPosition = backgroundPositionX + ' ' + backgroundPositionY;
    let backgroundSize = this._width * 10 +'px ' + this._height * 9 + 'px';
    card.css('background-position', backgroundPosition);
    card.css('background-size', backgroundSize);
    card.css('border-radius', 15 * this._ratio + 'px');
    card.width(this._width);
    card.height(this._height);
    this._view = $(card);
    this._view.dblclick((e) => {
      let view = $(e.target);
      context._cardDblclickCallback(context, view);
    });
    return this._view;
  }
  flip(view) {
    view.toggleClass('flipped');
    this._flipped = !this._flipped;
  }
}
