angular.module('muviApp', [])
  .controller('muviController', ['$scope', function($scope) {

    $scope.state = 'Start';
    $scope.clientType = 'Undecided';

    $scope.begin = function(host) {
      $scope.clientType = host ? 'Host' : 'Join';

      if (host) {
        state = 'done';
      }
    };

    function getInt() {
      return Math.floor(Math.random() * 10);
    }

    $scope.getRoomCode = function() {
      var code = '';
      for(var i = 0; i < 5; i++) {
        code += getInt();
      }

      return code;
    }

    $scope.enteredCode = '';

    $scope.joinRoom = function() {
      $scope.state = 'done';
    };
    
  }]);