var Chachara = {
  run: function() {
    var client = new Chachara.Client({
      host: window.location.hostname,
      port: window.location.port,
      room: "test@conference.joy.yinkei.com",
      useNotifications: false,
      sid: "chachara.sid"
    });

    new Chachara.Application({client:client});
    Backbone.history.start();
  }
}
