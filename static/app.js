var app = angular.module('cs411ProjectApp', ['ngRoute'])

var map;

var days = {}

days['m'] = [];

days['t'] = [];

days['w'] = [];

days['r'] = [];

days['f'] = [];

var alreadyAddedCourse = {};


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

	            value: data[i].subjnbr + ' ' + data[i].title,

	            id: data[i].crn

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

		putOnMap(ui);

	}
});

function putOnMap(data){

	$.getJSON("/getCoursesWithDays?term=" + data.item.id, function(result){

		for(var i in result){

			if(result.subjnbr in alreadyAddedCourse){

				continue;
			}

			alreadyAddedCourse[result.subjnbr] = "1"; 

			console.log(result[i]);

			if(result[i].m != null){
				days['m'].push(result[i]);
			}
			if(result[i].t != null){
				days['t'].push(result[i]);
			}
			if(result[i].w != null){
				days['w'].push(result[i]);
			}
			if(result[i].h != null){
				days['r'].push(result[i]);
			}
			if(result[i].f != null){
				days['f'].push(result[i]);
			}
		}
	});

}

var currentMarkers = [];

function renderMap(day){

	clearMarkers();

	for(var i in days[day]){

		var location = new google.maps.LatLng((days[day])[i].latitude, (days[day])[i].longitude);

		var marker = new google.maps.Marker({
			position: location,
			map: map
		});

		marker.setMap(map);

		currentMarkers.push(marker);
	}

}
function clearMarkers(){

	for(var i in currentMarkers){

		currentMarkers[i].setMap(null);
	}

	currentMarkers = [];	
}


google.maps.event.addDomListener(window, 'load', initialize);
