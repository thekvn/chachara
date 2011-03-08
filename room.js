var xmpp = require('node-xmpp'),
    util = require('util'),
    events = require('events');

function Room(client, name) {
  this.client = client;
  this.name = name;
}

Room.prototype = new events.EventEmitter;

// Join the channel.
Room.prototype.join = function $join$() {
  var elem = (new xmpp.Element('presence', { from: this.client.jid, to: this.name + '/' + this.client.nick }))
               .c('x', { xmlns:'http://jabber.org/protocol/muc' })
               .c('history', { 'maxchars': 0 });

  this.client.connection.send(elem);
}

Room.prototype.say = function $say$(what) {
  // Send a message.
  var elem = (new xmpp.Element('message', { from: this.client.jid, to: this.name, type: 'groupchat' })
                .c('body')
                .t(what));
  this.client.connection.send(elem);
}

Room.prototype.onMessage = function(stanza) {
  this.emit({
    to:stanza.attrs.to,
    from:stanza.attrs.from,
    body:stanza.getChild("body").getText()
  });
}

module.exports = Room;
