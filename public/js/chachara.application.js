$(function() {
  Chachara.Application = Backbone.Controller.extend({
    initialize: function(options) {
      _.bindAll(this, "signin", "chat");

      var self = this;

      this.client = options.client;

      // This event should not be preceded by a signin form
      this.client.bind("connect-ok", function() {
        console.log("[App] connect-ok Presenting ChatView");
        self.chat();
      });

      this.client.bind("auth-ok", function() {
        console.log("[App] auth-ok Presenting ChatView");
        self.chat();
      });

      this.client.bind("connect-not-ok", function() {
        console.log("[App] connect-not-ok Presenting Signin Form")
        self.signin();
      });

      // I think that this particular event should show the user something
      // like: authentication failure
      this.client.bind("auth-not-ok", function() {
        console.log("[App] auth-not-ok Presenting Signin Form")
        self.signin();
      });

      this.client.bind("disconnect", function() {
        console.log("[App] Disconnected, Presenting Signin Form")
        self.signin();
      });
    },

    routes: {
      "": "signin",
      "chat":"chat"
    },

    signin: function() {
      var self = this;

      this.signinView = new Chachara.SigninView();

      this.signinView.bind('connect', function(data) {
        self.room = data.room;
        self.client.authenticate(data);
      });

      this.signinView.render();
    },

    chat: function() {
      var self     = this;
      var chatView = this.chatView;
      var client   = this.client;

      chatView = new Chachara.ChatView({room:this.room});
      chatView.render();

      client.join(this.room);

      client.bind("message", function(message) {
        chatView.displayMessage(message);
      });

      chatView.bind("input", function(data) {
        data.sid = client.options.sid;
        console.log(data.room);
        client.send(data);
      })
    },
  });
});
