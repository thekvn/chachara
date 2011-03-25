Chachara.MessageHandler = function(options) {
  options || (options ={});
  this.initialize(options);
}

_.extend(Chachara.MessageHandler.prototype, Backbone.Events, {
  initialize: function(options) {
    _.bindAll(this, "processMessage");
    this.options = options;
    this.embedHandlers = options.embedHandlers;
    this.bodyHandlers = options.bodyHandlers;    
  },

  embeddable: function(regex, body) {
    var matches = regex.exec(body);
    return (matches != null) ? true : false;
  },

  url: function(body) {
    var regex = /((http|https):\/\/(\S*?\.\S*?))(\s|\;|\)|\]|\[|\{|\}|,|\"|'|:|\<|$|\.\s)/;
    return regex.exec(body)[0];
  },
  
  processEmbedded: function(message) {
    var self = this;

    for (var i = 0; i < this.embedHandlers.length; i++) {
      if (this.embeddable(this.embedHandlers[i].regex, message.body)) {
        $.embedly(this.url(message.body),
          { maxWidth : 800, maxHeight: 500,
            success  : function(oembed, dict) {
              console.log(oembed);
              if (oembed.html) message.html = oembed.html;
              else             message.html = oembed.code;
              self.trigger("embedded", message);
        }});
      }
    }
  },
  
  processBody: function(message) {
    var self = this;
    var body = message.body;
    
    _.each(this.bodyHandlers, function(handler){
      body = handler.updateBody(body);
    });
    
    return body;
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

// Do more than fixing newlines .html() trick?
Chachara.Sanitizer = function(message) {
  this.name = name;
  this.updateBody = function(body) {  
    body = $("<div/>").text(body).html();
    return body.replace(/\n/g, "<br/>");
  }
}

Chachara.UrlLinker = function(name) {
  this.name = name;
  this.updateBody = function(body) {
    var urlexp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return body.replace(urlexp, "<a href='$1' target='_blank'>$1</a>");
  }
}