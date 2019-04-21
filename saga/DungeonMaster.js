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
