var app = angular.module('cs411ProjectApp', ['ngRoute'])
var map;
var days = {}
days['m'] = [];
days['t'] = [];
days['w'] = [];
days['r'] = [];
days['f'] = [];
var routes = {}
routes['m'] = [];
routes['t'] = [];
routes['w'] = [];
routes['r'] = [];
routes['f'] = [];


currentCrn = 1;

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
	if(hour == 12){
		return hour + time.substring(2, 5) + "PM";
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
	return data.name + " (" + data.cuisine + ") ";
}

var timeTakenToEat = 60;

function calculateRestarauntTime(tuple, day){

	if(days[day].length == 0){
		return {
			begin:"12:00:00",
			end:"13:00:00"
		}	
	}
	for(var i = 0; i < days[day].length - 1; i++){
		var tuple = (days[day])[i];
		var end =  moment(tuple.endtime, "HH:mm:ss");
		var beginning =  moment(((days[day])[i+1]).begintime, "HH:mm:ss");
		if(beginning.diff(end, 'minutes') > timeTakenToEat){
			return {
				begin:end.format("HH:mm:ss"),
				end:end.add(timeTakenToEat, 'minutes').format("HH:mm:ss")
			};
		}
	}

	var tuple = (days[day])[days[day].length-1];
	console.log(days[day].length-1);
	console.log((days[day])[days[day].length-1]);
	return {
		begin:tuple.endtime,
		end:moment(tuple.endtime, "HH:mm:ss").add(timeTakenToEat, 'minutes').format("HH:mm:ss")
	};
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
			            value: "",
			            id: "",
			            title: data[i].cuisine,
			            subjnbr: data[i].name,
			            begintime: null,
			            endtime: null,
			            latitude: data[i].latitude,
			            longitude: data[i].longitude,
			            type:"restaurant",
			            crn: currentCrn++
					}
					count++;
					duplicates[data[i].name] = "1";
				}
			}
			response(r);
		});
	},
	minLength: 2,
	delay:100,
	select: function( event, ui ) {
		putRestaurantOnMap(ui.item);
	}
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
		            value: "",
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
		            type:"course",
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

function createRestaurant(data, day){
	var r = calculateRestarauntTime(data, day);
	data.begintime = r.begin;
	data.endtime = r.end;
	days[currently_rendered].push(data);
}

function putRestaurantOnMap(data){

	createRestaurant(data, currently_rendered);
	renderMap(currently_rendered);
	setCurrentlyRendered(currently_rendered);
}

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
var currentlyConflictingDetailString;

function checkConflictFor(day, data){

	//Using moment.js check it out
	var begin =  parseInt(moment(data.begintime, "HH:mm:ss").format("X"));
	var end =  parseInt(moment(data.endtime, "HH:mm:ss").format("X"));
	for(var i = 0; i < days[day].length; i++){
		var begintime = parseInt(moment((days[day])[0].begintime, "HH:mm:ss").format("X"));
		var endtime = parseInt(moment((days[day])[0].endtime, "HH:mm:ss").format("X"));
		for(var i = begin; i < end; i += (end-begin)/5){
			if(i <= endtime && i >= begintime){
				currentlyConflictingDetailString = (days[day])[0].title + " on " + getLongFormDay(day);
				return true;
			}
		}
	}
	return false;
}
function checkForTimeConflict(data, restaurant){

	if(restaurant){
		if(checkConflictFor(currently_rendered, data))
			return true;
		return false;
	}
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

function recalcRestaurants(day){

	console.log(days[day]);

	var restaurants = [];

	for(var i = 0 ; i < days[day].length; i++){
		tuple = (days[day])[i];
		if(tuple.type === "restaurant"){
			days[day].splice(i, 1);	
			restaurants.push(tuple);
		}
	}
	for(var i in restaurants){
		tuple = restaurants[i];
		var r = calculateRestarauntTime(tuple, day);
		tuple.begintime = r.begin;	
		tuple.endtime = r.end;
		days[day].push(tuple);
	}
	days[day].sort(compareTimes);
}
function putOnMap(data){

	$.getJSON("/getCoursesWithDetails?term=" + data.item.id, function(result){

			if(checkForTimeConflict(result[0], false)){
				alert("Time Conflict! " + currentlyConflictingDetailString);
				return;
			}

			if(result[0].f != null){
				days['f'].push(result[0]);
				currently_rendered = 'f';
			}
			if(result[0].h != null){
				days['r'].push(result[0]);
				currently_rendered = 'r';
			}
			if(result[0].w != null){
				days['w'].push(result[0]);
				currently_rendered = 'w';
			}
			if(result[0].t != null){
				days['t'].push(result[0]);
				currently_rendered = 't';
			}
			if(result[0].m != null){
				days['m'].push(result[0]);
				currently_rendered = 'm' ;
			}

			recalcRestaurants(currently_rendered);
			console.log(days[currently_rendered]);			
			renderMap(currently_rendered);
			setCurrentlyRendered(currently_rendered);
	});
}
function clearCourses(){
	$('#extras').empty();
}

function deleteCourseWithCrn(crn, day){

	for (var i in days[day]){
		if((days[day])[i].crn == crn){
			days[day].splice(i, 1);
			return day;
		}
	}
	return 0;
}

function closeCard(id){

	var day;
	day = deleteCourseWithCrn(id, 'f');
	day = deleteCourseWithCrn(id, 'r');
	day = deleteCourseWithCrn(id, 'w');
	day = deleteCourseWithCrn(id, 't');
	day = deleteCourseWithCrn(id, 'm');
	recalcRestaurants(currently_rendered);
	renderMap(currently_rendered);	
}

function getContentString(tuple, css, close, day){

	var string = '<div id = "' + day + tuple.crn + '" class = "' + css + '">';

	if(close)
		string += "<span id='close' onclick='closeCard(" + tuple.crn + ")'>x</span>";

	string += '<h3>' + tuple.subjnbr + '</h3>' + 
							 '<p>' + tuple.title + 
							 '<p><span>' + getPrettyTimings(tuple.begintime) +  
							 ' - ' + getPrettyTimings(tuple.endtime) + '</span></div>';

	return string;
}

function compareTimes(a, b){
	var one =  moment(a.begintime, "HH:mm:ss");
	var two =  moment(b.begintime, "HH:mm:ss");
	return one.diff(two);
}
function cleanup(){
	clearMarkers();
	clearCourses();
}

function renderMap(day){

	cleanup();
	for(var i in days[day]){
		var tuple = (days[day])[i];
		var location = new google.maps.LatLng(tuple.latitude, tuple.longitude);
		var marker = new google.maps.Marker({
			position: location,
			title: days[day].title,
			map: map
		});
		var infowindow = new google.maps.InfoWindow({
     		content: getContentString(tuple, "course-marker", false, day)
  		});
  		add_infowindow(marker, infowindow);
  		marker.setMap(map);
		currentMarkers.push(marker);
		current_info_windows.push(infowindow);
	}
	days[day].sort(compareTimes);
	calcRoute(day);
	map.panTo(location);
	setCurrentlyRendered(day);
}

function getRouteHtml(tuple, css){
	return string = '<div class = "col-md-12 route ' + css +' ">|<p>' + tuple.text + '<br/>|</div>';
}

function getRoute(tuple, day, i){

	var j = parseInt(i) + 1;
	var css = "ok";
	var minutes = parseInt(tuple.text.substring(0, tuple.text.indexOf(' ')));
	var end =  moment(((days[day])[i]).endtime, "HH:mm:ss");
	var beginning =  moment(((days[day])[j]).begintime, "HH:mm:ss");
	if(beginning.diff(end, 'minutes') < minutes){
		var t = (days[day])[j];
		if(t.type === "restaurant"){
			t.begintime = beginning.add(minutes, 'minutes').format("HH:mm:ss");
			t.endtime = moment(t.endtime, "HH:mm:ss").add(minutes, 'minutes').format("HH:mm:ss");
		}
		else
			css = "toolong";
	}
	return getRouteHtml(tuple, css);
}

function appendContentStrings(day){
	var route_length = routes[day].length;
	for(var i in days[day]){
		$('#extras').append(getContentString((days[day])[i], "card col-md-12", true, day));
		if(i < route_length){
			$('#extras').append(getRoute((routes[day])[i], day, i));
		}
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

function clearRoutes(day){
	routes[day] = [];
}

function createDurations(data, day){

	for(var i in data){	
		routes[day].push(data[i].duration);
	}
}

var travelMode = "WALKING";

function calcRoute(day) {

	clearRoutes(day);
	if(days[day].length <= 1){
		appendContentStrings(day);
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
		travelMode: google.maps.TravelMode[travelMode]
	};
	directionsService.route(request, function(result, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			createDurations(result.routes[0].legs, day);
			directionsDisplay.setDirections(result);
			appendContentStrings(day);
		}
	}); 
}

$('.list-group-item').on('click',function(e){
    var previous = $(this).closest(".list-inline").children(".active");
    previous.removeClass('active'); // previous list-item
    $(e.target).addClass('active'); // activated list-item
});

$( "#transport" ).change(function() {

	cleanup();
	travelMode = $("#transport").val();
	recalcRestaurants(currently_rendered);
	renderMap(currently_rendered);

});

google.maps.event.addDomListener(window, 'load', initialize);