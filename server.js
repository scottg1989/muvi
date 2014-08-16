var static = require('node-static');
var http = require('http');
var file = new(static.Server)();

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080  
, ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

var app = http.createServer(function (req, res) {
  file.serve(req, res);
}).listen(port, ip);

var io = require('socket.io').listen(app);
io.sockets.on('connection', function (socket){

	function log(){
		var array = [">>> Message from server: "];
	  for (var i = 0; i < arguments.length; i++) {
	  	array.push(arguments[i]);
	  }
	    socket.emit('log', array);
	}

	socket.on('message', function (message) {
		log('Got message: ', message);
    // For a real app, should be room only (not broadcast)
		socket.broadcast.emit('message', message);
	});

	socket.on('create or join', function (room) {
		var numClients = io.sockets.clients(room).length;

		log('Room ' + room + ' has ' + numClients + ' client(s)');
		log('Request to create or join room', room);

		if (numClients == 0){
			socket.join(room);
			socket.emit('created', room);
		} else if (numClients == 1) {
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.emit('joined', room);
		} else { // max two clients
			socket.emit('full', room);
		}
		socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
		socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);

	});

	socket.on('fileChosen', function (filename) {
		socket.broadcast.emit('fileChosen', filename);
	});

  socket.on('acceptFile', function () {
		socket.broadcast.emit('acceptFile');
		setTimeout(function () {
			io.sockets/*.in(room)*/.emit('playVideo');
		}, 1000);
  });

  socket.on('triggerPlayVideo', function () {
  	socket.broadcast.emit('playVideo');
  });

  socket.on('triggerPauseVideo', function () {
		socket.broadcast.emit('pauseVideo');
  });

  socket.on('triggerSeekVideo', function (newTime) {
  	socket.broadcast.emit('seekVideo', newTime);
  })

});

