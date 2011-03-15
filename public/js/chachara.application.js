$(function() {
  Chachara.Application = Backbone.Controller.extend({
    routes: {
      "": "init",
      "chat":"chat"
    },

    initialize: function(options) {
      _(this).bind("init", "signin", "chat", "createRoomView");

      this.client         = options.client;
      this.messageHandler = options.messageHandler;
      this.chatViews = {};
      this.useNotifications = false;
      this.nick = null;
    },

    init: function() {
      var self = this;

      this.client.bind("connect-not-ok", function() {
        console.log("[App] connect-not-ok Presenting Signin Form")
        self.signin();
      });


      this.client.bind("connect-ok", function(connectData) {
        console.log("[App] connect-ok Presenting ChatView");
        _(connectData.rooms).each(function(room) {
          console.log("[App] Server Gave Rooms: -> " + room);
          self.createRoomView(room);
        })
      });

      this.client.bind("disconnect", function() {
        console.log("[App] Disconnected, Presenting Signin Form")
        self.signin();
      });

      this.client.bind("message", function(message) {
        self.displayNotification(message);
      });
    },

    signin: function() {
      if (this.signinView == undefined) {
        var self = this;
        this.signinView = new Chachara.SigninView();
        this.signinView.render();

        this.client.bind("auth-not-ok", function(message) {
          console.log("[App] auth-not-ok Presenting Signin Form")
          self.signinView.presentError("Authentication Failed.");
        });

        this.signinView.bind('submit', function(data) {
          self.client.authenticate(data);
          self.enableNotifications();
          self.authData = data;
        });

        self.client.bind("auth-ok", function() {
          console.log("[App] Authentication Successful");
          console.log("[App] Initiating Chat");
          self.signinView.dismiss();
          self.nick = self.authData.jid.split("@")[0];
          self.authData["do-join"] = true;
          self.chat(self.authData);
        });
      }
    },

    chat: function(chatData) {
      var self = this;

      this.client.bind("join-room", function(data) {
        self.createRoomView(data.room);
      });

      if (chatData["do-join"]) {
        _(chatData.rooms).each(function(room) {
          self.client.join(room);
        });
      }
    },

    createRoomView: function(room) {
      console.log("[App] Create Room View -> "+room);
      var self    = this;
      var room    = room;

      var newView = new Chachara.ChatView({room:room, el:$("#app")[0]});

      newView.render();

      newView.bind("input", function(data) {
        self.client.send(data);
      });

      newView.bind("nextpane", function(current) {
        var views = _(self.chatViews).toArray();
        var currentIndex = views.indexOf(current);
        currentIndex = currentIndex + 1;

        if (currentIndex < views.length) {
          console.log("[App] Next Pane");
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
          console.log("[App] Previous Pane");
          _(views).each(function(view) {
            view.hide();
          });
          views[currentIndex].show();
        }
      });

      this.messageHandler.bind("embedded", function(message){
        if (message.room == room) newView.displayEmbedly(message);
      });

      this.client.bind("message", function(message) {
        if (message.room == room) self.messageHandler.processMessage(message);
        newView.displayMessage(message);
      });

      this.client.bind("presence", function(message) {
        newView.displayPresence(message);
        newView.updateParticipants(message);
      });

      _(this.chatViews.values).each(function(v) {
        v.hide();
      });

      this.chatViews[room] = newView;
      newView.show();
    },

    enableNotifications: function(){
      var self = this;

      function permissionGranted(){ self.useNotifications = true; }
      window.webkitNotifications.requestPermission(permissionGranted);
    },

    displayNotification: function(message) {
      if (window.webkitNotifications.checkPermission() == 0) {
        if (message.body.indexOf(this.nick) != -1 && message.from.indexOf(this.nick) == -1) {
          var n = window.webkitNotifications.createNotification('', message.from, message.body);
          n.show();
          setTimeout(function(){n.cancel()}, 5000);
        }
      }
    }

  })
});
