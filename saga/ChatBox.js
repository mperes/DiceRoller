class ChatBox {
  constructor(gameSession, container) {
    this._gameSession = gameSession;
    const self = this;
    this._title = 'ChatBox';
    this._view = $('<div id="chatbox" class="collapsed"><div class="title">'+this._title+'</div></div>');
    let messages = $('<ul class="messages"></div>').click((e) => {
      self.collapse();
    });
    let sendMSG = $('<input type="text" class="new-message" placeholder="What do you want to say?"/>').keyup(function(e){
      if(e.keyCode == 13) {
        let field = $(e.target);
        let msg = field.val();
        self.addMessage('You: '+ msg);
        self._gameSession.sendMultiplayerAction(ACTION_CHAT, msg);
        field.val('');
      }
    });
    this._view.append(messages);
    this._view.append(sendMSG);
    $(container).append(this._view);
  }
  collapse() {
    this._view.toggleClass('collapsed');
  }
  addMessage(msg) {
    if(this._view.find('.messages').children().length === 0) this._view.removeClass('collapsed');
    this._view.find('.messages').append('<li>'+msg+'</li>');
    this._view.find('.messages').scrollTop(this._view.find('.messages')[0].scrollHeight);
  }
  setTitle(title) {
    this._view.find('.title').text(title);
  }
}
