var Chachara = {
  run: function() {
    var client = new Chachara.Client({
      host: window.location.hostname,
      port: window.location.port,
      useNotifications: false,
      sid: "chachara.sid"
    });

    var messageHandler = new Chachara.MessageHandler({
      handlers : [
        new Chachara.YoutubeHandler('youtube'),
        new Chachara.CloudAppHandler('cloudapp'),
        new Chachara.TwitterHandler('twitter'),
        new Chachara.InstagramHandler('instagram')
      ]
    });

    new Chachara.Application({
      client: client,
      messageHandler: messageHandler
    });

    Backbone.history.start();
  }
}
