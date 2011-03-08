var express = require("express"),
    io   = require("socket.io"),
    connect = require('connect'),
    util = require("util");

var Client = require("./client.js");

var MemoryStore = connect.session.MemoryStore;
var sessionStore = new MemoryStore();

var app = express.createServer(
  express.cookieParser(),
  express.session({
    store: sessionStore,
    secret: 'sekrit-chachara-js-*73$%#$'
  })
);

app.configure(function(){
  app.set("views", __dirname + "/views");
  app.set("view options", {layout:false})
  app.use(express.static(__dirname + '/public' ));
});

app.get("/", function(req, res) {
  // console.log(sys.inspect(req.headers));
  res.render("index.ejs");
});

app.listen(8080);

var socket = io.listen(app);
var clients = {};

socket.on('connection', function(client) {

  console.log(sys.inspect(client.request.headers));

  var xmppClient = new Client;

  client.on("message", function(message) {
    console.log(util.inspect(message, true, null));

    if (message.type == 'connect') {
      xmppClient.connect(message.jid, message.password, function() {
        client.send({type:"connect-ok"});
      });
    };

    if (message.type == "join-room") {

      xmppClient.join(message.room, function(room) {
        client.send({type:"join-room-ok"});

        room.on("message", function(m) {
          client.send(m);
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
    // TODO send presense info to server and disconnect
    xmppClient = null;
    delete xmppClient;
  });
});
