//*---------------------------------------------------------------------
//* Dungeon Master Toolbar
//* By Miguel Peres (m.peres@gmail.com)
//*---------------------------------------------------------------------
class DmToolbar {
  constructor(deck, container) {
    const context = this;
    this._deck = deck;
    this._audioPlayer = null;

    this.discardTable = function() {
      context._deck.sendCardFromTableToGraveyard(true);
    }

    this.draw = function() {
      context._deck.dmPlay();
    }

    this.createAudioPlayer = function(listFile) {
      let playList = listFile.split(/\r?\n/);
      for(let i = playList.length-1; i>=0; i--) {
        if(playList[i].trim() === '') playList.pop();
      }
      context._audioPlayer = $('<div id="audio-player" />');
      let list = $('<select />');
      for(let i=0; i<playList.length; i++) {
        list.append($('<option />').attr('value', playList[i]).text(context.getAudioName(playList[i])));
      }
      context._audioPlayer.append(list);
      let playButton = $('<input type="button" id="audio-player-play" value="Play" />').click((e) => {
        let file = $('#audio-player select').val();
        context._deck._gameSession.playAudio(file)
        context._deck._gameSession.sendMultiplayerAction(ACTION_AUDIO_PLAY, file);
      });
      let stopButton = $('<input type="button" id="audio-player-pause" value="Pause" />').click((e) => {
        let button = $(e.target);
        if(button.hasClass('paused')) {
          context._deck._gameSession._audioPlayer.play();
          button.removeClass('paused');
          context._deck._gameSession.sendMultiplayerAction(ACTION_AUDIO_CONTINUE);
        } else {
          context._deck._gameSession.pauseAudio();
          button.addClass('paused');
          context._deck._gameSession.sendMultiplayerAction(ACTION_AUDIO_PAUSE);
        }
      });
      let volume = $('<input type="range" id="audio-player-volume" min="0" max="100">').on('change', (e) => {
        let v = parseInt($(e.target).val()) / 100;
        context._deck._gameSession.adjustAudioVolume(v);
        context._deck._gameSession.sendMultiplayerAction(ACTION_AUDIO_VOLUME, v.toString());
      });
      context._audioPlayer.append(playButton);
      context._audioPlayer.append(stopButton);
      context._audioPlayer.append(volume);
      context._view.prepend(context._audioPlayer);
    }

    this.toggleMap = function() {
      $('#map-markers, #map-markers-delete').toggle();
      $('#krynn-map').toggleClass('toggled');
      context._deck._gameSession._imageLoader._view.toggleClass('hidden');
      if(context._deck._gameSession._imageLoader._view.hasClass('hidden')) {
        context._deck._gameSession.sendMultiplayerAction(ACTION_HIDE_MAP);
      } else {
        context._deck._gameSession.sendMultiplayerAction(ACTION_SHOW_MAP);
      }
      window.dispatchEvent(new Event('resize'));
    }

    this.toggleMarkers = function() {
      $('#map-markers').addClass('toggled');
      context._deck._gameSession._imageLoader._view.toggleClass('marking');
    }

    this.removeMarkers = function() {
      context._deck._gameSession._imageLoader.removeMarkers();
      context._deck._gameSession.sendMultiplayerAction(ACTION_REMOVE_MAP_MARKERS);
    }

    this._view = $('<div id="dm-toolbar" />');
    this._view.append('<div id="load-audio" class="action"><span class="label">Audio Player</span></div>');
    this._view.append(this._getActionButton('map-markers-delete', 'Remove Markers', this.removeMarkers));
    this._view.append(this._getActionButton('map-markers', 'Add Marker', this.toggleMarkers));
    this._view.append(this._getActionButton('krynn-map', 'Krynn Map', this.toggleMap));
    this._view.append(this._getActionButton('dm-draw', 'Draw Card', this.draw));
    this._view.append(this._getActionButton('dm-table-clear', 'Discard Table', this.discardTable));
    this._view.find('#map-markers, #map-markers-delete').toggle();
    $(container).prepend(this._view);
    this._localFileReader = new LocalFileReader('#load-audio', '', this.createAudioPlayer);
  }
  _getActionButton(id, label, action) {
    return $('<div id="'+id+'" class="action"><span class="label">'+label+'</span></div>').click(action);
  }
  getAudioName(name) {
    let fileName = name.split('/')[name.split('/').length-1];
    let fileWithoutType = fileName.split('.')[0].replace(/_/g, ' ');
    return fileWithoutType;
  }

}
