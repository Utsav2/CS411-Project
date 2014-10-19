var app = angular.module('cs411ProjectApp', ['ngRoute'])

var map;

function initialize() {
    
    var mapOptions = {
      center: { lat: 40.1150, lng: -88.2728},
      zoom: 8
    };

	map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
}

function moveToLocation(lat, lng){

    var center = new google.maps.LatLng(lat, lng);

    map.panTo(center);
}



$( "#search" ).autocomplete({

	source: function (request, response) {
	  $.getJSON("/getCourses?term=" + request.term, function (data) {

	      r = [];

	      duplicates = [];

	      var count = 0;

	      for(var i in data){

	        if(!(data[i].crn in duplicates)){

	          r[count] = {

	            label: data[i].subjnbr + ' ' + data[i].title + ' ' + data[i].crn,

	            value: data[i].subjnbr + ' ' + data[i].title

	          }

	          duplicates[data[i].crn] = "1"

	          count++;

	        }

	      }

	      response(r);
	  });
	},

	minLength: 2,
	delay:100,
	select: function( event, ui ) {

			
	}
});

google.maps.event.addDomListener(window, 'load', initialize);
