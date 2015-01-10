/*
 * LeapGIM Config and Monitor Utility
 */


/*
 * Simple command line argument parsing
 */

var args = process.argv.slice(2);

var monitorMode = (args[0] == "monitor");
if(monitorMode) {
  if(args[1] == "logs" || !args[1]) {
  	var monitorType = "logs";
  } else if (args[1] == "gestureRecord") {
  	var monitorType = "gesture record";
  }	else if (args[1] == "timestamps") {
  	var monitorType = "timestamps";
  } else if (args[1] == "pointers") {
  	var monitorType = "pointers";
  } else if (args[1] == "handinfo") {
  	var monitorType = "pointers";
  }
}

var switchConfig = (args[0] == "reconfigure");
if(switchConfig) {
	if(args[1]) {
		var configFile = args[1];
		if(!require('fs').statSync(configFile).isFile()) {
			switchConfig = false;
			console.log("Error! Second argument is not a file");			
		}
	}
}

var queryGestureRecord = (args[0] == "gestures");
var queryTimestamps = (args[0] == "timestamps");
var queryHandinfo = (args[0] == "handinfo");
var queryPointerModel = (args[0] == "pointers");
var queryStatus = (args[0] == "status");


// Connect to service

var io = require('socket.io-client');
var socket = io("http://127.0.0.1:3000").on('connect', function() {

	console.log("Connected!");

	// Monitoring
	if(monitorMode) {
		if(monitorType == "logs") {
			socket.on('log message', function(msg) {
				console.log(msg);
			});
		} else if(monitorType == "gesture record") {
			socket.on('gesture record', function(msg) {
				console.log(msg);
			});
		} else if (monitorType == "timestamps") {
			socket.on('timestamps', function(msg) {
				console.log(msg);
			});
		} else if (monitorType == "handinfo") {
			socket.on('hand info', function(msg) {
				console.log(msg);
			});
		} else if (monitorType == "pointers") {
			socket.on('pointer info', function(msg) {
				console.log(msg);
			});
		}
	}

	// Querry stuff
	if(queryGestureRecord) {
		console.log("gestures");
		socket.on('gesture record', function(msg) {
			console.log(msg);
			socket.disconnect();
		});
		socket.emit('query gesture record');
	}

	if(queryTimestamps) {
		socket.on('timestamps', function(msg) {
			console.log(msg);
			socket.disconnect();
		});

		socket.emit('query timestamp data');
	}

	if(queryHandinfo) {
		socket.on('hand info', function(msg) {
			console.log(msg);
			socket.disconnect();
		});

		socket.emit('query hand info');
	}

	if(queryStatus) {
		socket.on('status info', function(msg) {
			console.log(msg);
			socket.disconnect();
		});

		socket.emit('query status info');
	}

	if(queryPointerModel) {
		socket.on('pointer info', function(msg) {
			console.log(msg);
			socket.disconnect();
		});

		socket.emit('query pointer info');
	}

	// TODO: Switch config
	if(switchConfig) {
		console.log("Reconfigure..");
		socket.emit('reconfigure', configFile);
		socket.disconnect();
	}

});

