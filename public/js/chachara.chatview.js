$(function() {
  Chachara.ChatView = Backbone.View.extend({
    template: _.template($("#chat-view-template").html()),

    el: $("#app"),

    initialize: function(options) {
      _.bindAll(this, 'render');
    },

    render: function() {
      $(this.el).html(this.template());
    },

    displayMessage: function(message) {
      this.$(".primary-pane").append("<li><b>"+message.from+"</b> " + message.body + "</li>");
      this.$(".secondary-pane").append("<li><b>"+message.from+"</b> " + message.body + "</li>");
    }
  })
});
