'use strict';

/**
 * @ngdoc function
 * @name cs411ProjectApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the cs411ProjectApp
 */
angular.module('cs411ProjectApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
