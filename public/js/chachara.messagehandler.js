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

  embeddable: function(regex, body) {
    var matches = regex.exec(body);
    return (matches != null) ? true : false;
  },

  url: function(body) {
    var regex = /((http|https):\/\/(\S*?\.\S*?))(\s|\;|\)|\]|\[|\{|\}|,|\"|'|:|\<|$|\.\s)/;
    return regex.exec(body)[0];
  },

  processMessage: function(message) {
    var self = this;
    var embeddable = false;

    for (var i = 0; i < this.handlers.length; i++) {
      if (this.embeddable(this.handlers[i].regex, message.body)) {
        $.embedly(this.url(message.body),
          { maxWidth : 800, maxHeight: 500,
            success  : function(oembed, dict) {
              console.log(oembed);
              if (oembed.html5)     message.html = oembed.html5;
              else if (oembed.html) message.html = oembed.html;
              else                  message.html = oembed.code;
              self.trigger("embedded", message);
        }});
      }
    }
  }

});

Chachara.YoutubeHandler = function(name) {
  this.name = name;
  this.regex = /^.*youtube.com\/watch[^v]+v.(.{11}).*/;
}

Chachara.CloudAppHandler = function(name) {
  this.name = name;
  this.regex = /^.*cl.ly\/.*/;
}

Chachara.TwitterHandler = function(name) {
  this.name = name;
  this.regex = /^.*twitter.com\/.*\/status\//;
}

Chachara.InstagramHandler = function(name) {
  this.name = name;
  this.regex = /^.*instagr.am\/p\/.*/;
}