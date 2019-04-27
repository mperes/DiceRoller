class ImageLoader {
  constructor(gameSession, container) {
    this._gameSession = gameSession;
    this._validFormats = ['jpg', 'jpeg', 'gif', 'png', 'bmp'];
    this._src = '';
    this._view = $('<div id="image-loader" >/').addClass('hidden');
    this._image = null;
    this._width = 0;
    this._height = 0;
    this._originalWidth = 0;
    this._originalHeight = 0;
    this._zoom = 1;
    this._viewer = null;
    $(container).prepend(this._view);
    this.load('assets/image/krynn_map.jpg');

    const self = this;
    this.addMarker = function(pos) {
      let marker = $('<div class="marker"><div class="dot"></div><div class="pulse"></div></div>').css('left', pos[0]).css('top', pos[1]);
      self._view.find('.iv-image-markers').append(marker);
    }
    this._view.on('click', '.iv-image-markers', function(e) {
      if(!self._gameSession._isDM) return;
      let offset = $(this).offset();
      let relativeX = (e.pageX - offset.left);
      let relativeY = (e.pageY - offset.top);
      let percentX = (relativeX / $(this).width() * 100) + '%';
      let percentY = (relativeY / $(this).height() * 100) + '%';
      let pos = [percentX, percentY];
      self.addMarker(pos);
      self._view.removeClass('marking');
      self._gameSession.sendMultiplayerAction(ACTION_ADD_MAP_MARKER, pos.join(','));
    });
  }
  load(src) {
    let self = this;
    if(!this.isValid(src)) return;
    if(this._viewer !== null) this._viewer = this._viewer.destroy();
    this._src = src;
    this._viewer = new ImageViewer(this._view[0]);
    this._viewer.load(this._src);
  }
  destroy() {
    this._viewer = this._viewer.destroy();
  }
  isValid(src) {
    let srcFormat = src.split('.')[src.split('.').length-1].toLowerCase();
    return (this._validFormats.indexOf(srcFormat) > -1) ? true : false;
  }
}
