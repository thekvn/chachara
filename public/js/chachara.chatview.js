$(function() {
  Chachara.ChatView = Backbone.View.extend({
    template: _.template($("#chat-view-template").html()),
    events: {
      "keypress .chatinput": "onInput"
    },

    initialize: function(options) {
      _.bindAll(this, "render", "onInput", "displayMessage");

      this.id = "pane-" + options.room.split("@")[0];
      this.node = "#" + this.id;
    },

    render: function() {
      var template = $(this.template()).attr("id", this.id);
      $(this.el).append(template);

      $(this.node).find(".chatinput").focus();
      $(this.node).find(".primary-pane").append("<p>Joined " + this.options.room + "</p>")
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
    },
  })
});
