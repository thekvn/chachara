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

      this.rooms        = new Chachara.Rooms();
      this.participants = new Chachara.Participants();

      this.useNotifications = false;
      this.nick = null;
    },

    init: function() {
      var self = this;

      var dom = $("#app");
      dom.css("position", "relative")
         .css("top", (($(window).height() - dom.height())/2) +"px")
         .addClass("transparent");

      this.client.bind("connect-not-ok", function() {
        console.log("[App] connect-not-ok Presenting Signin Form")
        self.signin();
      });

      this.client.bind("connect-ok", function(connectData) {
        self.chat(connectData);
      });

      this.client.bind("disconnect", function() {
        console.log("[App] Disconnected, Presenting Signin Form")
        self.signin();
      });

      this.client.bind("message", function(message) {
        self.displayNotification(message);
      });

      var tpl = $(_.template("#chat-view-template")());
      $("#app").html(tpl.html());

      this.secondaryView = new Chachara.SecondaryView({el: $("#secondary-view")[0] });
      this.secondaryView.render();

      this.client.bind("message", function(message) {
        self.secondaryView.displayMessage(message);
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
          if (window.localStorage) {
            window.localStorage.setItem("jid", data.jid);
            window.localStorage.setItem("rooms", data.rooms.join(","))
          }

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
      var tpl = _.template("#chat-view-template");

      $("#app").html($(tpl()).html());
      $("#app").removeClass("transparent");

      self.rooms.bind("add", function(room) {
        self.createRoomView(room);
      })

      this.client.bind("join-room", function(data) {
        self.rooms.add(new Chachara.Room({id: data.room}));
      });

      if (chatData.rooms) {
        _(chatData.rooms).each(function(room) {
          if (chatData["do-join"]) {
            self.client.join(room);
          } else {
            self.rooms.add(new Chachara.Room({id: room}));
          }
        });
      }
    },

    /*
    * createRoomView
    *
    * params room  Chachara.Room
    */
    createRoomView: function(room) {
      console.log("[App] Create Room View -> " + room.id);
      var self    = this;
      var newView = new Chachara.ChatView({
        el: $("#chat-view-container")[0],
        room: room
      });

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
        if (message.room == room.id) {
          newView.displayEmbedly(message);
        }
      });

      this.client.bind("message", function(message) {
        if (message.room == room.id) {
          self.messageHandler.processMessage(message);
        }
        newView.displayMessage(message);
      });

      this.client.bind("presence", function(message) {
        var fromParts   = message.from.split(/\//);
        var thisRoom    = self.rooms.get(fromParts[0]);
        var participant = thisRoom.participants.get(fromParts[1])

        newView.displayPresence(message);
        if (participant == undefined) {
          participant = new Chachara.Participant({
            id: fromParts[1],
            room: thisRoom,
            status: message.status,
          });

          thisRoom.participants.add(participant);
        }
      });

      this.chatViews[room.id] = newView;

      for (var k in this.chatViews) {
        this.chatViews[k].hide();
      }

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
