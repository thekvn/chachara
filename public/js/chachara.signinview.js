$(function() {
  Chachara.SigninView = Backbone.View.extend({
    template: _.template($("#signin-view-template").html()),
    el:       $("#app"),

    initialize: function(options) {
      _.bindAll(this, 'render');
    },

    events: { 
      "click button.connect": "onConnect"
    },

    onConnect: function(e) {
      var data = {
        jid     : this.$(".jid").val(),
        password: this.$(".password").val()
      }
      this.trigger("connect", data);
      return false;
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
      this.$("sign-in-view").remove();
    }
  });
});
