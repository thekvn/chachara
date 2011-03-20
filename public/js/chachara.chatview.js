$(function() {
  Chachara.ChatView = Backbone.View.extend({
    template: _.template($("#chat-view-room-template").html()),

    initialize: function(options) {
      _.bindAll(this, "render", "onInput", "displayMessage");
      this.room = options.room;
      this.app = options.app;

      this.id = "pane-" + this.room.shortname();
      this.node = "#" + this.id;

      this.participantsView = new Chachara.ParticipantsView({
        participants: this.room.participants,
      });
    },

    render: function() {
      var template = $(this.template()).attr("id", this.id);
      $(this.el).append(template);
      this.participantsView.el = $(this.node).find(".participants-pane");

      $(this.node).find("span.current").text("#"+this.room.shortname());
      $(this.node).find(".chatinput").keypress(this.onInput);
      $(this.node).find(".chatinput").focus();
      $(this.node).find(".primary-pane ul").append("<li>Joined " + this.options.room.id + "</li>")
    },

    show: function() {
      $(this.node).show();
      $(this.node).find(".primary-pane").scrollTop(100000);
      $(this.node).find(".participants-pane").scrollTop(100000);
      $(this.node).find(".chatinput").focus();
    },

    hide: function() {
      $(this.node).hide();
    },

    displayPresence: function(data) {
      var fromParts = data.from.split("/");
      var room      = fromParts[0];
      var who       = fromParts[1];
      var action    = data.show;

      if (this.room.id === room) {
        var userAction = (action == "join-room") ? "joined" : "left";
        $(this.node)
          .find(".primary-pane ul")
          .append("<li class='presence'><b class='meta'><span class='name'>" + who + "</span></b><b class='msg'>" + userAction + " the room</b></li>");
        $(this.node).find(".primary-pane").scrollTop(10000);
      }
    },

    displayMessage: function(message) {
      var fromParts = message.from.split("/");
      var room = fromParts[0].split("@")[0];
      var name = fromParts[1];
      var html = message.html;

      var ul = $(this.node).find(".primary-pane ul");

      var body = $("<div/>").text(message.body).html();
      body = body.replace(/\n/g, "<br/>");

      if (this.room.id === message.room) {
        if (matches = body.match(this.app.mentionMatcher)) {
          body = body.replace(matches[0], "<em>" + matches[0] + "</em>");
          ul.append("<li class='mention'><b class='meta'><b class='name'>" + name + "</b></b><b class='msg'>" + body + "</b></li>");
        } else {
          ul.append("<li><b class='meta'><b class='name'>" + name + "</b></b><b class='msg'>" + body + "</b></li>");
        }

        if (message.html) {
          ul.append("<li><b class='meta'><b class='name'>" + name + "</b></b><b class='msg'>" + html + "</b></li>");
        }

        $(this.node).find(".primary-pane").scrollTop(100000);
      }

      // $(this.node)
      //   .find(".secondary-pane ul")
      //   .append("<li><b class='room'>#" + room + "</b> <b class='name'>" + name + "</b><b class='msg'> " + body + "</b></li>")
      //   .scrollTop(100000);
    },

    displayEmbedly: function(message) {
      var fromParts = message.from.split("/");
      var room = fromParts[0].split("@")[0];
      var name = fromParts[1];
      var html = message.html;

      if (this.room.id === message.room) {
        $(this.node).find(".primary-pane ul").append("<li><b class='meta'><b class='name'>" + name + "</b></b><b class='msg embed'>" + html + "</b></li>");
        $(this.node).find(".primary-pane").scrollTop(10000);
      }
    },

    updateParticipants: function(presence) {
      var fromParts = presence.from.split("/");
      var room      = fromParts[0];
      var who       = fromParts[1];
      var status    = presence.status
    },

    onInput: function(e) {
      // Prevpane
      if (e.ctrlKey && e.which == '44') { /* < */
        this.trigger("prevpane", this);
      }

      // Nextpane
      if (e.ctrlKey && e.which == '46') { /* > */
        e.stopPropagation();
        this.trigger("nextpane", this);
      }

      // Submit message
      if (e.which == '13') {
        var str = $(e.target).val();
        var matches;

        // Match /join
        if (matches = str.match(/^\/join\s(.*)/)) {
          var roomName = matches[1];
          var roomJid = [roomName, this.room.domain()].join("@");

          if (this.app.rooms.get(roomJid) == undefined) {
            this.trigger("join", roomJid);
            $(this.node).find(".chatinput").val("");
            return true;
          } else {
            console.log("Already Joined Room")
            return;
          }
        }

        // Match #room
        else if (matches = str.match(/^#([a-z0-9]+)\s(.*)$/)) {
          var want = matches[1];
          var msg = matches[2];

          var roomMatcher = new RegExp("^"+want+"@.*$");
          var result = this.app.rooms.filter(function(room) {
            return room.get("id").match(roomMatcher);
          });
          var room = result[0];
          var data = {
            type:"message",
            body: msg,
            room: room.get("id")
          };
          this.trigger("input", data);
          $(this.node).find(".chatinput").val("");
          return true;
        }

        // Match /status
        else if (matches = str.match(/^\/status\s(chat|xa|dnd)(\s?.*)$/)) {

          if (matches == undefined) {
            console.log("Unrecognized status")
            return;
          } else {
            var data = {
              type   :"set-status",
              show   : matches[1],
              status : $.trim(matches[2])
            };

            this.trigger("input", data);
            $(this.node).find(".chatinput").val("");
            return true;
          }
        }

        if (str.length > 0) {
          var data = {
            type: "message",
            body: str,
            room: this.room.id
          };
          this.trigger("input", data);
          $(this.node).find(".chatinput").val("");
        }
      }
    }
  })
});
