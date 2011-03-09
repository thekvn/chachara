$(function() {
  Chachara.Application = Backbone.Controller.extend({
    initialize: function(options) {
      this.client = options.client;

      _.bindAll(this, "signin")
    },

    routes: { 
      "": "signin",
      "chat":"chat"
    },

    signin: function() {
      var self = this;

      this.signinView = new Chachara.SigninView();
      this.signinView.render();

      this.signinView.bind('connect', function(data) {
        self.client.authenticate(data);

        self.client.bind("connect-ok", function() {
          self.signinView.dismiss();

          self.chat();
        });
      });
    },

    chat: function() {
      var self     = this;
      var chatView = this.chatView;
      var client   = this.client;

      chatView = new Chachara.ChatView();
      chatView.render();

      client.join("test@conference.joy.yinkei.com");

      client.bind("message", function(message) {
        chatView.displayMessage(message);
      });

      chatView.bind("input", function(data) {
        client.send(data);
      })
    },
  });
});
