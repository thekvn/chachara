$(function() {
  Chachara.ParticipantView = Backbone.View.extend({
    tagName: 'li',
    initialize: function() {
      _(this).bindAll('render');
      this.model.bind("change", this.render);
      this.model.view = this;
    },
    render: function() {
      if (this.model.get("show") == "join-room") {
        $(this.el).show();
        $(this.el).html("<span class='name'>" + this.model.get('id') + "</span>")
      } else {
        $(this.el).html("");
        $(this.el).hide();
      }
      return this;
    }
  });
});
