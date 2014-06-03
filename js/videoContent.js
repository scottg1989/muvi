/*globals window, alert*/

(function (win, _$) {
  'use strict';

  var windowState_notChosen = 'notChosen';
  var windowState_chooseSame = 'chooseSame';
  var windowState_waitingAcceptance = 'waitingAcceptance';
  var windowState_awaitPlay = 'awaitPlay';

  var ignorePlayEvent = false;
  var ignorePauseEvent = false;
  var ignoreSeekEvent = false;

  window.app.videoState = windowState_notChosen;

  function log(message) {
    var date = new Date();
    console.log('[' + date.toLocaleDateString() + ' ' + date.toLocaleTimeString() + '] ' + message);
  }

  window.app.socket.on('fileChosen', function (filename) {
    log('Received fileChosen');
    alert(filename);
    window.app.videoState = windowState_chooseSame;
  });

  window.app.socket.on('acceptFile', function () {
    log('Received acceptFile');
    window.app.videoState = windowState_awaitPlay;
  });

  window.app.socket.on('playVideo', function () {
    log('Received playVideo');
    ignorePlayEvent = true;
    document.querySelector('#mainVideo').play();
  });

  window.app.socket.on('pauseVideo', function () {
    log('Received pauseVideo');
    ignorePauseEvent = true;
    document.querySelector('#mainVideo').pause();
  });

  window.app.socket.on('seekVideo', function (newTime) {
    log('Received seekVideo');
    ignoreSeekEvent = true;
    document.querySelector('#mainVideo').currentTime = newTime;
  });

  var video = _$('#mainVideo');

  video.on("play", function () {
    log('mainVideo.play fired, ignoring:' + (ignorePlayEvent ? 'yes' : 'no'));
    if (!ignorePlayEvent) {
      window.app.socket.emit('triggerPlayVideo');
    }

    ignorePlayEvent = false;
  });

  video.on("pause", function () {
    log('mainVideo.pause fired, ignoring:' + (ignorePauseEvent ? 'yes' : 'no'));
    if (!ignorePauseEvent) {
      window.app.socket.emit('triggerPauseVideo');
    }

    ignorePauseEvent = false;
  });

  video.on("seeked", function () {
    log('mainVideo.seeked fired, ignoring:' + (ignoreSeekEvent ? 'yes' : 'no'));
    if (!ignoreSeekEvent) {
      window.app.socket.emit('triggerSeekVideo', video[0].currentTime);
    }

    ignoreSeekEvent = false;
  });

  var URL = win.URL || win.webkitURL;
  var displayMessage = function displayMessage(message, isError) {
    if (isError) {
      alert(message);
    }
  };
  var playSelectedFile = function playSelectedFileInit() {
    var file = this.files[0];
    var type = file.type;
    var videoNode = document.querySelector('#mainVideo');
    var canPlay = videoNode.canPlayType(type);

    canPlay = (canPlay === '' ? 'no' : canPlay);

    var message = 'Can play type "' + type + '": ' + canPlay;
    var isError = canPlay === 'no';

    displayMessage(message, isError);

    if (isError) {
      return;
    }

    if (window.app.videoState === windowState_notChosen) {
      window.app.socket.emit('fileChosen', file.name);
      window.app.videoState = windowState_waitingAcceptance;
    } else if (window.app.videoState === windowState_chooseSame) {
      window.app.socket.emit('acceptFile');
      window.app.videoState = windowState_awaitPlay;
    }

    var fileURL = URL.createObjectURL(file);
    videoNode.src = fileURL;
    _$('#mainVideo').show();
    _$('#mainVideoSelectors').hide();
  };
  var inputNode = document.querySelector('#mainVideoInput');

  if (!URL) {
    displayMessage('Your browser is not ' + '<a href="http://caniuse.com/bloburls">supported</a>!', true);
    return;
  }

  inputNode.addEventListener('change', playSelectedFile, false);
}(window, $));