var static = require('node-static');
var http = require('http');
var file = new(static.Server)();

var port = process.argv[2] || process.env.OPENSHIFT_NODEJS_PORT || 8080  
  , ip = process.argv[3] || process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

var app = http.createServer(function (req, res) {
  file.serve(req, res);
}).listen(port, ip);

var io = require('socket.io').listen(app);
io.sockets.on('connection', function (socket) {

	function log(){
    console.log(Array.prototype.slice.call(arguments).join(''));
	}

	socket.on('message', function (message) {
		log('Got message: ', message);
    // For a real app, should be room only (not broadcast)
		socket.broadcast.emit('message', message);
	});

  socket.on('create-room', function (roomId, callback) {
    log('create-room recieved, with roomId of ', roomId);

    //ensure this is a new (empty) room
    var numClients = io.sockets.clients(roomId).length;
    if (numClients !== 0) {
      log('create-room error');
      if (callback) {
        callback('Room already exists.');
      }
      return;
    }

    //'join' the room, and inform the client
    socket.join(roomId);
    log('create-room success');
    if (callback) {
      callback();
    }
  });

  socket.on('join-room', function (roomId, callback) {
    log('join-room recieved, with roomId of ', roomId);

    //ensure that this room has been set up
    var numClients = io.sockets.clients(roomId).length;
    if (numClients !== 1) {
      log('join-room error');
      if (callback) {
        callback('Room is not waiting for clients to join.');
      }

      return;
    }

    //'join' the room, and inform the client
    socket.join(roomId);
    log('join-room success');
    if (callback) {
      callback();
    }

    //let all in the room know about the new joiner.
    socket.broadcast.to(roomId).emit('join');
  });
});

