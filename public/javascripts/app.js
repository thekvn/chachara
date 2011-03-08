var socket = new io.Socket("127.0.0.1", { port: 8080 });
// TODO support multiple rooms
var room = null;
var jid = null;
var nick = null;
var useNotifications = false;

socket.connect();

socket.on('connect', function() {
  console.log("connected...");
  console.log("cookie...");
  console.log(document.cookie);
  document.getElementById('signin').style.display = 'block';
});

socket.on('message', function(message) {
  console.log(message);

  if (message.type == 'connect-ok') {
    room = document.getElementById('room').value;
    jid = document.getElementById('jid').value;
    nick = jid.split("@")[0];

    socket.send({
      type: 'join-room',
      room: room
    });

    document.getElementById('signin').innerHTML = '';
    document.getElementById('chat').innerHTML = '';
    document.getElementById('form').style.display='block';

  } else if (message.type == "set-cookie") {
    setCookie(message.name, message.value);
  } else if (message.from == room) {
    renderAnnouncement(message);
  } else if (message.body) {
    renderMessage(message);
    if (useNotifications) displayNotification(message);
  }
});

socket.on('disconnect', function(){
  console.log("disconnected...");
});

function connect(){
  var jid = document.getElementById('jid').value,
      password = document.getElementById('password').value;

  document.getElementById('chat').style.display = 'block';
  document.getElementById('signin').style.display = 'none';
  socket.send({
    type: 'connect',
    jid: jid,
    password: password
  });
}

function send(){
  var text = document.getElementById('text').value;
  socket.send({
    type: 'message',
    room: room,
    body: text
  });

  document.getElementById('text').value = '';
}

function renderMessage(message){
  var el = document.createElement('p');
  el.innerHTML = '<b>' + message.from.split("/")[1] + ':</b> ' + message.body;

  document.getElementById('chat').appendChild(el);
  document.getElementById('chat').scrollTop = 1000000;
}

function renderAnnouncement(message){
  var el = document.createElement('p');
  el.innerHTML = '<em>' + message.body + '</em>';

  document.getElementById('chat').appendChild(el);
  document.getElementById('chat').scrollTop = 1000000;
}



// Notifications

function displayNotification(message) {
  if (window.webkitNotifications.checkPermission() == 0) {
    if (message.body.indexOf(nick) != -1) {
      var n = window.webkitNotifications.createNotification('', message.from, message.body);
      n.show();
    }
	}
}

function permissionGranted(){
  useNotifications = true;
}

function setAllowNotification(){
  window.webkitNotifications.requestPermission(permissionGranted);
}
