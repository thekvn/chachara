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

socket.on('connection', function(client) {

  var xmppClient = null;
  var identifier = null;

  function setXmppClient(cookie){
    identifier = cookie || client.sessionId;

    xmppClient = connections[identifier]
               ? connections[identifier]
               : new Client();
  }

  client.on("message", function(message) {

    if (message.type == 'connect') {
      setXmppClient(message.sid);

      if (xmppClient.connection == null) {
        client.send( { type:"connect-not-ok" } );
      } else {
        var rooms = [];
        for (roomName in xmppClient.rooms) {
          rooms.push(roomName);
        }

        client.send({
          type:"connect-ok",
          rooms: rooms
        });
      }
    }

    if (message.type == 'auth') {
      setXmppClient(message.sid);

      xmppClient.connect(message.jid, message.password, function(err) {
        if (err) {
          client.send( { type:"auth-not-ok" } );
        } else {
          connections[identifier] = xmppClient;
          client.send( { type:"auth-ok" } );
        }
      });
    }

    if (message.type == "join-room") {
      xmppClient.join(message.room, function(room) {
        // Send buffered lists for UI reconstruction
        room.buffer.forEach(function(m){
          client.send(m);
        });

        room.participants.forEach(function(m){
          client.send(m);
        });

        room.on("message", function(m) {
          m["type"] = "message";
          m["room"] = message.room;
          client.send(m);
          room.buffer.push(m);
          if (room.buffer.length > room.bufferSize) room.buffer.shift();
        })

        room.on("presence", function(m) {
          m["type"] = "presence";
          client.send(m);
          room.participants.push(m);
        })

      });
    }

    if (message.type == "message") {
      xmppClient.rooms[message.room].say(message.body, function() {
        client.send({type:"message-ok"});
      });
    }
  });

  client.on("disconnect", function() {
    if (xmppClient != null && xmppClient.connection != null) {
      // xmppClient.disconnect();
      // delete xmppClient;
      // delete connections[identifier];
    }
  });

});
