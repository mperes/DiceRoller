class ImageLoader {
  constructor(gameSession, container) {
    this._gameSession = gameSession;
    this._validFormats = ['jpg', 'jpeg', 'gif', 'png', 'bmp'];
    this._src = '';
    this._view = $('<div id="image-loader" >/');
    this._image = null;
    this._width = 0;
    this._height = 0;
    this._originalWidth = 0;
    this._originalHeight = 0;
    this._zoom = 1;
    this._viewer = null;
    $(container).prepend(this._view);
  }
  load(src, alt) {
    let self = this;
    if(!this.isValid(src)) return;
    this._src = src;
    this._viewer = new ImageViewer(this._view[0]);
    this._viewer.load(this._src);
  }
  isValid(src) {
    let srcFormat = src.split('.')[src.split('.').length-1].toLowerCase();
    return (this._validFormats.indexOf(srcFormat) > -1) ? true : false;
  }
}
