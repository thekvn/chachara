$(function() {
  Chachara.ChatView = Backbone.View.extend({
    template: _.template($("#chat-view-template").html()),

    el: $("#app"),
    events: {
      "keypress .chatinput": "onInput"
    },

    initialize: function(options) {
      _.bindAll(this, "render", "onInput");
    },

    render: function() {
      $(this.el).html(this.template());
      this.$(".chatinput").focus();
    },

    displayMessage: function(message) {
      var fromParts = message.from.split("/");
      var room = fromParts[0].split("@")[0];
      var name = fromParts[1];
      var body = $("<div/>").text(message.body).html();

      this.$(".primary-pane")
        .append("<p><b><span class='name'>" + name + "</span></b>" + body + "</p>")
        .scrollTop(100000);

      this.$(".secondary-pane")
        .append("<p><b><span class='room'>" + room + "</span> <span class='name'>" + name + "</span></b> " + body + "</p>")
        .scrollTop(100000);
    },

    onInput: function(e) {
      if (e.which == '13') {

        var str = this.$(".chatinput").val();

        if (str.length > 0) {
          var data = {
            type: "message",
            body: str,
            room: this.options.room
          };

          this.trigger("input", data);

          this.$(".chatinput").val("");
        }
      }
    },
  })
});
