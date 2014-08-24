angular.module('muviApp').service('session', ['ioSocket', function(ioSocket) {

  var constraints = {video: true};

  var localVideo = document.querySelector('#localVideo');
  var remoteVideo = document.querySelector('#remoteVideo');
  var localStream;
  var remoteStream;
  var pc;
  var callCompleted = false;
  var clientJoinedCallbacks = [];
  var callConnectedCallbacks = [];

  function fireEvent(ev, callbacks) {
    var arrayLength = callbacks.length;
    for (var i = 0; i < arrayLength; i++) {
      callbacks[i](ev);
    }
  }

  //sends a message to the server
  function sendMessage(message) {
    console.log('Client sending message: ', message);
    ioSocket.socket.emit('message', message);
  }

  //callback from getUserMedia - set up local video session
  function handleUserMedia(stream) {
    console.log('Got user media! Adding local stream.');
    localVideo.src = window.URL.createObjectURL(stream);
    localStream = stream;
  }



  ioSocket.socket.on('join', function (room) {
    console.log('Another peer made a request to join room ' + room);
    console.log('This peer is the initiator of room ' + room + '!');
    fireEvent('client joined', clientJoinedCallbacks);
  });




  /* RTC STUFF */

  function sendMessage(message) {
    console.log('Client sending message: ', message);
    ioSocket.socket.emit('message', message);
  }

  ioSocket.socket.on('message', function (message) {
    console.log('Client received message:', message);
    if (message.type === 'offer') {
      createPeerConnection();
      pc.setRemoteDescription(new RTCSessionDescription(message));
      pc.createAnswer(setLocalAndSendMessage);
    } else if (message.type === 'answer') {
      pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate') {
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
      });
      pc.addIceCandidate(candidate);
    } else if (message === 'bye') {
      hangup();
    }
  });

  function createPeerConnection() {
      pc = new RTCPeerConnection(null);
      pc.onicecandidate = gotIceCandidate;
      pc.onaddstream = handleRemoteStreamAdded;
      pc.oniceconnectionstatechange = handleIceConnectionStateChange;

      pc.addStream(localStream);
  }

  function call() {
    console.log("Starting call");
    createPeerConnection();
    pc.createOffer(setLocalAndSendMessage);
  }

  function setLocalAndSendMessage(description) {
    pc.setLocalDescription(description);
    console.log("Setting local: \n" + description.sdp);
    sendMessage(description);
  }

  function handleIceConnectionStateChange(ev) {
    if (callCompleted) {
      return;
    }

    if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
      fireEvent('connected', callConnectedCallbacks);
      callCompleted = true;
    }
  }

  function hangup() {
    if (pc != null) {
      console.log("Ending call");
      pc.close();
      pc = null;

      sendMessage('bye');
    }
  }

  function handleRemoteStreamAdded(event) {
    remoteVideo.src = URL.createObjectURL(event.stream);
    console.log("Received remote stream");
  }

  function gotIceCandidate(event) {
    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate});
    } else {
      console.log('End of candidates.');
    }
  }




  //exports ---->>>>>>>

	this.startLocalVideo = function(callback) {
    console.log('Making call to getUserMedia..');
    getUserMedia(constraints, function(stream) {
      handleUserMedia(stream);
      if (callback) callback();
    }, function(error) {
      console.log('getUserMedia error: ', error);
    });
  };

  this.createRoom = function(roomId, callback) {
    ioSocket.socket.emit('create-room', roomId, callback);
  };

  this.joinRoom = function(roomId, callback) {
    ioSocket.socket.emit('join-room', roomId, callback);
  };

  this.registerOnClientJoined = function(callback){
    clientJoinedCallbacks.push(callback);
  };

  this.makeCall = function() {
    //ensure room is set up
    call();
  };

  this.endCall = function () {
    hangup();
  };

  this.registerOnCallConnected = function(callback) {
    callConnectedCallbacks.push(callback);
  };

}]);