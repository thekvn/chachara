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
      this.$(".primary-pane")
        .append("<p><b>"+message.from.split("/")[1]+"</b> " + message.body + "</p>")
        .scrollTop(100000);

      this.$(".secondary-pane")
        .append("<p><b>"+message.from.split("/")[1]+"</b> " + message.body + "</p>")
        .scrollTop(100000);
    },

    onInput: function(e) {
      if (e.which == '13') {

        var str = this.$(".chatinput").val();

        if (str.length > 0) {
          var data = {
            type: "message",
            body: str,
            room: "test@conference.joy.yinkei.com"
          };

          this.trigger("input", data);
          this.$(".chatinput").val("");
        }
      }
    },
  })
});
