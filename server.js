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

        // Trying to authenticate for the first time
        if (message.jid != undefined) {
          xmppClient.connect(message.jid, message.password, function() {
            connections[identifier] = xmppClient;
            client.send( { type:"connect-ok" } );
          });

        // Trying to reconnect but there is no connection
        } else {
          client.send( { type:"connect-not-ok" } );
        }

      } else {
        // Got existing connection
        client.send( { type:"connect-ok" } );
      }
    }

    if (message.type == "join-room") {
      if (xmppClient.rooms[message.room]) {
        var room = xmppClient.rooms[message.room];
        room.on("message", function(m) {
          m["type"] = "message";
          client.send(m);
          room.buffer.push(m);
          if (room.buffer.length > room.bufferSize) room.buffer.shift();
        })
        while ((m = room.buffer.shift()) != undefined){
          client.send(m);
        }

      } else {
        xmppClient.join(message.room, function(room) {
          room.members();
          client.send( { type: "join-room-ok" } );

          room.on("message", function(m) {
            m["type"] = "message";
            client.send(m);
            room.buffer.push(m);
            if (room.buffer.length > room.bufferSize) room.buffer.shift();
          })

          room.on("member", function(m) {
            // Placeholder
            // I need to send status updates to the websocket client
            if (m.status == "offline") {
              console.log(m.nick + " just got offline");
            } else {
              console.log(m.nick + " just got online");
            }
          })
        });
      }
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
