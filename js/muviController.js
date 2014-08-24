angular.module('muviApp', [])
  .controller('muviController', ['$scope', 'session', function($scope, session) {

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

    var state_awaitingCam = 'AwaitingCam';
    var state_choosingSide = 'ChoosingSide';
    var state_choosingVideo = 'ChoosingVideo';

    $scope.webcamState = 'Awaiting';
    $scope.clientType = 'Undecided';
    $scope.localVideoEnabled = false;
    $scope.remoteVideo = false;
    $scope.roomCreated = false;


    $scope.state = state_awaitingCam;


    session.registerWebcamCallback(function (msg) {
      if (msg === 'connected') {
        $scope.$apply(function () {
          $scope.state = state_choosingSide;
        });
      } else if (msg === 'error') {
        $scope.$apply(function () {
          $scope.webcamState = 'Errored';
        });
      }
    })


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
      session.joinRoom($scope.enteredCode);
    };

    session.registerOnClientJoined(function () {
      session.makeCall();
    });

    session.registerOnCallConnected(function () {
      $scope.$apply(function () {
        $scope.state = state_choosingVideo;
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
        $scope.localVideoEnabled = true;

        $scope.remoteVideo = true;
      });
    });
  }]);