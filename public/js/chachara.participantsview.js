$(function() {
  Chachara.ParticipantsView = Backbone.View.extend({
    initialize: function(options) {
      _(this).bindAll('addOne');

      this.participants = options.participants;
      this.participants.bind("add", this.addOne);
    },

    addOne: function(participant) {
      var view = new Chachara.ParticipantView({model:participant});
      this.$("ul").append(view.render().el);
    },
  });

});
