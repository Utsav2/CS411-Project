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
	source: "getCourses",
	minLength: 2,
	select: function( event, ui ) {

			
	}
});

google.maps.event.addDomListener(window, 'load', initialize);
