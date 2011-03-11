$(function() {
  Chachara.Application = Backbone.Controller.extend({
    routes: {
      "": "init",
      "chat":"chat"
    },

    initialize: function(options) {
      _(this).bind("init", "signin", "chat");

      this.client    = options.client;
      this.chatViews = {}
      this.activeChatView = null;
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

      this.client.bind("connect-ok", function(connectData) {
        console.log("[App] connect-ok Presenting ChatView");
        self.chat(connectData);
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

      this.signinView.bind('submit', function(data) {
        self.client.authenticate(data);
        self.client.bind("auth-ok", function() {
          console.log("[App] Authentication Successful");
          console.log("[App] Initiating Chat");
          self.signinView.dismiss();
          self.chat(data);
        });
      });
    },

    chat: function(chatData) {
      var self = this;

      this.client.bind("join-room", function(data) {
        console.log("[App] Creating Room View for: "+data.room);

        var room    = data.room;
        var newView = new Chachara.ChatView({room:room, el:$("#app")[0]});
        newView.render();

        newView.bind("input", function(data) {
          data.sid = self.client.options.sid;
          self.client.send(data);
        });

        newView.bind("nextpane", function(current) {
          var views = _(self.chatViews).toArray();
          var currentIndex = views.indexOf(current);
          currentIndex = currentIndex + 1;

          if (currentIndex < views.length) {
            _(views).each(function(view) {
              view.hide();
            });
            views[currentIndex].show();
          }
        });

        newView.bind("prevpane", function(current) {
          var views = _(self.chatViews).toArray();
          var currentIndex = views.indexOf(current);
          currentIndex = currentIndex - 1;

          if (currentIndex >= 0) {
            _(views).each(function(view) {
              view.hide();
            });
            views[currentIndex].show();
          }
        });

        self.client.bind("message", function(message) {
          newView.displayMessage(message);
        });


        _(self.chatViews.values).each(function(v) {
          v.hide();
        });

        self.chatViews[room] = newView;
        newView.show();
      });

      _(chatData.rooms).each(function(r) {
        self.client.join(r);
      });
    },
  });
});
