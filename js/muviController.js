angular.module('muviApp', [])
  .controller('muviController', ['$scope', 'session', function($scope, session) {

    var state_awaitingCam = 'AwaitingCam';
    var state_choosingSide = 'ChoosingSide';
    var state_choosingFunction = 'ChoosingFunction';
    var state_function = 'Function';
    var state_video = 'Video';
    var dataHandlers = [];

    var ignorePause = false;
    var ignorePlay = false;
    var ignoreSeek = false;

    function getInt() {
      return Math.floor(Math.random() * 10);
    }

    //todo - make a call to the server to ensure a new code
    function getNewRoomId() {
      var code = '';
      for(var i = 0; i < 5; i++) {
        code += getInt();
      }

      return code;
    }

    function handleDataReceived (data) {
      $scope.$apply(function () {
        for(var i = 0; i < dataHandlers.length; i++) {
          if (dataHandlers[i](data)) {
            break;
          }
        }
      });
    };

    $scope.webcamState = 'Awaiting';
    $scope.clientType = 'Undecided';
    $scope.localVideo = false;
    $scope.remoteVideo = false;
    $scope.roomCreated = false;
    $scope.chosenFunction;

    $scope.localfile_state = 'Awaiting Host';


    $scope.state = state_awaitingCam;

    function functionSetupMessages(data) {
      if (data === 'FN:Local files') {
        $scope.state = state_function;
        $scope.chosenFunction = 'LocalFiles';
      } else {
        return false;
      }

      return true;
    }

    function localFilesMessages(data) {
      if (data === 'FL:File chosen') {
        $scope.localfile_state = 'Choose Video';
      } else if (data === 'VC:play') {
        ignorePlay = true;
        playVideo();
      } else if (data === 'VC:pause') {
        ignorePause = true;
        pauseVideo();
      } else if (data.indexOf('VC:seek=') === 0) {
        var seekTime = parseInt(data.substring(8));
        ignoreSeek = true;
        seekVideo(seekTime);
      } else {
        return false;
      }

      return true;
    }

    //set up datahandlers
    dataHandlers.push(functionSetupMessages);
    dataHandlers.push(localFilesMessages);


    session.registerLocalCamCallback(function (msg) {
      if (msg === 'connected') {
        $scope.$apply(function () {
          $scope.localVideo = true;
          $scope.state = state_choosingSide;
        });
      } else if (msg === 'error') {
        $scope.$apply(function () {
          $scope.webcamState = 'Errored';
        });
      }
    });

    session.registerRemoteCamCallback(function () {
      $scope.$apply(function () {
        $scope.remoteVideo = true;
      });
    });

    $scope.chooseFunction = function (chosenFunction) {
      if (chosenFunction === 'local files') {
        $scope.chosenFunction = 'LocalFiles';
        session.sendData('FN:Local files'); //send message to other..
      }

      $scope.state = state_function;
    };

    function playVideo() {
      document.querySelector('#mainVideo').play();
    };

    function pauseVideo() {
      document.querySelector('#mainVideo').pause();
    };

    function seekVideo(time) {
      document.querySelector('#mainVideo').currentTime = time;
    };


    /* start */

    $scope.begin = function(host) {
      $scope.clientType = host ? 'Host' : 'Join';

      if (host) {
        var roomId = getNewRoomId();
        $scope.roomId = roomId;
        session.createRoom(roomId, function() {
          $scope.$apply(function () {
            $scope.roomCreated = true;
          });
        });
      }
    };

    $scope.roomId;

    $scope.enteredCode = '';

    $scope.joinRoom = function() {
      session.joinRoom($scope.enteredCode, function (err) {
        if (err) {
          alert('Code was not valid');
          $scope.$apply(function () {
            enteredCode = '';
          });
        }
      });
    };

    session.registerOnClientJoined(function () {
      session.makeCall();
    });

    session.registerOnCallConnected(function () {
      $scope.$apply(function () {
        $scope.state = state_choosingFunction;
      });
    })

    /* choosing video */

    $scope.openFileDialog = function() {

    };


    $scope.makeCall = function () {
      session.makeCall();
    };

    session.startLocalVideo(function () {
      $scope.$apply(function () {
      });
    });

    session.registerOnDataReceived(handleDataReceived);




    var playSelectedFile = function playSelectedFileInit() {
      var file = this.files[0];
      var type = file.type;
      var videoNode = document.querySelector('#mainVideo');
      var canPlay = videoNode.canPlayType(type);

      canPlay = (canPlay === '' ? 'no' : canPlay);

      var message = 'Can play type "' + type + '": ' + canPlay;
      var isError = canPlay === 'no';

      if (isError) {
        return;
      }

      if ($scope.clientType === 'Host') {
        session.sendData('FL:File chosen');
      }

      console.log("fu");
      var fileURL = URL.createObjectURL(file);
      console.log("Fileurl" + fileURL);
      videoNode.src = fileURL;
      $scope.$apply(function () {
        $scope.state = state_video;
      });

      if ($scope.clientType === 'Join') {
        setTimeout(function () {
          session.sendData('VC:play');
          playVideo();
        }, 500);

      }
    };

    var inputNode = document.querySelector('#mainVideoInput');
    inputNode.addEventListener('change', playSelectedFile, false);

    var video = $('#mainVideo');

    video.on('play', function () {
      if (!ignorePlay) {
        session.sendData('VC:play');
      }
      ignorePlay = false;
    });

    video.on('pause', function () {
      if (!ignorePause) {
        session.sendData('VC:pause');
      }
      ignorePause = false;
    });

    video.on('seeked', function () {
      if (!ignoreSeek) {
        var time = video[0].currentTime;
        session.sendData('VC:seek=' + time);
      }
      ignoreSeek = false;
    });

  }]);

