var express = require("express"),
    os   = require("os"),
    io   = require("socket.io"),
    connect = require('connect'),
    util = require("util");

var Client = require("./client.js");

function inspect(object){
  console.log(util.inspect(object, false, 10));
}

function log(object){
  console.log(object);
}

var app = express.createServer(
  express.cookieParser(),
  express.session({
    key: 'chachara.sid',
    secret: 'sekrit-chachara-js-*73$%#$',
    cookie: { httpOnly: false }
  })
);

app.configure(function(){
  app.set("views", __dirname + "/views");
  app.set("view options", {layout:false})
  app.use(express.static(__dirname + '/public' ));
});

app.get("/", function(req, res) {
  res.render("index.ejs");
});

if (os.hostname().match(/\w\.no\.de$/)) {
  app.listen(80);
} else {
  app.listen(8080);
}

var socket = io.listen(app),
    connections = {};

var handlers = ['onConnect', 'onAuth', 'onJoinRoom', 'onMessage'];
var events = {

  onConnect: function(xmppClient, callback){
    if (xmppClient.connection == null) {
      callback( { type:"connect-not-ok" } );
    } else {

      if (xmppClient.disconnectTimeout.timeout != undefined) {
        xmppClient.setStatus(
          xmppClient.cachedShow   || xmppClient.defaultShow,
          xmppClient.cachedStatus || xmppClient.defaultStatus
        );

        clearTimeout(xmppClient.disconnectTimeout.timeout);
        xmppClient.disconnectTimeout.timeout = null;

      } else if (xmppClient.awayTimeout.timeout != undefined) {
        clearTimeout(xmppClient.awayTimeout.timeout);
        xmppClient.awayTimeout.timeout = null;
      }

      var rooms = [];
      for (roomName in xmppClient.rooms) rooms.push(roomName);

      callback({
        type  : "connect-ok",
        rooms : rooms,
        chats : xmppClient.chats
      });

      Object.keys(xmppClient.rooms).forEach(function(roomName) {
        var room = xmppClient.rooms[roomName];

        // Send buffered lists for UI reconstruction
        room.buffer.forEach(function(m){
          callback(m);
        });

        room.participants.forEach(function(m){
          callback(m);
        });
      });
    }
  },

  onAuth: function(xmppClient, identifier, message, callback){
    xmppClient.connect(message.jid, message.password, function(err) {
      if (err) {
        callback( { type:"auth-not-ok" } );
      } else {
        connections[identifier] = xmppClient;
        callback( { type:"auth-ok" } );
      }
    });
  },

  onJoinRom: function(xmppClient, message, callback){
    xmppClient.join(message.room, function(room, websocket) {
      websocket.send({ type: "join-room-ok", room: room.name });

      room.on("message", function(websocket, msg) {
        msg.room = room.name;
        room.buffer.push(msg);
        if (room.buffer.length > room.bufferSize) {
          room.buffer.shift();
        }
        websocket.send(msg);
      });

      room.on("presence", function(websocket, msg) {
        room.participants.push(msg);
        websocket.send(msg);
      });

    });
  },

  onMessage: function(xmppClient, message, callback){
    if (message.type == "chat") {
      xmppClient.say(message.body, message.to, function() {
        callback({type:"message-ok"});
      });
    } else {
      xmppClient.rooms[message.room].say(message.body, function() {
        callback({type:"message-ok"});
      });
    }
  },

  onSetStatus: function(xmppClient, message){
    xmppClient.cachedShow   = message.show;
    xmppClient.cachedStatus = message.status;
    xmppClient.setStatus(message.show, message.status);
  }

}


socket.on('connection', function(client) {

  var xmppClient = null;
  var identifier = null;

  function getXmppClient(cookie){
    identifier = cookie || client.sessionId;

    // Renew the websocket assigned to the xmpp client
    if (connections[identifier]) {
      xmppClient = connections[identifier];
      xmppClient.websocket = client;
    } else {
      xmppClient = new Client(client);

      xmppClient.on("avatar", function(websocket, msg) {
        websocket.send(msg);
      });

      xmppClient.on("message", function(websocket, msg) {
        xmppClient.buffer.push(msg);
        if (xmppClient.buffer.length > xmppClient.bufferSize) {
          xmppClient.buffer.shift();
        }

        websocket.send(msg);
      });
    }
  }

  function sendMessage(message) {
    client.send(message);
  }

  client.on("message", function(message) {
    if (message.sid) getXmppClient(message.sid);

    switch(message.type) {
    case 'connect':
      events.onConnect(xmppClient, sendMessage);
      break;
    case 'auth':
      events.onAuth(xmppClient, identifier, message, sendMessage);
      break;
    case 'join-room':
      events.onJoinRom(xmppClient, message, sendMessage);
      break;
    case 'chat':
    case 'groupchat':
      events.onMessage(xmppClient, message, sendMessage);
      break;
    case 'set-status':
      events.onSetStatus(xmppClient, message);
      break;
    default:
      console.log("Unknown message received.");
    }
  });

  client.on("disconnect", function() {
    if (xmppClient != null && xmppClient.connection != null) {
      xmppClient.awayTimeout.timeout = setTimeout(function(){

        xmppClient.setStatus('xa', '');
        xmppClient.awayTimeout.timeout = null;
        xmppClient.disconnectTimeout.timeout = setTimeout(function(){

          xmppClient.disconnect();
          delete xmppClient;
          delete connections[identifier];

        }, xmppClient.disconnectTimeout.milliseconds);
      }, xmppClient.awayTimeout.milliseconds);
    }
  });

});
