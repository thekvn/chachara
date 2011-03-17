$(function() {
  Chachara.Room = Backbone.Model.extend({
    initialize:function() {
      _(this).bindAll("shortname");
      this.participants = new Chachara.Participants();
    },
    shortname: function() {
      return this.id.split("@")[0];
    }
  });
});
