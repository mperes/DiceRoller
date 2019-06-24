'use strict'

class Sheet {
  constructor(container, json) {
    this._characterData = [];
    this._savingEnabled = true;
    if(window.localStorage.getItem('tableTopCharacterSheet') != null) {
      this._characterData = JSON.parse(window.localStorage.getItem('tableTopCharacterSheet'));
    }
    Object.defineProperty(this, '_container', { value: jQuery(container), writable: true });
    this.loadSheet();
  }
  loadSheet() {
    var self = this;
    this._container.load('sheet.html', function() {
      jQuery('input, textarea').change(function() {
        self.saveCharacterSheet()
      });
      if(self._characterData.length > 0) {
        self.fillSheetFrom();
      }
      jQuery('#character-sheat-toolbar .upload').click(function() {
        self.uploadSheet()
      });
    });
  }
  saveCharacterSheet() {
    if(!this._savingEnabled) return;
    this._characterData = this._container.find('form').serializeArray();
    window.localStorage.setItem('tableTopCharacterSheet', JSON.stringify(this._characterData));
  }
  uploadSheet() {
    jQuery.ajax({
      type: "POST",
      url: "https://api.jsonbin.io/b",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify(this._characterData),
      crossDomain: true,
      headers: {
        'secret-key': '$2a$10$cKeOfrm1OzzMBizWESpBwOoWFsRHfmcRAaiaULJiHfCVC.GUBBJIO',
        'collection-id': '5d10d49fb19ce41159e0f0f7',
        'private': true,
        'name': jQuery('#character-sheet #hero').val() + ' - ' + new Date().toJSON().slice(0,10).split('-').reverse().join('/')
      },
      success: function(data, textStatus, errorThrown) {
        //console.log(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {

      },
      complete: function(jqXHR, textStatus) {

      }
    });
  }
  deleteSheet(id) {
    jQuery.ajax({
      type: "DELETE",
      url: "https://api.jsonbin.io/b/"+id,
      contentType: "application/json",
      crossDomain: true,
      headers: {
        'secret-key': '$2a$10$cKeOfrm1OzzMBizWESpBwOoWFsRHfmcRAaiaULJiHfCVC.GUBBJIO'
      },
      success: function(data, textStatus, errorThrown) {
        //console.log(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {

      },
      complete: function(jqXHR, textStatus) {

      }
    });
  }
  fillSheetFrom() {
    this._savingEnabled = false;
    for(var i=0; i<this._characterData.length; i++) {
      var field = this._characterData[i];
      var form = this._container.find('form');
      if(field.value.trim() != "") {
        var element = form.find('input[name="'+field.name+'"], textarea[name="'+field.name+'"]');
        if(element.length > 1) {
          element.filter('[value="'+field.value+'"]').prop('checked', true);
        } else {
          form.find('input[name="'+field.name+'"], textarea[name="'+field.name+'"]').val(field.value);
        }
      }
    }
    this._savingEnabled = true;
  }
}
