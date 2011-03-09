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
  var elem = (new xmpp.Element('presence', { from: this.client.jid, to: this.name + '/' + this.client.nick }))
               .c('x', { xmlns:'http://jabber.org/protocol/muc' })
               .c('history', { 'maxchars': 0 });

  this.client.connection.send(elem);
}

Room.prototype.say = function $say$(what, callback) {
  // Send a message.
  var elem = (new xmpp.Element('message', { from: this.client.jid, to: this.name, type: 'groupchat' })
                .c('body')
                .t(what));
  this.client.connection.send(elem);
  callback();
}

// Server is not sending member list
Room.prototype.members = function $members$() {
  iqAttrs = {
    from: this.client.jid,
    id: this.client.nick,
    to: this.name,
    type: 'get'
  };

  var elem = (new xmpp.Element('iq', iqAttrs))
               .c('query', { xmlns:'http://jabber.org/protocol/muc#admin' })
               .c('item', { affiliation: 'member' });

  this.client.connection.send(elem);
}

Room.prototype.onMessage = function(stanza) {
  this.emit("message", {
    to:   stanza.attrs.to,
    from: stanza.attrs.from,
    body: stanza.getChild("body").getText()
  });
}

Room.prototype.onMember = function(stanza) {
  var status = stanza.attrs.type == "unavailable"
                              ? "offline"
                              : "online"

  this.emit("member", {
    to:     stanza.attrs.to,
    from:   stanza.attrs.from,
    nick:    stanza.attrs.from.split("/")[1],
    status: status
  });
}

module.exports = Room;
