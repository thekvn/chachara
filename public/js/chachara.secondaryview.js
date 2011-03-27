$(function() {
  Chachara.SecondaryView = Backbone.View.extend({
    initialize: function(options) {
      var self = this;

      _.bindAll(this, "render", "displayMessage");
      this.id = "#secondary-view";
      this.node = "#secondary-view";

      $(window).resize(function() {
        self.render();
      });
    },

    render: function() {
      $(this.node).height( Math.abs($("#app").height() - $("#chat-view-container").height())).scrollTop(99999);
    },

    displayPrivateMessage: function(message) {
      var fromParts = message.from.split("@");
      var name = fromParts[0]
      var body = message.body;

      $(this.node)
        .find("ul")
        .append("<li class='private-message'><b class='meta'><b class='name'>" + name + "</b></b><b class='msg'> " + body + "</b></li>");
        $(this.node).scrollTop(100000);
    },

    displayMessage: function(message) {
      var fromParts = message.from.split("/");
      var room = fromParts[0].split("@")[0];
      var name = fromParts[1];
      var body = message.processedBody;

      $(this.node)
        .find("ul")
        .append("<li><b class='meta'><b class='room'>#" + room + "</b> <b class='name'>" + name + "</b></b><b class='msg'> " + body + "</b></li>");
        $(this.node).scrollTop(100000);
    }
  });
});
