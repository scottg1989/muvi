angular.module('muviApp').service('ioSocket', function() {
  window.app = {};
  window.app.socket = io.connect();

  this.socket = window.app.socket;
});