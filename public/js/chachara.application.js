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
      this.mentionMatcher = null;
    },

    init: function() {
      var self = this;

      var dom = $("#app");
      dom.css("position", "relative")
         .css("top", (($(window).height() - dom.height())/2) +"px")
         .addClass("transparent");

      this.client.bind("connect-not-ok", function() {
        console.log("[App] connect-not-ok Presenting Signin Form");
        self.signin();
      });

      this.client.bind("connect-ok", function(connectData) {
        self.nick = window.localStorage.getItem("jid").split("@")[0];
        self.chat(connectData);
      });

      this.client.bind("disconnect", function() {
        console.log("[App] Disconnected, Presenting Signin Form");
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
      if (this.signinView === undefined) {
        var self = this;
        this.signinView = new Chachara.SigninView();
        this.signinView.render();

        this.client.bind("auth-not-ok", function(message) {
          console.log("[App] auth-not-ok Presenting Signin Form");
          self.signinView.presentError("Authentication Failed.");
        });

        this.signinView.bind('submit', function(data) {
          if (window.localStorage) {
            window.localStorage.setItem("jid", data.jid);
            window.localStorage.setItem("rooms", data.rooms.join(","));
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
          self.mentionMatcher = new RegExp("\\b" + self.nick + "\\b", "i");
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
      });

      this.client.bind("join-room-ok", function(data) {
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
        room: room,
        app: this
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

      newView.bind("join", function(roomName) {
        self.client.join(roomName);
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
        var participant = thisRoom.participants.get(fromParts[1]);

        // Per-room presence. Joined or exited
        if (message.show === "join-room" || message.show == "exit-room") {
          console.log("[XMPP] " + fromParts[1] + " " + message.show);

          if (participant === undefined) {
            participant = new Chachara.Participant({
              id: fromParts[1],
              room: thisRoom,
              show: message.show
            });

            thisRoom.participants.add(participant);
          } else {
            participant.set({show:message.show});
          }

          newView.displayPresence(message);

        // Global presence update, i.e. status updates
        } else {
          if (message.show == "offline") {
            console.log("[XMPP] " + fromParts[1] + " went offline");
          } else {
            console.log("[XMPP] " + fromParts[1] + " changed status to " + message.show);
            console.log("[XMPP] new status message: " + message.status);
          }
        }

      });

      this.chatViews[room.id] = newView;

      for (var k in this.chatViews) {
        if (this.hasOwnProperty(k)) {
          this.chatViews[k].hide();
        }
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
        if (message.body.match(this.mentionMatcher) != undefined && message.from.indexOf(this.nick) == -1){
          var n = window.webkitNotifications.createNotification('', message.from, message.body);
          n.show();
          setTimeout(function() { 
            n.cancel();
          }, 5000);
        }
      }
    }
  });
});
