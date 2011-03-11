$(function() {
  Chachara.Application = Backbone.Controller.extend({
    routes: {
      "": "init",
      "chat":"chat"
    },

    initialize: function(options) {
      _.bindAll(this, "init", "signin", "chat");
      var self = this;

      this.client = options.client;
    },

    init: function() {
      var self = this;

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

    signin: function() {
      var self = this;

      this.signinView = new Chachara.SigninView();
      this.signinView.render();

      this.signinView.bind('connect', function(data) {
        self.client.authenticate(data);
        self.client.bind("auth-ok", function() {
          console.log("[App] Presenting ChatView");
          self.chat(data);
        });
      });
    },

    chat: function(chatData) {
      var self = this;
      console.dir(chatData);

      this.signinView.dismiss();
      this.chatViews = {}

      this.client.bind("join-room", function(data) {
        console.log("[App] Creating Room View for: "+data.room);

        var room    = data.room;
        var newView = new Chachara.ChatView({room:room, el:$("#app")[0]});
        newView.render();

        newView.bind("input", function(data) {
          data.sid = self.client.options.sid;
          self.client.send(data);
        });

        self.client.bind("message", function(message) {
          newView.displayMessage(message);
        });

        self.chatViews[room] = newView;
      });

      _(chatData.rooms).each(function(r) {
        self.client.join(r);
      });
    },
  });
});
