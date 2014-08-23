angular.module('muviApp').service('session', ['ioSocket', function(ioSocket) {

  var constraints = {video: true};

  var localVideo = document.querySelector('#localVideo');
  var remoteVideo = document.querySelector('#remoteVideo');
  var localStream;
  var remoteStream;

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




  /* RTC STUFF */

  var sdpConstraints = {
    'mandatory': {
      'OfferToReceiveAudio': true,
      'OfferToReceiveVideo': true
    }
  };

  function sendMessage(message) {
    console.log('Client sending message: ', message);
    ioSocket.socket.emit('message', message);
  }

  var localPeerConnection, remotePeerConnection;

  function call() {
    console.log("Starting call");

    var servers = null;

    localPeerConnection = new RTCPeerConnection(servers);
    console.log("Created local peer connection object localPeerConnection");
    localPeerConnection.onicecandidate = gotLocalIceCandidate;

    remotePeerConnection = new RTCPeerConnection(servers);
    console.log("Created remote peer connection object remotePeerConnection");
    remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
    remotePeerConnection.onaddstream = gotRemoteStream;

    localPeerConnection.addStream(localStream);
    console.log("Added localStream to localPeerConnection");
    localPeerConnection.createOffer(gotLocalDescription);
  }

  function gotLocalDescription(description) {
    localPeerConnection.setLocalDescription(description);
    console.log("Offer from localPeerConnection: \n" + description.sdp);
    remotePeerConnection.setRemoteDescription(description);
    remotePeerConnection.createAnswer(gotRemoteDescription);
  }

  function gotRemoteDescription(description) {
    remotePeerConnection.setLocalDescription(description);
    console.log("Answer from remotePeerConnection: \n" + description.sdp);
    localPeerConnection.setRemoteDescription(description);
  }

  function hangup() {
    trace("Ending call");
    localPeerConnection.close();
    remotePeerConnection.close();
    localPeerConnection = null;
    remotePeerConnection = null;
    hangupButton.disabled = true;
    callButton.disabled = false;
  }

  function gotRemoteStream(event) {
    remoteVideo.src = URL.createObjectURL(event.stream);
    console.log("Received remote stream");
  }

  function gotLocalIceCandidate(event) {
    if (event.candidate) {
      remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
      console.log("Local ICE candidate: \n" + event.candidate.candidate);
    }
  }

  function gotRemoteIceCandidate(event) {
    if (event.candidate) {
      localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
      console.log("Remote ICE candidate: \n " + event.candidate.candidate);
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

  this.makeCall = function() {
    //ensure room is set up
    call();
  };

}]);