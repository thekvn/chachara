var util = require("util"),
   xmpp = require("node-xmpp"),
   Room = require("./room.js");

// Make client instances store a reference to its websocket client
function Client(websocket) {
  this.connection    = null;
  this.websocket     = websocket;
  this.defaultShow   = 'chat';
  this.defaultStatus = 'Cháchara';
  this.cachedShow    = null;
  this.cachedStatus  = null;

  // Testing mode, few seconds!
  this.awayTimeout = {
    milliseconds: 5000,
    timeout: null
  };

  this.disconnectTimeout = {
    milliseconds: 30000,
    timeout: null
  };
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

  self.setStatus = function (show, status) {
    var elem = new xmpp.Element('presence');
    elem.c('show').t(show);
    elem.c('status').t(status);
    self.connection.send(elem);
  };

  function onOnline() {
    self.connection.on('stanza', onStanza);
    self.setStatus(self.defaultShow, self.defaultStatus);

    if (callback != undefined) {
      callback();
    }
  }

  // TODO refactor
  function onStanza(stanza) {

    if (stanza.name == "message") {

      if (stanza.attrs.type == "groupchat") {
        var fromParts = stanza.attrs.from.split('/');
        var room = fromParts[0];
        var nick = fromParts[1];

        // Dispatch message to appropriate room.
        if (self.rooms[room]) {
          self.rooms[room]['onMessage'] && self.rooms[room].onMessage(stanza);
        }
      } else if (stanza.attrs.type == "chat") {
        // Implement private messages
        console.log("message!");
        console.log(util.inspect(stanza, false, 10));
      }

    } else if (stanza.name == "presence") {
      var fromParts = stanza.attrs.from.split('/');
      var room = fromParts[0];
      var nick = fromParts[1];

      if (self.rooms[room]) {
        self.rooms[room]['onPresence'] && self.rooms[room].onPresence(stanza);
      }

    } else if (stanza.name == "iq") {
      console.log(util.inspect(stanza, false, 10));
      // Handle iqs in the near future
    }
  }

  function onAuthFailure(){

  }

  // Connect to XMPP.
  Client.prototype.join = function(name, callback) {
    // No strict checking at the moment
    this.rooms[name] = new Room(this, name);
    this.rooms[name].join();
    callback(this.rooms[name], this.websocket);
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
    console.log(util.inspect(err));
  });
};

module.exports = Client;
