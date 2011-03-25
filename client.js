var util = require("util"),
    xmpp = require("node-xmpp"),
    Room = require("./room.js"),
    EventEmitter = require('events').EventEmitter;

// Make client instances store a reference to its websocket client
function Client(websocket) {
  this.connection    = null;
  this.websocket     = websocket;
  this.defaultShow   = 'chat';
  this.defaultStatus = 'Cháchara';
  this.cachedShow    = null;
  this.cachedStatus  = null;
  this.buffer = [];
  this.bufferSize = 20;

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

util.inherits(Client, EventEmitter);

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
        self.onMessage(stanza);
      }

    } else if (stanza.name == "presence") {

      if (stanza.getChild('x') !== undefined && stanza.getChild('x').getChild('photo') !== undefined) {
        self.onAvatarAvailable(stanza);
      } else {
        var fromParts = stanza.attrs.from.split('/');
        var room = fromParts[0];
        var nick = fromParts[1];

        if (self.rooms[room]) {
          self.rooms[room]['onPresence'] && self.rooms[room].onPresence(stanza);
        }
      }

    } else if (stanza.name == "iq") {
      if (stanza.attrs.id == "v3") {
        self.onAvatar(stanza);
      }
    }
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


  Client.prototype.onAvatarAvailable = function(stanza) {
    var elem = new xmpp.Element("iq", {
      type : "get",
      from : self.jid,
      to   : stanza.attrs.from.split("/")[0],
      id   : "v3"
    });
    elem.c("vCard", { xmlns : "vcard-temp" });
    self.connection.send(elem);
  }

  Client.prototype.onAvatar = function(stanza) {
    var vCardNode = stanza.getChild("vCard");
    if (vCardNode === undefined) return false;

    var photoNode = vCardNode.getChild("PHOTO");
    if (photoNode === undefined) return false;

    self.emit("avatar", self.websocket, {
      type     : 'avatar',
      from     : stanza.attrs.from,
      fileType : photoNode.getChild("TYPE").getText(),
      binval   : photoNode.getChild("BINVAL").getText().split("\n").join("")
    });
  }

  Client.prototype.onMessage = function(stanza) {
    if (stanza.getChild("body") == undefined) {
      console.log("It's gonna crash!");
      console.log(util.inspect(stanza, false, 10));
    }

    this.emit("message", this.websocket, {
      type : "chat",
      to   : stanza.attrs.to,
      from : stanza.attrs.from,
      body : stanza.getChild("body").getText()
    });
  }
};

module.exports = Client;
