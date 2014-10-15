'use strict';

/**
 * @ngdoc function
 * @name cs411ProjectApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the cs411ProjectApp
 */
angular.module('cs411ProjectApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
