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

function regexify_search(term, pretty){

	var look_for = pretty ? '-' : ' ';
	var replace_with = pretty ? ' ' : '-';

	var whitespace = term.indexOf(look_for);
	if(whitespace != -1){
		before = term.substring(0, whitespace);
		after = term.substring(whitespace+1, term.length);
		if(before.search(/[^a-zA-Z]+/) === -1 && after.search(/^\d+(?:\.\d{1,2})?$/) !== -1){
			return before + replace_with + after;
		}
	}
	return term;
}

function getPrettyTimings(time){
	var hour = parseInt(time.substring(0, 2));
	if(hour == 12 && parseInt(time.substring(3, 5)) == 0) {
		return hour + time.substring(2, 5) + " noon";
	}
	return hour > 12 ? (hour - 12) + time.substring(2, 5) + "PM" : hour + time.substring(2, 5) + "AM";
}

function guessLectureOrDiscussionAndPrintDays(data){

	var count = 0;
	var string = ' (';
	if(data.m != null){
		count++;
		string += 'm,';
	}
	if(data.t != null){
		count++;
		string += 't,';
	}
	if(data.w != null){
		count++;
		string += 'w,';
	}
	if(data.h != null){
		count++;
		string += 'th,';
	}
	if(data.f != null){
		count++;
		string += 'f,';
	}
	string = string.substring(0, string.length-1) + ')';
	return string;
}

function makeAutocompletePretty(data){

	return regexify_search(data.subjnbr, true) + ': ' + data.title + ' ' + getPrettyTimings(data.begintime)
			+  ' ' + guessLectureOrDiscussionAndPrintDays(data);
}

function parseRest(data){
	return data.name;
}

$( "#restaurant_search" ).autocomplete({
	source: function (request, response) {
		$.getJSON("/searchRestaurant?name=" + request.term, function (data) {
			r = [];
	      	duplicates = {};
			count = 0;
			for(var i in data){
				if(!(data[i].name in duplicates)){
					r[count] = {
						label: parseRest(data[i]),
						value: parseRest(data[i])
					}
					count++;
					duplicates[data[i].name] = "1";
				}
			}
			response(r);
		});
	},
	minLength: 2,
	delay:100
});

$( "#search" ).autocomplete({
	source: function (request, response) {

		request.term = regexify_search(request.term, false);
	  	$.getJSON("/getCourses?term=" + request.term, function (data) {
	      r = [];
	      duplicates = {};
	      var count = 0;
	      for(var i in data){
	        if(!(data[i].crn in duplicates)){
	          r[count] = {
	            label: makeAutocompletePretty(data[i]),
	            value: makeAutocompletePretty(data[i]),
	            id: data[i].crn,
	            title: data[i].title,
	            subjnbr: data[i].subjnbr,
	            begintime: data[i].begintime,
	            endtime: data[i].endtime,
	            m: data[i].m,
	            t: data[i].t,
	            w: data[i].w,
	            h: data[i].h,
	            f: data[i].f,
	            crn: data[i].crn
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

function getLongFormDay(day){

	switch (day){
		case 'm':
			return "Monday";
		case 't':
			return "Tuesday";
		case 'w':
			return "Wednesday";
		case 'r':
			return "Thursday";
		case 'f':
			return "Friday";
		default:
			return "Saturday";
	}
}
var currentMarkers = [];
current_info_windows = [];
currently_rendered = 'm';
var currentlyConflictingCourse;
var currentlyConflictingDetailString;

function checkConflictFor(day, data){

	//Using moment.js check it out
	var begin =  moment(data.begintime, "HH:mm:ss");
	var end =  moment(data.endtime, "HH:mm:ss");
	for(var i = 0; i < days[day].length; i++){
		var begintime = moment((days[day])[0].begintime, "HH:mm:ss");
		var endtime = moment((days[day])[0].endtime, "HH:mm:ss");
		if(begin.isBefore(endtime) && end.isAfter(begintime)){
			currentlyConflictingCourse = (days[day])[0].title;
			currentlyConflictingDetailString = getLongFormDay(day);
			return true;
		}
	}
	return false;
}
function checkForTimeConflict(data){

	if(data.m != null){
		if(checkConflictFor('m', data))
			return true;
	}
	if(data.t != null){
		if(checkConflictFor('t', data))
			return true;		
	}
	if(data.w != null){
		if(checkConflictFor('w', data))
			return true;
	}
	if(data.r != null){
		if(checkConflictFor('r', data))
			return true;		
	}
	if(data.f != null){
		if(checkConflictFor('f', data))
			return true;
	}
	return false;
}

function setCurrentlyRendered(day){
	currently_rendered = day;
	var previous = $(".list-inline").children(".active");
	previous.removeClass('active');
	$('#' + day + '-list').addClass('active');
}
function putOnMap(data){

	$.getJSON("/getCoursesWithDetails?term=" + data.item.id, function(result){

			if(checkForTimeConflict(result[0])){

				alert("Time Conflict! With " + currentlyConflictingCourse + " on " + currentlyConflictingDetailString);
				return;
			}

			var flag = 1;
			if(result[0].m != null){
				days['m'].push(result[0]);
				flag *= 2 ;
			}
			if(result[0].t != null){
				days['t'].push(result[0]);
				flag *= 3;
			}
			if(result[0].w != null){
				days['w'].push(result[0]);
				flag *= 7;
			}
			if(result[0].h != null){
				days['r'].push(result[0]);
				flag *= 11;
			}
			if(result[0].f != null){
				days['f'].push(result[0]);
				flag *= 13;
			}
			for(var i = 2; i <= 13; i++){
				if(flag % i == 0){
					if(i == 2)
						currently_rendered = 'm';
					if(i == 3)
						currently_rendered = 't';
					if(i == 7)
						currently_rendered = 'w';
					if(i == 11)
						currently_rendered = 'r';
					if(i == 13)
						currently_rendered = 'f';
					break;
				}
			}
			renderMap(currently_rendered);
			setCurrentlyRendered(currently_rendered);
	});

}
function clearCourses(){
	$('#extras').empty();
	//$('#' + day + '-list').empty();
}

function getContentString(tuple, css){

	return content_string = '<div class = "' + css + '"><h3>' + tuple.subjnbr + '</h3>' + 
							 '<p>' + tuple.title + 
							 '<p><span>' + getPrettyTimings(tuple.begintime) +  
							 ' - ' + getPrettyTimings(tuple.endtime) + '</span></div>';

}

function compareTimes(a, b){
	return parseInt(a.begintime.substring(0, 2)) > parseInt(b.begintime.substring(0, 2));
}

function renderMap(day){
	clearMarkers();
	clearCourses();
	for(var i in days[day]){
		var tuple = (days[day])[i];
		var location = new google.maps.LatLng(tuple.latitude, tuple.longitude);
		var marker = new google.maps.Marker({
			position: location,
			title: days[day].title,
			map: map
		});
		var infowindow = new google.maps.InfoWindow({
     		content: getContentString(tuple, "course-marker")
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
	setCurrentlyRendered(day);
}

function appendContentStrings(days_array, day){
	for(var i in days_array){
		//$('#' + day + '-list').append(days_array[i].content_string);
		$('#extras').append(getContentString(days_array[i], "course col-md-12"));
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
	/*directionsService.route(request, function(result, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(result);
		}
	}); */
}

$('.list-group-item').on('click',function(e){
    var previous = $(this).closest(".list-inline").children(".active");
    previous.removeClass('active'); // previous list-item
    $(e.target).addClass('active'); // activated list-item
});

google.maps.event.addDomListener(window, 'load', initialize);