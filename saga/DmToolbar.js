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
