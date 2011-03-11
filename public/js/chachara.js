var Chachara = {
  run: function() {
    var client = new Chachara.Client({
      host: window.location.hostname,
      port: window.location.port,
      useNotifications: false,
      sid: "chachara.sid"
    });

    new Chachara.Application({client:client});
    Backbone.history.start();
  }
}
