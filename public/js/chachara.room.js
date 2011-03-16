$(function() {
  Chachara.Room = Backbone.Model.extend({
    initialize:function() {
      this.participants = new Chachara.Participants();
    }
  });
});
