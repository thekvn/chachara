var Chachara = {
  run: function() {
    var client = new Chachara.Client({
      host: window.location.host.split(":")[0],
      port: window.location.port,
      useNotifications: false,
      sid: "chachara.sid"
    });

    var messageHandler = new Chachara.MessageHandler({
      embedHandlers : [
        new Chachara.YoutubeHandler('youtube'),
        new Chachara.CloudAppHandler('cloudapp'),
        new Chachara.TwitterHandler('twitter'),
        new Chachara.InstagramHandler('instagram'),
        new Chachara.XkcdHandler('XKCD'),
        new Chachara.ImgurHandler("imgur.com"),
        new Chachara.SkitchHandler("skitch"),
        new Chachara.FlickrHandler("flickr")
      ],
      bodyHandlers : [
        new Chachara.Sanitizer("Body Sanitizer"),
        new Chachara.UrlLinker('URL Linker - Replaces URLs with links'),
        new Chachara.ActionMessage('Handles /me messages')
      ]
    });

    window.chachara = new Chachara.Application({
      client: client,
      messageHandler: messageHandler
    });

    Backbone.history.start();
  }
};
