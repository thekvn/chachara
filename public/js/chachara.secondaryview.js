$(function() {
  Chachara.SecondaryView = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, "render", "displayMessage");
      this.id = "#secondary-view";
      this.node = "#secondary-view";
    },

    render: function() {
    },

    displayMessage: function(message) {
      var fromParts = message.from.split("/");
      var room = fromParts[0].split("@")[0];
      var name = fromParts[1];
      var body = $("<div/>").text(message.body).html();

      body = body.replace(/\n/g, "<br/>");
      body = body.replace(/\s/g, "&nbsp;");

      $(this.node)
        .find("ul")
        .append("<li><b class='meta'><b class='room'>#" + room + "</b> <b class='name'>" + name + "</b></b><b class='msg'> " + body + "</b></li>");
      $(this.node).scrollTop(100000);
   },
  });
});
