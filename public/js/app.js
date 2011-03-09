$(function() {
  Chachara.run();
});


/*
// Notifications

function displayNotification(message) {
  if (window.webkitNotifications.checkPermission() == 0) {
    if (message.body.indexOf(nick) != -1 && message.from.indexOf(nick) == -1) {
      var n = window.webkitNotifications.createNotification('', message.from, message.body);
      n.show();
      setTimeout(function(){n.cancel()}, 5000);
    }
	}
}

function permissionGranted(){
  useNotifications = true;
}

function setAllowNotification(){
  window.webkitNotifications.requestPermission(permissionGranted);
}

*/