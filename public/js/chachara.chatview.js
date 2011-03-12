$(function() {
  Chachara.ChatView = Backbone.View.extend({
    template: _.template($("#chat-view-template").html()),

    initialize: function(options) {
      _.bindAll(this, "render", "onInput", "displayMessage");

      this.shortname = options.room.split("@")[0];
      this.id = "pane-" + this.shortname;
      this.node = "#" + this.id;
    },

    render: function() {
      var template = $(this.template()).attr("id", this.id);
      $(this.el).append(template);

      $(this.node).find("span.current").text("#"+this.shortname);
      $(this.node).find(".chatinput").keypress(this.onInput);
      $(this.node).find(".chatinput").focus();
      $(this.node).find(".primary-pane").append("<p>Joined " + this.options.room + "</p>")
    },

    show: function() {
      $(this.node).show();
      $(this.node).find(".primary-pane").scrollTop(100000);
      $(this.node).find(".secondary-pane").scrollTop(100000);
      $(this.node).find(".chatinput").focus();
    },

    hide: function() {
      $(this.node).hide();
    },

    displayPresence: function(data) {
      var fromParts = data.from.split("/");
      var room      = fromParts[0];
      var who       = fromParts[1];
      var status    = data.status

      if (this.options.room === room) {
        var userAction = (status == "online") ? "joined" : "left";
        $(this.node).find(".primary-pane")
           .append("<p class='presence'><b><span class='name'>" + who + "</span></b>" + userAction + " the room</p>")
           .scrollTop(100000);
      }
    },
    displayMessage: function(message) {
      var fromParts = message.from.split("/");
      var room = fromParts[0].split("@")[0];
      var name = fromParts[1];
      var body = $("<div/>").text(message.body).html();

      if (this.options.room === message.room) {
        $(this.node).find(".primary-pane")
          .append("<p><b><span class='name'>" + name + "</span></b>" + body + "</p>")
          .scrollTop(100000);
      }

      $(this.node)
        .find(".secondary-pane")
        .append("<p><b><span class='room'>#" + room + "</span> <span class='name'>" + name + "</span></b> " + body + "</p>")
        .scrollTop(100000);
    },

    onInput: function(e) {
      if (e.which == '13') {
        var str = $(e.target).val();
        if (str.length > 0) {
          var data = {
            type: "message",
            body: str,
            room: this.options.room
          };
          this.trigger("input", data);
          $(this.node).find(".chatinput").val("");
        }
      }

      if (e.ctrlKey && e.which == '44') { /* < */
        e.stopPropagation();
        this.trigger("prevpane", this);
      }

      if (e.ctrlKey && e.which == '46') { /* > */
        e.stopPropagation();
        this.trigger("nextpane", this);
      }
    },
  })
});
