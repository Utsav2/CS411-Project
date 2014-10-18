var app = angular.module('cs411ProjectApp', ['ngRoute'])

app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/phones', {
        templateUrl: 'templates/HTMLPage.html'
        });
  }]);
	