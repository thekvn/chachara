$(function() {
  Chachara.Participant = Backbone.Model.extend({
    name: function() {
      return this.id;
    }
  });
})
