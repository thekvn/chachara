Chachara.Client = function(options) {
  options || (options ={});
  this.initialize(options);
}

_.extend(Chachara.Client.prototype, Backbone.Events, {
  initialize: function(options) {
    this.options = options;

    this.socket = new io.Socket(options.host, { port: options.port});
    this.bindEvents();
    this.socket.connect();
  },
  bindEvents: function() {
    var self = this;

    self.log("Connecting...");

    this.socket.on('connect', function() {
      self.log("Connected...");
      self.trigger('connect');
    });

    this.socket.on('message', function(message) {
      self.log("Received [" + message.type + "]");
      self.trigger(message.type, message)
    });
  },

  log: function(msg) {
    console.log("[WS] " + msg);
  },

  authenticate: function(creds) {
    var data = creds;
    data["type"] = "connect"

    this.send(data);
  },

  join: function(room) {
    var data = {
      type:"join-room",
      room:room
    }
    this.send(data);
  },

  send: function(data) {
    this.log("[WS] " + data.type);
    this.socket.send(data);
  }
});
