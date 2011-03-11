$(function() {
  Chachara.SigninView = Backbone.View.extend({
    template: _.template($("#signin-view-template").html()),
    el:       $("#app"),

    initialize: function(options) {
      _.bindAll(this, 'render');
    },

    events: {
      "click button.connect": "submit"
    },

    submit: function(e) {
      e.preventDefault();

      var data = {
        jid:      this.$(".jid").val(),
        password: this.$(".password").val(),
        rooms:    this.$(".rooms").val().split(",")
      }
      this.trigger("submit", data);
    },

    render: function() {
      var dom = $(this.template());

      $(this.el).html(dom);

      dom.css("position", "relative")
         .css("top", (($(window).height() - dom.height())/2) +"px")
         .find("input:first").focus();

      return this;
    },

    dismiss: function() {
      this.$(".signin-view").remove();
    }
  });
});
