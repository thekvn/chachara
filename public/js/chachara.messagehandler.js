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

Chachara.XkcdHandler = function(name) {
  this.name = name;
  this.regex = /^.*xkcd.com\/.*/;
}

Chachara.ImgurHandler = function(name) {
  this.name = name;
  this.regex = /^.*imgur.com\/.*/;
}

Chachara.SkitchHandler = function(name) {
  this.name = name;
  this.regex = /^.*skitch.com\/.*/;
}

Chachara.FlickrHandler = function(name) {
  this.name = name;
  this.regex = /^.*(flickr.com|flic.kr)\/.*/;
}

// Do more than fixing newlines .html() trick?
Chachara.Sanitizer = function(name) {
  this.name = name;
  this.updateBody = function(body) {  
    body = $("<div/>").text(body).html();
    body = body.replace(/ /g, '&nbsp;');
    body = body.replace(/\n/g, '<br>');
    return body;
  }
}

Chachara.UrlLinker = function(name) {
  this.name = name;
  this.updateBody = function(body) {
    var urlexp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return body.replace(urlexp, "<a href='$1' target='_blank'>$1</a>");
  }
}

Chachara.ActionMessage = function(name) {
  this.name = name;
  this.updateBody = function(body) {
    if (matches = body.match(/\/me\s(.*)/)) {
      return matches[1];
    } else {
      return body;
    }
  }  
}
