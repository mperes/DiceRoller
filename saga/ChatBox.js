class ChatBox {
  constructor(container) {
    const self = this;
    this._title = 'ChatBox';
    this._view = $('<div id="chatbox" class="collapsed"><div class="title">'+this._title+'</div></div>');
    let messages = $('<ul class="messages"></div>').click((e) => {
      self.collapse();
    });
    this._view.append(messages);
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
