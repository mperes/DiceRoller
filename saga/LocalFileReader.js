class LocalFileReader {
  constructor(container, label, callback) {

    this.load = function(event) {
      let input = event.target;
      let reader = new FileReader();
      reader.onload = function(){
        let text = reader.result;
        if(typeof callback === 'function')
          callback(text);
      };
      reader.readAsText(input.files[0]);
    }

    this._button = $('<input type="file" class="localfilereader-button" />').change(this.load);
    this._container = $('<div class="localfilereader-container"><div class="localfilereader-fake">'+label+'</div></div>').prepend(this._button);
    $(container).append(this._container);

  }
}
