var sys = require("sys"),
   xmpp = require("node-xmpp"),
   Room = require("./room.js");

// Make client instances store a reference to its websocket client
function Client(websocket) {
  this.connection = null;
  this.websocket  = websocket;
}

Client.prototype.connect = function(jid, password, callback) {
  var self = this;

  self.jid      = jid;
  self.nick     = jid.split("@")[0];
  self.password = password;

  self.connection = new xmpp.Client({
    nick: self.nick,
    jid : self.jid + "/webapp",
    password : self.password
  });

  self.rooms = {};

  self.connection.on('online', onOnline);

  self.connection.on('error', function(e) {
    if (e == 'XMPP authentication failure') callback(e);
    else console.log(e);
  });

  function onOnline() {
    self.connection.on('stanza', onStanza);

    var elem = (
      new xmpp.Element('presence', { type: 'chat'})
    ).c('show').t('chat')
      .up()
      .c('status').t('Happily echoing your <message/> stanzas');
    self.connection.send(elem);

    if (callback != undefined) {
      callback();
    }
  }

  // TODO refactor
  function onStanza(stanza) {
    if (stanza.attrs.type == "groupchat") {
      var fromParts = stanza.attrs.from.split('/');
      var room = fromParts[0];
      var nick = fromParts[1];

      // Dispatch message to appropriate room.
      if (self.rooms[room]) {
        self.rooms[room]['onMessage'] && self.rooms[room].onMessage(stanza);
      }
    } else if (stanza.name == "presence") {
      var fromParts = stanza.attrs.from.split('/');
      var room = fromParts[0];
      var nick = fromParts[1];

      if (self.rooms[room]) {
        self.rooms[room]['onPresence'] && self.rooms[room].onPresence(stanza);
      }
    }
  }

  function onAuthFailure(){

  }

  // Connect to XMPP.
  Client.prototype.join = function(name, callback) {
    // No strict checking at the moment
    this.rooms[name] = new Room(this, name);
    this.rooms[name].join();
    callback(this.rooms[name]);
  }

  Client.prototype.disconnect = function() {
    if (this.connection) {
      this.connection.send(new xmpp.Element('presence', {type: 'unavailable'})
                          .c('status').t('Logged out')
                          .tree());
      this.connection.end();
    }
  }

  self.connection.on("error", function(err) {
    console.log(sys.inspect(err));
  });
};

module.exports = Client;
