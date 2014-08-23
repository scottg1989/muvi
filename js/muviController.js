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


    var state_start = 'Start';
    var state_choosingVideo = 'ChoosingVideo';


    $scope.state = state_start;
    $scope.clientType = 'Undecided';
    $scope.localVideoEnabled = false;
    $scope.remoteVideo = false;
    $scope.roomCreated = false;

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
        //state = state_choosingVideo;
      }
    };

    $scope.roomId;

    $scope.enteredCode = '';

    $scope.joinRoom = function() {
      $scope.state = state_choosingVideo;
    };


    /* choosing video */

    $scope.openFileDialog = function() {

    };



    session.startLocalVideo(function () {
      $scope.$apply(function () {
        $scope.localVideoEnabled = true;

        $scope.remoteVideo = true;
        session.makeCall();
      });
    });
  }]);