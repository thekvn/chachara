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

      this.domain = null;
      this.roomDomain = null;

      this.useNotifications = "false";
      this.nick = null;
      this.mentionMatchers = [];

      this.messageSound = {
        source  : new Audio("/audio/message.mp3"),
        enabled : "false"
      };

      this.mentionSound = {
        source  : new Audio("/audio/mention.mp3"),
        enabled : "false"
      };
    },

    init: function() {
      var self = this;

      var dom = $("#app");

      $("#app").addClass("transparent");
      $(window).resize(function() {
        $("#app").css("position", "absolute")
           .width($(window).width())
           .height($(window).height())
      });

      $(window).trigger("resize");

      this.client.bind("connect-not-ok", function() {
        self.signin();
      });

      this.client.bind("connect-ok", function(connectData) {
        self.jid = window.localStorage.getItem("jid");
        self.restoreState();
        self.chat(connectData);
      });

      this.client.bind("disconnect", function() {
        self.signin();
      });

    },

    restoreState: function(){
      var self = this;
      self.nick = self.jid.split("@")[0];
      self.domain = self.jid.split("@")[1];
      var mentions = [];

      // Add myself, should not render me in the sidebar
      participant = new Chachara.Participant({
         id: self.nick,
         show: "chat",
         status: "Chachara",
         color: self.randomColor()
      });

      self.participants.add(participant);

      if (window.localStorage.getItem("mentions") == undefined) {
        window.localStorage.setItem("mentions", this.nick);
        mentions.push(this.nick);
      } else {
        mentions = window.localStorage.getItem("mentions").split(",");
      }
      _.each(mentions, function(mention){
        self.mentionMatchers.push(new RegExp("\\b" + mention + "\\b", "i"));
      });

      this.resetMentionsTimeout();
    },

    signin: function() {
      if (this.signinView === undefined) {
        var self = this;
        this.signinView = new Chachara.SigninView();
        this.signinView.render();

        this.client.bind("auth-not-ok", function(message) {
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
          self.signinView.dismiss();
          self.jid = self.authData.jid;
          self.restoreState();
          self.authData["do-join"] = true;
          self.chat(self.authData);
        });
      }
    },

    chat: function(chatData) {
      var self = this;
      self.roomDomain = chatData.rooms[0].split('@')[1];
      var tpl = $(_.template("#chat-view-template")());

      $("#app").html(tpl.html());
      $("#app").removeClass("transparent");

      this.secondaryView = new Chachara.SecondaryView({el: $("#app #secondary-view")[0] });
      this.secondaryView.render();

      this.client.bind("groupchat", function(message) {
        self.audioNotification(message);
        // Chrome notifications block html5 audio
        setTimeout(function(){
          self.displayNotification(message);
        }, 10);
      });

      this.client.bind("chat", function(message) {
        self.audioNotification(message);
        // Chrome notifications block html5 audio
        setTimeout(function(){
          self.displayNotification(message);
        }, 10);
      });

      this.client.bind("groupchat", function(message) {
        message.processedBody = self.messageHandler.processBody(message);
        self.secondaryView.displayMessage(message);
      });

      this.client.bind("chat", function(message) {
        self.addParticipant(message.from.split("@")[0]);

        if (self.jid != message.from.split("/")[0]) {
          var room = self.rooms.get(message.from.split("/")[0]);

          if (room == undefined) {
            self.rooms.add(new Chachara.Room({ id: message.from.split("/")[0], type: "chat" }));
            setTimeout(function(){
              self.client.trigger("chat", message);
            }, 100);

          } else {
            self.secondaryView.displayPrivateMessage(message);
          }
        }
      });

      self.rooms.bind("add", function(room) {
        var view = self.createRoomView(room);
      });

      this.client.bind("join-room-ok", function(data) {
        self.rooms.add(new Chachara.Room({ id: data.room, type: "groupchat" }));
      });

      if (chatData.rooms) {
        _(chatData.rooms).each(function(room) {
          if (chatData["do-join"]) {
            self.client.join(room);
          } else {
            self.rooms.add(new Chachara.Room({ id: room, type: "groupchat" }));
          }
        });
      }

      if (chatData.chats) {
        _(chatData.chats).each(function(jid) {
          self.rooms.add(new Chachara.Room({ id: jid, type: "chat" }));
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
          _(views).each(function(view) {
            view.hide();
          });
          views[currentIndex].show();
        }
      });

      newView.bind("join", function(roomName) {
        self.client.join(roomName);
      });

      newView.bind("leave", function(roomName) {
        self.client.leave(roomName);
      });

      newView.bind("leave-chat", function(jid) {
        self.client.leaveChat(jid);
      });

      newView.bind("disconnect", function() {
        self.client.disconnect();
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

      this.messageHandler.bind("embedded", function(message){
        var fromParts = message.from.split("/");
        var fromRoom;

        if (message.type == "groupchat") {
          fromRoom = fromParts[0];
        } else if (message.type == "chat") {
          fromRoom = message.id;
        }

        if (fromRoom == room.id) {
          newView.displayEmbedly(message);
        }
      });

      this.client.bind("avatar", function(message){
        // Need to populate global participants and somehow link them to per-
        // room participants and update avatars appropriately
      });

      this.client.bind("groupchat", function(message) {
        self.addParticipant(message.from.split(/\//)[1]);

        if (message.room == room.id) {
          self.messageHandler.processEmbedded(message);
        }

        var body = self.messageHandler.processBody(message);
        newView.displayMessage(message, body);
      });

      this.client.bind("chat", function(message) {
        if (message.id == undefined) {
          message.id = message.from.split("/")[0];
        }

        if (message.from.split("/")[0] == room.id) {
          self.messageHandler.processEmbedded(message);
        }

        var body = self.messageHandler.processBody(message);
        newView.displayMessage(message, body);
      });

      this.client.bind("presence", function(message) {
        var fromParts   = message.from.split(/\//);
        var nick        = message.nick;
        var thisRoom    = self.rooms.get(fromParts[0]);

        // Ignore presences from rooms I left
        if (thisRoom === undefined) {
          return true;
        }

        var participant = thisRoom.participants.get(nick);
        var color = self.addParticipant(nick).get("color");

        // Per-room presence. Joined or exited
        if (message.show === "join-room" || message.show == "exit-room") {

          if (participant === undefined) {
            participant = new Chachara.Participant({
              id: nick,
              room: thisRoom,
              show: message.show,
              color: color
            });

            thisRoom.participants.add(participant);
          } else {
            participant.set({ show: message.show });
          }

          newView.displayPresence(message);

        // Global presence update, i.e. status updates
        } else {
          if (message.show == "offline") {
          } else {
            console.log("[XMPP] " + nick + " changed status to " + message.show);
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
      return newView;
    },

    addParticipant: function(nick) {
      var participant = this.participants.get(nick);

      if (participant === undefined) {
        participant = new Chachara.Participant({
          id: nick,
          color: this.randomColor()
        });

        this.participants.add(participant);
      }

      return participant;
    },

    enableNotifications: function(){
      var self = this;

      function permissionGranted(){
        self.useNotifications = "true";
        if (window.localStorage) {
          window.localStorage.setItem("useNotifications", "true");
        }
      }
      window.webkitNotifications.requestPermission(permissionGranted);
    },


    // Simple word matching, case insensitve
    getMentions: function(body) {
      var mentions = [];

      _.each(this.mentionMatchers, function(mention){
        var matches = body.match(mention);
        if (matches) {
          mentions.push(matches[0]);
        }
      });

      return mentions;
    },

    displayNotification: function(message) {
      if (window.webkitNotifications.checkPermission() == 0) {
        var mentioned = (this.getMentions(message.body).length > 0);

        if (mentioned && message.from.indexOf(this.nick) == -1 && this.useNotifications == "true"){
          var n = window.webkitNotifications.createNotification('', message.from, message.body);
          n.show();
          setTimeout(function() {
            n.cancel();
          }, 3000);
        }
      }
    },

    audioNotification: function(message){
      var mentioned = (this.getMentions(message.body).length > 0);

      if (!mentioned && this.messageSound.enabled == "true") {
        this.messageSound.source.play();
      } else if (mentioned && this.mentionSound.enabled == "true") {
        // If mentioned but itself, play regular sound
        if (message.from.indexOf(this.nick) == -1) {
          this.mentionSound.source.play();
        } else {
          this.messageSound.source.play();
        }
      }
    },

    resetMentionsTimeout: function() {
      var self = this;
      setTimeout(function(){
        self.messageSound.enabled = window.localStorage.getItem("audio-on-message") || "true";
        self.mentionSound.enabled = window.localStorage.getItem("audio-on-mention") || "true";
        self.useNotifications     = window.localStorage.getItem("useNotifications") || "true";
      }, 1000);
    },

    randomColor: function(){
      colors = [
        "#0000FF", "#0066FF", "#0099FF", "#00CCFF", "#00FFFF", "#00FF00",
        "#00FF33", "#00FF66", "#00FF99", "#00FFCC", "#FFFF00", "#FFFF33",
        "#FF6600", "#FF6633", "#FF6666", "#FF0000", "#FF0099", "#FF00FF",
        "#CC99FF", "#CC00FF", "#9900FF", "#990099", "#6600FF", "#FFFFFF"
      ]

      return colors[Math.round(Math.random() * colors.length)];
    }

  });
});
