/*
 * Leap Controller Web Diagnostics
 */


function createElement(name, value) {
	var element = '<li class="list-group-item liitem"><strong>' + name + '</strong><span class="pull-right">' + value + '</span></li>'
	//console.log("Create element: ", element);
	return element;
}

var socket = io();
socket.on('log message', function(msg) {

	// Empty log for now to avoid performance issues
	$( "#output" ).empty();
	$( "#output" ).append(JSON.stringify(msg));
	$( "#output" ).append("\n");
	//console.log(msg);
});


socket.on('gesture record', function(data) {

	$( "#gesture-output" ).empty();
	// $( "#gesture-output" ).append(JSON.stringify(msg));
	// $( "#gesture-output" ).append("\n");


	for(var key in data) {
		var value = data[key];
		var listitem = createElement(key, value);
		 $( "#gesture-output" ).append(listitem);
	}

});

socket.on('timestamps', function(data) {

	console.log("Timestamps: ", data);

	var currentTime = new Date().getTime();

	$( "#timestamp-output" ).empty();
	// $( "#timestamp-output" ).append(JSON.stringify(msg));
	// $( "#timestamp-output" ).append("\n");

	for(var key in data) {
		var value = data[key];
		if(value) {
			var timeSince = currentTime - value;
		} else {
			var timeSince = 0;
		}
		var listitem = createElement(key, timeSince);
		 $( "#timestamp-output" ).append(listitem);
	}	
});

socket.on('status info', function(msg) {

	// Empty log for now to avoid performance issues
	$( "#status" ).empty();


	$( "#status" ).append(JSON.stringify(msg));
	$( "#status" ).append("\n");
	//console.log(msg);
});


socket.on('hand info', function(data) {

	//console.log("data..");
	//console.log(data);

	//console.log("Typeof data: " + typeof data);

	var left = data.leftHand;
	var right = data.rightHand;

	$( "#leftHandInfo" ).empty();
	if(left) {
		for(var key in left) {

			var value = left[key];

			var listitem = createElement(key, value);
			$( "#leftHandInfo" ).append(listitem);
		}
	} else {
		var listitem = '<li class="list-group-item liitem"><strong>Not present</strong></li>';
		$( "#leftHandInfo" ).append(listitem);
	}

	$( "#rightHandInfo" ).empty();
	if(right) {
		for(var key in right) {
			var value = right[key];
			var listitem = createElement(key, value);
			$( "#rightHandInfo" ).append(listitem);
		}
	} else {
		var listitem = '<li class="list-group-item liitem"><strong>Not present</strong></li>';
		$( "#rightHandInfo" ).append(listitem);
	}

	//console.log("left: " + left + ", right: " + right);
	//console.log(data);
});

socket.emit('query status info');