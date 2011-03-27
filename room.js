var xmpp = require('node-xmpp'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

function Room(client, name) {
  this.client = client;
  this.name = name;
  this.buffer = [];
  this.bufferSize = 20;
  this.participants = [];
}


util.inherits(Room, EventEmitter);

// Join the channel.
Room.prototype.join = function $join$() {
  var elem = new xmpp.Element('presence', {
    from: this.client.jid,
    to: this.name + '/' + this.client.nick
  });

  elem.c('x', { xmlns:'http://jabber.org/protocol/muc' }).c('history', { 'maxchars': 0 });
  elem.c('show').t(this.client.defaultShow);
  elem.c('status').t(this.client.defaultStatus);

  this.client.connection.send(elem);
}

Room.prototype.showPresence = function(to) {
  var elem = new xmpp.Element('presence', {
    from: this.name + '/' + this.client.nick,
    to: to
  });

  elem.c('x', { xmlns:'http://jabber.org/protocol/muc#user' });
  elem.c('show').t(this.client.defaultShow);
  elem.c('status').t(this.client.defaultStatus);

  this.client.connection.send(elem);
}

Room.prototype.say = function $say$(what, callback) {
  // Send a message.
  var elem = new xmpp.Element('message', {
    from : this.client.jid,
    to   : this.name,
    type : 'groupchat'
  });

  elem.c('body').t(what);
  this.client.connection.send(elem);
  callback();
}

Room.prototype.onMessage = function(stanza) {
  this.emit("message", this.client.websocket, {
    type : "groupchat",
    to   : stanza.attrs.to,
    from : stanza.attrs.from,
    body : stanza.getChild("body").getText()
  });
}


// XMPP allows 4 'show' fields: chat, xa, away, dnd
// We add: join-room, exit-room and offline, so we can handle the presence
// message as a single message type for the websocket clients.

Room.prototype.onPresence = function(stanza) {

  var show   = null,
      status = '';
  var showNode   = stanza.getChild("show"),
      statusNode = stanza.getChild("status");

  // Unavailable can mean exited room or disconnected from server. When there
  // is a status node, it means that the client has disconnected from the server
  if (stanza.attrs.type == "unavailable") {
    show = (statusNode == undefined) ? "exit-room" : "offline";
  } else {
    // When show or status are not undefined, it means that the server sent a
    // presence status update and not a join room
    if (showNode != undefined) {
      show = showNode.getText();
      status = statusNode.getText();
    } else {
      show = "join-room"
    }

  }

  this.emit("presence", this.client.websocket, {
    type   : "presence",
    to     : stanza.attrs.to,
    from   : stanza.attrs.from,
    status : status,
    show   : show
  });
}

module.exports = Room;
