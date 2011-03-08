var sys = require("sys"),
   xmpp = require("node-xmpp"),
   Room = require("./room.js");

function Client() {
  this.connection = null;
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

  function onStanza(stanza) {
    if (stanza.attrs.type == "groupchat") {
      var fromParts = stanza.attrs.from.split('/');
      var room = fromParts[0];
      var nick = fromParts[1];

      // Dispatch message to appropriate room.
      if (self.rooms[room]) {
        self.rooms[room]['onMessage'] && self.rooms[room].onMessage(stanza);
      }
    }
  }

  // Connect to XMPP.
  Client.prototype.join = function(name, callback) {
    var room = this.rooms[name] = new Room (this, name);
    room.join();
    callback(room);
    return room;
  }

  Client.prototype.disconnect = function() {
    this.connection.send(new xmpp.Element('presence', {type: 'unavailable'})
                        .c('status').t('Logged out')
                        .tree());
    this.connection.end();
  }

  self.connection.on("error", function(err) {
    console.log(sys.inspect(err));
  });
};

module.exports = Client;
