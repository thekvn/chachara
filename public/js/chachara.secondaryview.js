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

      body = this._replaceUrlWithLinks(body);
      body = body.replace(/\n/g, "<br/>");

      $(this.node)
        .find("ul")
        .append("<li><b class='meta'><b class='room'>#" + room + "</b> <b class='name'>" + name + "</b></b><b class='msg'> " + body + "</b></li>");
        $(this.node).scrollTop(100000);
    },

    _replaceUrlWithLinks:function(body) {
      var urlexp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
      return body.replace(urlexp, "<a href='$1'>$1</a>"); 
    }
  });
});
