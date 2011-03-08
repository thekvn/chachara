var socket = new io.Socket("127.0.0.1", {port:8080});
// TODO support multiple rooms
var room = null;

socket.connect();

socket.on('connect', function() {
  console.log("connected...");
  document.getElementById('signin').style.display = 'block';
});

socket.on('message', function(message) {
  console.log(message);

  if (message.type == 'connect-ok') {
    room = document.getElementById('room').value;

    socket.send({
      type: 'join-room',
      room: room
    });

    document.getElementById('signin').innerHTML = '';
    document.getElementById('chat').innerHTML = '';
    document.getElementById('form').style.display='block';

  } else if (message.from == room) {
    renderAnnouncement(message);
  } else if (message.body) {
    renderMessage(message);
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