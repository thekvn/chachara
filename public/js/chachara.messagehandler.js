Chachara.MessageHandler = function(options) {
  options || (options ={});
  this.initialize(options);
}

_.extend(Chachara.MessageHandler.prototype, Backbone.Events, {
  initialize: function(options) {
    _.bindAll(this, "processMessage");
    this.options = options;
    this.handlers = options.handlers;
  },

  processMessage: function(message) {
    this.handlers.forEach(function(handler){
      handler.processMessage(message);
    });
  }

});

Chachara.YoutubeHandler = function(name) {
  this.name = name;
  this.regex = /^.*youtube.com\/watch[^v]+v.(.{11}).*/
}

Chachara.YoutubeHandler.prototype.processMessage = function(message) {
  message.html = message.html || '';

  var matches = this.regex.exec(message.body);
  if (matches) {
    html = this.replaceHtml(matches[1]);
    message.html += html;
  }
}

Chachara.YoutubeHandler.prototype.replaceHtml = function(videoId) {
  html  = "<iframe class='youtube-player' ";
  html += "type='text/html' width='640' height='385' ";
  html += "src='http://www.youtube.com/embed/" + videoId + "' ";
  html += "frameborder='0'></iframe>";
  return html;
}