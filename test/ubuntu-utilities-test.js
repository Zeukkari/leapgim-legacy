var testCase = require('nodeunit').testCase;

//var process.env.npm_package_config_keyboardbin = "onboard";

exports.testCase = testCase({
	"Test virtual keyboard" : function(test) {

		var process = require('process');
		var path = require('path');
		var fs = require('fs');

		test.expect(1);

		// Look for required minary in path
		var result = false;
		//console.info("process.env", process.env);
		process.env.PATH.split(path.delimiter).forEach(function(pathDir) {
			//console.info("Pathdir: ", pathDir);

			var bin = process.env.npm_package_config_keyboardbin;

			//console.info("le: ", keyboardbin);
			//console.info("...", path.join(pathDir, "onboard"));
			try {
				var stats = fs.statSync(pathDir + "/" +bin);
				//console.info("stats: ", stats);
				 if(stats) {
				 	result = true;
				 }
			} catch (exception) {

			}

		});

	 	test.ok(result, "Binary found");
	 	test.done();
	},
	"Test xset" : function(test) {

		var process = require('process');
		var path = require('path');
		var fs = require('fs');

		test.expect(1);

		// Look for required minary in path
		var result = false;
		//console.info("process.env", process.env);
		process.env.PATH.split(path.delimiter).forEach(function(pathDir) {
			//console.info("Pathdir: ", pathDir);

			var bin = process.env.npm_package_config_xset;

			//console.info("le: ", keyboardbin);
			//console.info("...", path.join(pathDir, "onboard"));
			try {
				var stats = fs.statSync(pathDir + "/" +bin);
				//console.info("stats: ", stats);
				 if(stats) {
				 	result = true;
				 }
			} catch (exception) {

			}

		});

	 	test.ok(result, "Binary found");
	 	test.done();
	},
	"Test espeak" : function(test) {

		var process = require('process');
		var path = require('path');
		var fs = require('fs');

		test.expect(1);

		// Look for required minary in path
		var result = false;
		//console.info("process.env", process.env);
		process.env.PATH.split(path.delimiter).forEach(function(pathDir) {
			//console.info("Pathdir: ", pathDir);

			var bin = process.env.npm_package_config_espeak;

			//console.info("le: ", keyboardbin);
			//console.info("...", path.join(pathDir, "onboard"));
			try {
				var stats = fs.statSync(pathDir + "/" +bin);
				//console.info("stats: ", stats);
				 if(stats) {
				 	result = true;
				 }
			} catch (exception) {

			}

		});

	 	test.ok(result, "Binary found");
	 	test.done();
	},
	"Test player" : function(test) {

		var process = require('process');
		var path = require('path');
		var fs = require('fs');

		test.expect(1);

		// Look for required minary in path
		var result = false;
		//console.info("process.env", process.env);
		process.env.PATH.split(path.delimiter).forEach(function(pathDir) {
			//console.info("Pathdir: ", pathDir);

			var bin = process.env.npm_package_config_player;

			//console.info("le: ", keyboardbin);
			//console.info("...", path.join(pathDir, "onboard"));
			try {
				var stats = fs.statSync(pathDir + "/" +bin);
				//console.info("stats: ", stats);
				 if(stats) {
				 	result = true;
				 }
			} catch (exception) {

			}

		});

	 	test.ok(result, "Binary found");
	 	test.done();
	},
	"Test tdtool" : function(test) {

		var process = require('process');
		var path = require('path');
		var fs = require('fs');

		test.expect(1);

		// Look for required minary in path
		var result = false;
		//console.info("process.env", process.env);
		process.env.PATH.split(path.delimiter).forEach(function(pathDir) {
			//console.info("Pathdir: ", pathDir);

			var bin = process.env.npm_package_config_tdtool;

			//console.info("le: ", keyboardbin);
			//console.info("...", path.join(pathDir, "onboard"));
			try {
				var stats = fs.statSync(pathDir + "/" +bin);
				//console.info("stats: ", stats);
				 if(stats) {
				 	result = true;
				 }
			} catch (exception) {

			}

		});

	 	test.ok(result, "Binary found");
	 	test.done();
	},
	"Test xdotool" : function(test) {

		var process = require('process');
		var path = require('path');
		var fs = require('fs');

		test.expect(1);

		// Look for required minary in path
		var result = false;
		//console.info("process.env", process.env);
		process.env.PATH.split(path.delimiter).forEach(function(pathDir) {
			//console.info("Pathdir: ", pathDir);

			var bin = process.env.npm_package_config_xdotool;

			//console.info("le: ", keyboardbin);
			//console.info("...", path.join(pathDir, "onboard"));
			try {
				var stats = fs.statSync(pathDir + "/" +bin);
				//console.info("stats: ", stats);
				 if(stats) {
				 	result = true;
				 }
			} catch (exception) {

			}

		});

	 	test.ok(result, "Binary found");
	 	test.done();
	},
	"Test pactl" : function(test) {

		var process = require('process');
		var path = require('path');
		var fs = require('fs');

		test.expect(1);

		// Look for required minary in path
		var result = false;
		//console.info("process.env", process.env);
		process.env.PATH.split(path.delimiter).forEach(function(pathDir) {
			//console.info("Pathdir: ", pathDir);

			var bin = process.env.npm_package_config_pactl;

			//console.info("le: ", keyboardbin);
			//console.info("...", path.join(pathDir, "onboard"));
			try {
				var stats = fs.statSync(pathDir + "/" +bin);
				//console.info("stats: ", stats);
				 if(stats) {
				 	result = true;
				 }
			} catch (exception) {

			}

		});

	 	test.ok(result, "Binary found");
	 	test.done();
	},
});