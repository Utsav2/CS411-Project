var app = angular.module('cs411ProjectApp', ['ngRoute'])
var map;
var days = {}
days['m'] = [];
days['t'] = [];
days['w'] = [];
days['r'] = [];
days['f'] = [];

var directionsDisplay;
var directionsService = new google.maps.DirectionsService();

function initialize() {
    var mapOptions = {
      center: { lat: 40.1150, lng: -88.2728},
      zoom: 16
    };
	map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);

	directionsDisplay = new google.maps.DirectionsRenderer();
	directionsDisplay.setMap(map);
}
function moveToLocation(lat, lng){
    var center = new google.maps.LatLng(lat, lng);
    map.panTo(center);
}

function regexify_search(term){

	var whitespace = term.indexOf(' ');
	if(whitespace != -1){
		before = term.substring(0, whitespace);
		after = term.substring(whitespace+1, term.length);
		if(before.search(/[^a-zA-Z]+/) === -1 && after.search(/^\d+(?:\.\d{1,2})?$/) !== -1){
			return before + '-' + after;
		}
	}
	return term;
}
$( "#search" ).autocomplete({
	source: function (request, response) {

		request.term = regexify_search(request.term);
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

var currentMarkers = [];
current_info_windows = [];
currently_rendered = 'm';

function putOnMap(data){

	$.getJSON("/getCoursesWithDays?term=" + data.item.id, function(result){
			if(result[0].m != null){
				days['m'].push(result[0]);
			}
			if(result[0].t != null){
				days['t'].push(result[0]);
			}
			if(result[0].w != null){
				days['w'].push(result[0]);
			}
			if(result[0].h != null){
				days['r'].push(result[0]);
			}
			if(result[0].f != null){
				days['f'].push(result[0]);
			}
			renderMap(currently_rendered);
	});

}
function clearCourses(day){
	$('#CourseList').empty();
	$('#' + day + '-list').empty();
}

function compareTimes(a, b){
	return parseInt(a.begintime.substring(0, 2)) > parseInt(b.begintime.substring(0, 2));
}

function renderMap(day){
	clearMarkers();
	clearCourses(day);
	for(var i in days[day]){
		var tuple = (days[day])[i];
		var location = new google.maps.LatLng(tuple.latitude, tuple.longitude);
		var marker = new google.maps.Marker({
			position: location,
			title: days[day].title,
			map: map
		});
		var content_string = '<div class = "course"><h3>' + tuple.subjnbr + '</h3>' + 
							 '<p>' + tuple.title + 
							 '<p><span>' + tuple.begintime +  
							 ' - ' + tuple.endtime + '</span></div>';

		var infowindow = new google.maps.InfoWindow({
     		content: content_string
  		});
  		(days[day])[i].content_string = content_string;
  		add_infowindow(marker, infowindow);
  		marker.setMap(map);
		currentMarkers.push(marker);
		current_info_windows.push(infowindow);
	}
	days[day].sort(compareTimes);
	appendContentStrings(days[day], day);
	calcRoute(day);
	map.panTo(location);
	currently_rendered = day;
}

function appendContentStrings(days_array, day){
	for(var i in days_array){
		$('#' + day + '-list').append(days_array[i].content_string);
	}
}

function add_infowindow(marker, infowindow){
	  	google.maps.event.addListener(marker, 'click', function() {
    		infowindow.open(map,marker);
  		}); 
}
function clearMarkers(){
	for(var i in currentMarkers){
		currentMarkers[i].setMap(null);
	}
	currentMarkers = [];	
	current_info_windows = [];
}

function calcRoute(day) {
	if(days[day].length <= 1){
		directionsDisplay.set('directions', null);
		return;
	}
	var origin = new google.maps.LatLng((days[day])[0].latitude, (days[day])[0].longitude);
	var destination = new google.maps.LatLng((days[day])[(days[day]).length-1].latitude, (days[day])[(days[day]).length-1].longitude);
	var waypoints = [];
	if (days[day].length > 2){
		for(var i = 1; i < days[day].length - 1; i++){
			var tuple = {};
			tuple.stopover = true;
			tuple.location = (new google.maps.LatLng((days[day])[i].latitude, (days[day])[i].longitude));
			waypoints.push(tuple);
		}
	}
	var request = {
		origin:origin,
		destination:destination,
		waypoints:waypoints,
		travelMode: google.maps.TravelMode.WALKING
	};
	directionsService.route(request, function(result, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(result);
		}
	}); 
}

$('.list-group-item').on('click',function(e){
    var previous = $(this).closest(".list-group").children(".active");
    previous.removeClass('active'); // previous list-item
    $(e.target).addClass('active'); // activated list-item
  });

google.maps.event.addDomListener(window, 'load', initialize);