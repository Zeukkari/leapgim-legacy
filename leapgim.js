/*
 * Load LeapJS - the variable needs to be global for plugin modules
 */

Leap = require('leapjs');


/*
 * Load LeapJS hand entry plugin
 */

require('./lib/leap.hand-entry.js');

/*
 * Quick configuration argument
 */

var args = process.argv.slice(2);

if(args[0] == "-c" || args[0] == "--config") {
  var configFile = args[1];
} else {
  var configFile = "./etc/config.json";
}

/*
 * Load JSON config from config.json
 */

config = require(configFile);


/*
 * Service Manager
 *
 * Provides monitoring, state querry and control functionality
 *
 */

var manager = (function(){

  var util = require('util');
  var path = require('path');

  var express = require('express');
  var app = express();
  var http = require('http').Server(app);
  var io = require('socket.io')(http);


  // File server for diagnostic page
  app.use(express.static(path.join(__dirname, 'www')));

  app.get('/', function (req, res) {
    res.redirect('/index.html');
  });

  io.on('connection', function(socket){
    console.log("Connection established");

    socket.on('query gesture record', function(){
      var gestureRecord = gestureController.getGestureRecord().gestureRecord;
      fireEvent('gesture record', gestureRecord);
    });

    socket.on('query timestamp data', function(){
      var timestamps = gestureController.getGestureRecord().gestureTimestamps;
      fireEvent('timestamps', timestamps);
    });

    socket.on('query hand info', function(){
      var handInfo = gestureController.handInfo(loopController.frame());
      fireEvent('hand info', handInfo);
    });

    socket.on('query pointer info', function(){
      var pointerInfo = gestureController.getPointerModel();
      fireEvent('pointer info', pointerInfo);
    });

    socket.on('query status info', function(){
      console.log("query status info");
      statusInfo();
    });

    socket.on('reconfigure', function(configFile){
      console.log("Reconfiguring with: " + configFile);
      newConfig = require(configFile);
      console.log("Reconfigure with: ", newConfig);
      gestureController.reconfigure(newConfig);
      config = newConfig;
      refreshInterval();
      console.log("Reconfiguration done!");
      audioController.audioReply("greenlight.mp3");
    })
  });

  http.listen(3000, function() {
    console.log("Listening on *:3000");
  });

  function sendMessage(msg) {
    io.emit("log message", msg);
  }

  function log() {
    var args = arguments;

    console.log(args);
    io.emit("log message", args);
  }

  function fireEvent(event, data) {
    io.emit(event, data);
  }

  return {
    fireEvent : fireEvent,
    log : log,
    info : log
  }
})();



/*
 * Audio controller
 *
 *
 */

var audioController = (function() {

  // var Player = require('player');

  // var player = new Player();

  // function audioReply(audiofile) {
  //   player.stop();
  //   player = new Player('./audio/' + audiofile);
  //   player.play();
  // }

  // var player = require('play-sound')(opts = {});

  // function audioReply(audioFile) {
  //   player.play('./audio/' + audioFile);
  // }


  function audioReply(audioFile) {

    //console.log("Audio reply: " + audioFile);

    if(!config.player) {
      return {
        audioReply : function(audioFile) {
          console.log("Attempted to play " + audioFile + ", but audio is disabled.");
        }
      }
    }

    var player = config.player;

    var exec = require('child_process').exec;
    var child = exec(player + ' ./audio/' + audioFile,
      function (error, stdout, stderr) {
        //console.log("Callback?");

        //console.info(error, stdout, stderr);
        //console.log('stdout: ' + stdout);
        //console.log('stderr: ' + stderr);
        if (stderr !== null) {
          console.log('exec error: ' + stderr);
        }
    });    
  }

  return {
    audioReply : audioReply
  }

})();


/*
 * Input controller
 *
 * This controller handles processing related to mouse and keyboard input events
 *
 */

var inputController = (function() {
  // https://github.com/joeferner/node-java
  var java = require('java');

  // https://docs.oracle.com/javase/7/docs/api/java/awt/Robot.html
  var Robot = java.import('java.awt.Robot');
  var robot = new Robot();

  /*
   * Mouse button model
   */

  var buttonModel = {
    button1Down : false,
    button2Down : false
  }

  /*
   * Tracks keyboard state for keyDown and keyUp events
   *
   * When a keyDown event is received the keyboard model will create a boolean property corresponding to that key code and set it to true.
   * This way the inputController won't send duplicate keyDown events for a key that is already pressed down.
   */

  var keyboardModel = {};


  // Key down tracking - release keys if enough time has passed
  var keyDownRecord = {};



  /*
   * Sensitivity
   *
   */
  var inputControllerSensitivity = 0;

  // Keeps track of cursor location between sensitivity changes
  // - initiate via java.awt.Robot
  var cursorModel = {
    x : pointerLocation().x,
    y : pointerLocation().y
  }

  function refreshPointerOrigin() {

    cursorModel = {
      x : pointerLocation().x,
      y : pointerLocation().y
    }

    //console.info("Pointer origin changed: ", cursorModel);
  }

  /*
   * Mouse button down handling
   *
   * Evoke a mouse event only if the button is not already active.
   */

  function mouseDown(button) {

    if(button == "MOUSE1") {

      // Mouse button already down
      if(buttonModel.button1Down) {
        return false;
      } else {
        buttonModel.button1Down = true;
        robot.mousePressSync(java.getStaticFieldValue("java.awt.event.InputEvent", "BUTTON1_DOWN_MASK"));
        console.log("Mouse1 down!");
        return true;
      }
    } else if(button == "MOUSE2") {
      // Mouse button already down
      if(buttonModel.button2Down) {
        return false;
      } else {
        buttonModel.button2Down = true;
        robot.mousePressSync(java.getStaticFieldValue("java.awt.event.InputEvent", "BUTTON3_DOWN_MASK"));
        console.log("Mouse2 down!");
        return true;        
      }
    }

    return false;
  }

  /*
   * Mouse button down handling
   *
   * Evoke a mouse event only if the button is currently active.
   * Supported argument values are "MOUSE1" and "MOUSE2"
   *
   */ 

  function mouseUp(button) {

    //console.log("Mouse up!");
    if(button == "MOUSE1") {

      // Mouse button already up
      if(buttonModel.button1Down) {
        buttonModel.button1Down = false;
        robot.mouseReleaseSync(java.getStaticFieldValue("java.awt.event.InputEvent", "BUTTON1_DOWN_MASK"));
        console.log("Mouse1 up!");
        return true;
      } else {
        return false;
      }
    } else if(button == "MOUSE2") {
      // Mouse button already up
      if(buttonModel.button2Down) {
        buttonModel.button2Down = false;
        robot.mouseReleaseSync(java.getStaticFieldValue("java.awt.event.InputEvent", "BUTTON3_DOWN_MASK"));
        console.log("Mouse2 up!");
        return true; 
      } else {
        return false;       
      }
    }

    return false;
  }

  /*
   * Mouse wheel
   *
   */

  function mouseWheel(wheelAmt) {

    robot.mouseWheelSync(wheelAmt);

    return true;

  }


  /*
   * Keyboard button down handling
   *
   * Evoke a key down event only if the button is not already active.
   * The supported argument values the keymasks used by java.awt.event.KeyEvent
   * A full list of possible argument values can be found in: https://docs.oracle.com/javase/7/docs/api/java/awt/event/KeyEvent.html
   *
   */

  function keyDown(button) {

    // Record or update key down time
    keyDownRecord[button] = new Date().getTime();

    if(!keyboardModel[button]) {
      robot.keyPressSync(java.getStaticFieldValue("java.awt.event.KeyEvent", button));
      keyboardModel[button] = true;
      console.log("Key down: " + button);
      return true;
    } else {
      return false;
    }

    return false;
  }


  /*
   * Keyboard button up handling
   *
   * Evoke a key up event only if the button is already active.
   * The supported argument values the keymasks used by java.awt.event.KeyEvent
   * A full list of possible argument values can be found in: https://docs.oracle.com/javase/7/docs/api/java/awt/event/KeyEvent.html
   *
   */

  function keyUp(button) {

    if(keyboardModel[button]) {
      robot.keyReleaseSync(java.getStaticFieldValue("java.awt.event.KeyEvent", button));
      console.log("Key up: " + button);
      keyboardModel[button] = false;
      // Delete keydown record
      keyDownRecord[button] = false;
      return true;
    } else {
      // Button already up
      return false;
    }

  return false;

  }

  /*
   * Get screen resolution using java awt
   */

  function getResolution() {
    var graphicsEnvironment = java.callStaticMethodSync("java.awt.GraphicsEnvironment", "getLocalGraphicsEnvironment");
    var graphicsDevice = java.callMethodSync(graphicsEnvironment, "getDefaultScreenDevice");
    var displayMode = java.callMethodSync(graphicsDevice, "getDisplayMode");

    var screenResolution = {
      height : java.callMethodSync(displayMode, "getHeight"),
      width : java.callMethodSync(displayMode, "getWidth")
    }

    return screenResolution;
  }


  /*
  * Get cursor location from java.awt.Robot instance
  */

  function pointerLocation() {
    var PointerInfo = java.callStaticMethodSync('java.awt.MouseInfo', "getPointerInfo");
    var point = java.callMethodSync(PointerInfo, "getLocation");

    var mouseLocation = {
      x : java.callMethodSync(point, "getX"),
      y : java.callMethodSync(point, "getY")
    }
    return mouseLocation;

  }


  /*
   * Trackpoint mouse move
   *
   * The idea here is move the cursor more with better precision by using the interaction box as a virtual trackball.
   * The cursor will move based on how far an extended right hand index finger is from the center of the interaction box.
   */

  function trackpointMove(xArg, yArg, fixedOrigin) {

    var resolution = getResolution();

    // Normalize pointer location

    if(fixedOrigin) {
      var pointerOrigin = {
        x : resolution.width / 2,
        y : resolution.height / 2
      }
    } else {
       var pointerOrigin = cursorModel;
    }

    var normalizedOrigin = {
      x : pointerOrigin.x / resolution.width,
      y : pointerOrigin.y / resolution.height
    }

    var x = xArg - normalizedOrigin.x;
    var y = yArg - normalizedOrigin.y;

    //console.info("TrackpointMove x: " + x + ", y: " + y);

    // Omit pointer move if cursor is close to the pointer origin. This makes precission mouse clicks easier.
    if(Math.abs(x) < 0.05 && Math.abs(y) < 0.05) {
      return;
    } else {
      var width = resolution.width;
      var height = resolution.height;

      var vectorX = Math.round(x * 25);
      var vectorY = Math.round(y * 25);
    }

    var currentLocation = pointerLocation();

    var newX = currentLocation.x + vectorX;
    var newY = currentLocation.y + vectorY;

    // Mouse move
    robot.mouseMoveSync(newX, newY);
  }


  /*
   * Mouse move
   *
   */

  function touchpadMove(xArg, yArg, sensitivityArg) {

    if(sensitivityArg < 0.1) {
      return;
    }

    //console.info("touchpadMove x: " + xArg + ", y: " + yArg +", sensitivity: " + sensitivityArg);
    //console.info("sensitivity: " + sensitivityArg);

    var sensitivity = sensitivityArg || 1.1;

    var resolution = getResolution();

    // Touch area size
    var leapResolution = {
      width : resolution.width * sensitivity,
      height : resolution.height * sensitivity
    }
    // Mouse pointer coordinates before move. This is used for focusing mouse interaction area.
    var pointerOrigin = cursorModel;

    var normalizedOrigin = {
      x : pointerOrigin.x / resolution.width,
      y : pointerOrigin.y / resolution.height
    }

    var leapOrigin = {
      x : normalizedOrigin.x * leapResolution.width,
      y : normalizedOrigin.y * leapResolution.height
    }

    // The offset between origins in monitor resolution and leap resolution
    var xOffset = pointerOrigin.x - leapOrigin.x;
    var yOffset = pointerOrigin.y - leapOrigin.y;

    // Coordinates in the reachable leap area without changing origin
    var leapX = xArg * leapResolution.width;
    var leapY = yArg * leapResolution.height;

    //console.info("leapX: ", leapX);
    //console.info("leapY: ", leapY);

    var x = leapX + xOffset;
    var y = leapY + yOffset;

    var newY = y;
    var newX = x;
    if(y < 0) {
      newY = 0;
    } else if (y > resolution.height) {
      newY = resolution.height;
    }
    if(x < 0) {
      newX = 0;
    } else if (x > resolution.width) {
      newX = resolution.width;
    }

    var fixedX = parseInt(newX);
    var fixedY = parseInt(newY);

    //console.log("Touchpad move to (", + fixedX + ", " + fixedY + ")");

    // Mouse move
    robot.mouseMoveSync(fixedX, fixedY);


    // Updating pointer origin after mouse move should increase stability.
    if( sensitivity != inputControllerSensitivity ) {
      //console.log("update sensitivity to: " + newSensitivity);
      refreshPointerOrigin();
      inputControllerSensitivity = sensitivity;
    }

  }

  /*
   * Release buttons based on timestamp record
   */

  function releaseButtons() {

    var currentTime = new Date().getTime();

    var keyDownTime = config.keyDownTime;

    for(var button in keyDownRecord) {
      if(currentTime - keyDownRecord[button] > keyDownTime) {
        keyUp(button);
      }
    }
  }

  return {
    touchpadMove : touchpadMove,
    trackpointMove : trackpointMove,
    mouseDown : mouseDown,
    mouseUp : mouseUp,
    keyUp : keyUp,
    keyDown : keyDown,
    mouseWheel : mouseWheel,
    releaseButtons : releaseButtons
  }

}());


/*
 * Gesture controller
 *
 * This controller inspects Leap Motion frame data and scans for gestures defined in the configuration file.
 */

var gestureController = (function(){
  

  /*
   * Pointer model
   *
   * The touchDistance is used as the z coordinate, but it's apparently not quite the same.
   * The touchDistance should be replaced with the actual z coordinate.
   */

  var pointerModel = {
    leftHand : {
      indexFinger : {
        x : 0,
        y : 0,
        touchDistance : 0
      },
      middleFinger : {
        x : 0,
        y : 0,
        touchDistance : 0
      },
      ringFinger : {
        x : 0,
        y : 0,
        touchDistance : 0
      },
      thumb : {
        x : 0,
        y : 0,
        touchDistance : 0
      },
      pinky : {
        x : 0,
        y : 0,
        touchDistance : 0
      }
    },
    rightHand : {
      indexFinger : {
        x : 0,
        y : 0,
        touchDistance : 0
      },
      middleFinger : {
        x : 0,
        y : 0,
        touchDistance : 0
      },
      ringFinger : {
        x : 0,
        y : 0,
        touchDistance : 0
      },
      thumb : {
        x : 0,
        y : 0,
        touchDistance : 0
      },
      pinky : {
        x : 0,
        y : 0,
        touchDistance : 0
      }
    }
  }


  // Used with mouse clicks to prevent multiple mouse clicks on continuous gestures
  var sleep = 0; 

  /*
   * Keep timestamp records for timed gesture actions.
   */

  //var timestampData = {};
  var gestureRecord = {};

  //Consecutive frames processed by the Leap have consecutive increasing values.
  var lastFrameProcessed = 0;

  /*
   * Clear gesture record. This method is called when a timed gesture is triggered.
   */

  function clearTimestamps() {
    timestampData = {};
  }


  /*
   * From Leap API
   *
   * https://developer.leapmotion.com/documentation/javascript/api/Leap.Hand.html
   */ 
  function findPinchingFingerType(hand){
    var pincher;
    var closest = 500;
    for(var f = 1; f < 5; f++) {
      var current = hand.fingers[f];
      var distance = Leap.vec3.distance(hand.thumb.tipPosition, current.tipPosition);

      if(current != hand.thumb && distance < closest) {
        closest = distance;
        pincher = current; 
      }
    }

    var distance = Leap.vec3.distance(hand.thumb.tipPosition, pincher.tipPosition);

    //console.info("pincher type: ", pincher.type);

    // if(distance > 30) {

    //   console.log("Skipping distance: " + distance);

    //   return false;
    // }



    return pincher;
  }

  function validatePinch(finger, hand, gestureData){

    //console.info("hand: ", hand);
    //console.info("finger: ", finger);

    if(!hand.thumb) {
      return false;
    }

    if(!hand[finger]) {
      return false;
    }

    var pinchingFinger = hand[finger];
    var distance = Leap.vec3.distance(hand.thumb.tipPosition, pinchingFinger.tipPosition);

    console.log("Pinch distance: " + distance);

    var magicPinchDistanceNumber = 30;

    return (distance < magicPinchDistanceNumber);

  }


  /*
   * Execute action
   *
   * An action is an input event for the mouse or the keyboard.
   */

  function executeAction(gestureData, gestureKey, tearDown) {

    var actionOk = true; // Used with inputController return values

    if(tearDown) {
      var action = gestureData.tearDownAction;
    } else {
      var action = gestureData.action;
    }
    


    // // Clear gesture record
    // if(gestureKey) {
    //   gestureRecord[gestureKey] = 0;  
    // }

    //console.info("Action: ", action);

    if(sleep) {
      //console.log("Sleeping.. action " + action.type + " omitted.");
      return;
    }  

    if(action.type == "touchpadMove") {

      // var cursorHand = pointerConfig.hand;
      // var cursorFinger = pointerConfig.focusPoint;
      var cursorHand = gestureData.pointer.hand;
      var cursorFinger = gestureData.pointer.focusPoint;

      var handCoordinatePoint = pointerModel[cursorHand][cursorFinger];

      inputController.touchpadMove(handCoordinatePoint.x, handCoordinatePoint.y, action.sensitivity);
    } else if(action.type == "focusMove") {

      var cursorHand = gestureData.pointer.hand;
      var cursorFinger = gestureData.pointer.focusPoint;

      var handCoordinatePoint = pointerModel[cursorHand][cursorFinger];

      // Use z coordinate as sensitivity
      var touchDistance = handCoordinatePoint.touchDistance;

      var sensitivityFactor = action.sensitivity || 1;

      // Normalize from [-1,1] to [0,2]
      var sensitivity = (touchDistance + 1.1) * sensitivityFactor;

      // Clamp
      if(sensitivity < 0.01) {
        //sensitivity = 0.01;
        return;
      }


      inputController.touchpadMove(handCoordinatePoint.x, handCoordinatePoint.y, sensitivity);
    } else if(action.type == "grabFocusMove") {

      var cursorHand = gestureData.pointer.hand;
      var cursorFinger = gestureData.pointer.focusPoint;

      var grabStrength = pointerModel[cursorHand].grabStrength;
      console.log("grabStrength: " + grabStrength);

      // var pinchStrength = pointerModel[cursorHand].pinchStrength;
      // console.log("pinchStrength: " + pinchStrength);

      // var sensitivity = 1 - Math.max(grabStrength, pinchStrength);
      var sensitivity = 1 - grabStrength;

      console.log("sensitivity: ", sensitivity);

      var handCoordinatePoint = pointerModel[cursorHand][cursorFinger];

      //console.info("hand coordinate point: ", handCoordinatePoint);

      inputController.touchpadMove(handCoordinatePoint.x, handCoordinatePoint.y, sensitivity);
    } else if(action.type == "trackpointMove") {

      //console.log("trackpointMove");

      // var cursorHand = pointerConfig.hand;
      // var focusPoint = pointerConfig.focusPoint;
      // var useFixedOrigin = pointerConfig.useFixedOrigin;
      var cursorHand = gestureData.pointer.hand;
      var focusPoint = gestureData.pointer.focusPoint;
      var useFixedOrigin = action.pointer.useFixedOrigin;

      var handCoordinatePoint = pointerModel[cursorHand][focusPoint];

      //console.info("handCoordinatePoint: ", handCoordinatePoint);
      //console.info("pointerModel: ", pointerModel);

      inputController.trackpointMove(handCoordinatePoint.x, handCoordinatePoint.y, useFixedOrigin);
    }
    else if (action.type == "mouseWheel") {
      console.log("Mouse wheel!");
      actionOk = inputController.mouseWheel(action.wheelAmt);
    }
    else if (action.type == "mouseDown") {
      //console.log("Mouse down!");
      actionOk = inputController.mouseDown(action.inputEvent);
    }

    else if (action.type == "mouseUp") {
      //console.log("Mouse up!");
      actionOk = inputController.mouseUp(action.inputEvent);
    }

    else if (action.type == "mouseClick") {
      actionOk = actionOk && inputController.mouseDown(action.inputEvent);
      actionOk = actionOk && inputController.mouseUp(action.inputEvent);
    }

    // Keyboard button press events
    else if(action.type == "keyPress") {
      var inputEvent = action.inputEvent;

      //console.info("Attempt key press: " + inputEvent);

      actionOk = actionOk && inputController.keyDown(inputEvent);
      actionOk = actionOk && inputController.keyUp(inputEvent);
    }

    else if (action.type == "keyDown") {
      var inputEvent = action.inputEvent;

      //console.info("Attempt key down: " + inputEvent);

      actionOk = inputController.keyDown(inputEvent);
    }
    else if (action.type == "keyUp") {
      var inputEvent = action.inputEvent;

      //console.info("Attempt key up: " + inputEvent);

      actionOk = inputController.keyUp(inputEvent);
    }
    else if (action.type == "exec") {

      // TODO: Basic error checking and exception handling

      var cmd = action.cmd;
      console.log("Execute command: ", cmd);

      var execFile = require('child_process').exec

      var child = execFile('./bin/' + cmd,
        function (error, stdout, stderr) {
          //console.log('stdout: ' + stdout);
          //console.log('stderr: ' + stderr);
          if (error !== null) {
            console.log('exec error: ' + error);
          }
      });
    }

    else if (action.type == "actionlist") {
      var actionArray = action.list;
      for (var actionIndex = 0; actionIndex<actionArray.length; actionIndex++) {
        var listAction = actionArray[actionIndex];
        executeAction({ action : listAction });
      }
    }

    if(actionOk) {
      //console.info("executed action: ", action);
    }

    // Audio reply
    if(actionOk && action.audioReply) {
      audioController.audioReply(action.audioReply);
    }

    if(actionOk == false) {
      //console.log("action was not ok");
      //console.info(action);
    }

    if(action.sleepAfter) {
      sleep = action.sleepAfter;
      setTimeout(function() {
        console.log("Awake again!");
        //console.info("gestureRecord after sleep: ", gestureRecord);
        sleep = 0;
      }, sleep);
    }
  }


  /*
   * Inspect a leap motion vector and parse it into a more intuitive value.
   *
   * Returns up/down/left/right/forward/backward
   */

  function leapDirection(normalVector, debug) {

    var vectorX = normalVector[0];
    var vectorY = normalVector[1];
    var vectorZ = normalVector[2];

    if(debug) {
      console.info("leapDirection: x: " + vectorX + ", y: " + vectorY + ", z:" + vectorZ );
    }

    // Up
    if(vectorX < 0.5 && vectorY > 0.5 && vectorZ < 0.5) {
      return "up";
    }

    // Down
    if(vectorX < 0.5 && vectorY < -0.5 && vectorZ < 0.5) {
      return "down";
    }
    // Left
    if(vectorX < -0.5 && vectorY < 0.5 && vectorZ < 0.5) {
      return "left";
    }
    // Right
    if(vectorX > 0.5 && vectorY < 0.5 && vectorZ < 0.5) {
      return "right";
    }
    // Forward
    if(vectorX < 0.5 && vectorY < 0.5 && vectorZ < -0.5) {
      return "forward";
    }
    // Backward
    if(vectorX < 0.5 && vectorY < 0.5 && vectorZ > 0.5) {
      return "backward";
    }
  }


  /*
   * A convenience method for mapping hand objects in a leap frame.
   */

  function mapHands(frame) {

    //console.info("frame: ", frame);
    //console.info("frame.hands.length: ", frame.hands.length);

    if(!frame.valid) {
      return false;
    }

    // No hands..
    if(frame.hands.length == 0) {
      return false;
    }

    var handMap = {};

    for( var i=0; i < frame.hands.length; i++ ){

      var hand = frame.hands[i];

      if(hand.type == "right") {
        handMap.rightHand = hand;
        //var rightHand = hand;
      }

      if(hand.type == "left") {
        handMap.leftHand = hand;
        //var leftHand = hand;
      }
    }

    return handMap; 
  }


  /*
   * Produce x and y coordinates for a leap pointable.
   */

  function relative3DPosition( frame, leapPoint ) {
    var iBox = frame.interactionBox;

    //console.info("iBox size: ", iBox.size);

    //var leapPoint = pointable.tipPosition;
    //var leapPoint = pointable.stabilizedTipPosition;
  
    var normalizedPoint = iBox.normalizePoint(leapPoint, false);

    // Translate coordinates so that origin is in the top left corner
    var x = normalizedPoint[0];
    var y = 1 - normalizedPoint[1];
    var z = normalizedPoint[2];

    // Map left and right hands differently
    // - Eases hand fatique
    // - Supports two hand gestures by discouraging gestures where hands are on top of each other.
    if(pointerConfig.handOffsets) {
      var hand = pointable.hand();
      if(!hand.valid) {
        return;
      }
      if(hand.type == "left") {
        var offset = 0.5;
      } else if(hand.type == "right") {
        var offset = -0.5;
      } else {
        // ...
        console.log("Error Hand is neither left nor right!");
        return;
      }

      x = x + offset;
    }
   
    // Clamp
    if (x < 0) {
      x = 0;
    }
    if (x > 1) {
      x = 1;
    }
    if (y < 0) {
      y = 0;
    }
    if (y > 1) {
      y = 1;
    }
    if (z < -1) {
      z = -1;
    }
    if (z > 1) {
      z = 1;
    }
    return {
      x : x,
      y : y,
      z : z
    }
  }


  /*
   * Update internal data model for all leap pointer objects (i.e. fingers)
   */

  function updatePointerModel(frame) {

    var handMap = mapHands(frame);

    //console.info("handmap: ", handMap);

    if(!handMap) {
      return;
    }

    for(var handType in handMap) {

      var hand = handMap[handType];

      if(hand.thumb) {
        var fingerType = "thumb";

        var finger = hand[fingerType];

        if(finger.extended) {
          //var fingerPos = relative3DPosition(frame, finger);
          var fingerPos = relative3DPosition(frame, finger.tipPosition, handType);
          pointerModel[handType][fingerType] = {
            x : fingerPos.x,
            y : fingerPos.y,
            touchDistance  : fingerPos.z
          }
        }
      }
      if(hand.pinky) {
        var fingerType = "pinky";

        var finger = hand[fingerType];

        if(finger.extended) {
          //var fingerPos = relative3DPosition(frame, finger);
          var fingerPos = relative3DPosition(frame, finger.tipPosition, handType);
          pointerModel[handType][fingerType] = {
            x : fingerPos.x,
            y : fingerPos.y,
            touchDistance  : fingerPos.z
          }
        }
      }
      if(hand.indexFinger) {
        var fingerType = "indexFinger";

        var finger = hand[fingerType];

        if(finger.extended) {
          //var fingerPos = relative3DPosition(frame, finger);
          var fingerPos = relative3DPosition(frame, finger.tipPosition, handType);
          pointerModel[handType][fingerType] = {
            x : fingerPos.x,
            y : fingerPos.y,
            touchDistance  : fingerPos.z
          }
        }
      }
      if(hand.middleFinger) {
        var fingerType = "middleFinger";

        var finger = hand[fingerType];

        if(finger.extended) {
          //var fingerPos = relative3DPosition(frame, finger);
          var fingerPos = relative3DPosition(frame, finger.tipPosition, handType);
          pointerModel[handType][fingerType] = {
            x : fingerPos.x,
            y : fingerPos.y,
            touchDistance  : fingerPos.z
          }
        }
      }
      if(hand.ringFinger) {
        var fingerType = "ringFinger";

        var finger = hand[fingerType];

        if(finger.extended) {
          //var fingerPos = relative3DPosition(frame, finger);
          var fingerPos = relative3DPosition(frame, finger.tipPosition, handType);
          pointerModel[handType][fingerType] = {
            x : fingerPos.x,
            y : fingerPos.y,
            touchDistance  : fingerPos.z
          }
        }
      }

      // Palm position
      var palmPos = relative3DPosition(frame, hand.palmPosition, handType);
      pointerModel[handType].palm = {
        x : palmPos.x,
        y : palmPos.y,
        touchDistance : palmPos.z
      }

      // Grab strength
      var grabStrength = hand.grabStrength;
      pointerModel[handType].grabStrength = grabStrength;

      // Pinch strength
      var pinchStrength = hand.pinchStrength;
      pointerModel[handType].pinchStrength = pinchStrength;

    }

    manager.fireEvent("pointer info", pointerModel);

  }

  function getPointerModel() {
    return pointerModel;
  }

  // TODO...p
  function singleHandInfo(hand) {

    var invalidData = {
        thumb : "invalid",
        indexFinger : "invalid",
        middleFinger : "invalid",
        ringFinger : "invalid",
        pinky : "invalid",
        palmDirection : "invalid",
        pinchStrength : "invalid",
        palmVelocity : "invalid",
        sphereRadius : "invalid",
        rotation : "invalid",
        grabStrength : "invalid"
    }

    if(!hand) {
      return invalidData;
    }

    if(!hand.valid) {
      return invalidData;
    }

    var data = {};

    if(hand.thumb && hand.thumb.extended) {
      data.thumb = 1;
    } else {
      data.thumb = 0;
    }
    if(hand.indexFinger && hand.indexFinger.extended) {
      data.indexFinger = 1;
    } else {
      data.indexFinger = 0;
    }
    if(hand.middleFinger && hand.middleFinger.extended) {
      data.middleFinger = 1;
    } else {
      data.middleFinger = 0;
    }
    if(hand.ringFinger && hand.ringFinger.extended) {
      data.ringFinger = 1;
    } else {
      data.ringFinger = 0;
    }
    if(hand.pinky && hand.pinky.extended) {
      data.pinky = 1;
    } else {
      data.pinky = 0;
    }  

    var normalVector = hand.palmNormal;
    data.palmDirection = leapDirection(normalVector);


    var pinchStrength = hand.pinchStrength;
    data.pinchStrength = pinchStrength;

    var palmVelocity = 'x: ' + hand.palmVelocity[0] + ', y: ' + hand.palmVelocity[1] + ", z:" + hand.palmVelocity[2];
    data.palmVelocity = palmVelocity;


    var previousFrame = loopController.frame(1);
    var rotation = hand.rotationAxis(previousFrame);
    var rotationStr = 'x: ' + rotation[0] + ', y: ' + rotation[1] + ", z:" + rotation[2];
    data.rotation = rotationStr;


    var grabStrength = hand.grabStrength;
    data.grabStrength = grabStrength;

    var sphereRadius = hand.sphereRadius;
    data.sphereRadius = sphereRadius;

    return data;

  }

  function handInfo(frame) {
    var handMap = mapHands(frame);

    var leftHandData = singleHandInfo(handMap.leftHand);
    var rightHandData = singleHandInfo(handMap.rightHand);

    return {
      leftHand : leftHandData,
      rightHand : rightHandData
    };
  }

  /*
   * Validate a hand against hand gesture data.
   */

  function validateHand(hand, handData, frame) {

    //console.log("pinchStrength: ", hand.pinchStrength);

    // Skip invalid hand objects.. these seem to be sometimes present.
    if(!hand.valid) {
      return false;
    }

    //console.info("handData: ", handData);
    //console.info("hand: ", hand);

    // Test
    //console.info("palmNormal: ", hand.palmNormal);

    //console.info("hand confidence: ", hand.confidence);

    // Check for undef since we want to allow extended fingers, unextended fingers and either for various gestures
    if(typeof handData.thumb !== 'undefined') {
      if(hand.thumb && handData.thumb != hand.thumb.extended) {
        return false;
      }
    }
    // Check for undef since we want to allow extended fingers, unextended fingers and either for various gestures
    if(typeof handData.indexFinger !== 'undefined') {
      if(hand.indexFinger && handData.indexFinger != hand.indexFinger.extended) {
        return false;
      }
    }
    // Check for undef since we want to allow extended fingers, unextended fingers and either for various gestures
    if(typeof handData.middleFinger !== 'undefined') {
      if(hand.middleFinger && handData.middleFinger != hand.middleFinger.extended) {
        return false;
      }
    }
    // Check for undef since we want to allow extended fingers, unextended fingers and either for various gestures
    if(typeof handData.ringFinger !=='undefined') {
      if(hand.ringFinger && handData.ringFinger != hand.ringFinger.extended) {
        return false;
      }
    }
    // Check for undef since we want to allow extended fingers, unextended fingers and either for various gestures
    if(typeof handData.pinky !== 'undefined') {
      if(hand.ringFinger && handData.pinky != hand.pinky.extended) {
        return false;
      }
    }

    // Palm direction: up, down, left, right, toward, forward
    if(handData.palmDirection) {
      // Vector [x, y, z] representing palm normal
      var normalVector = hand.palmNormal;
      var palmDirection = leapDirection(normalVector);
      //console.info("palmDirection: " + palmDirection, " handData.plamDirection: " + handData.palmDirection);
      if(handData.palmDirection != palmDirection) {
        return false;
      }

      //console.log("Returning true after palmDirection validation: " + palmDirection);
    }

    // Pinch strength
    if(typeof handData.pinchStrength !== 'undefined') {
      //console.log("pinchStrength: ", hand.pinchStrength);
      var pinchStrength = hand.pinchStrength;

      if(handData.pinchStrength.min) {
        if(pinchStrength < handData.pinchStrength.min) {
          return false;
        }
      }

      if(handData.pinchStrength.max) {
        if(pinchStrength > handData.pinchStrength.max) {
          return false;
        }
      }
    }

    // Velocity
    // TODO: Figure out a use for this
    if(typeof handData.palmVelocity !== 'undefined') {
      //console.log("palmVelocity: ", hand.palmVelocity);

      var velocityX = hand.palmVelocity[0];
      var velocityY = hand.palmVelocity[1];
      var velocityZ = hand.palmVelocity[2];

      //console.log("palmVelocity y: ", velocityY);
      //console.log("palmVelocity z: ", velocityZ);

      if(handData.palmVelocity.x) {
        var coordinate = handData.palmVelocity.x;
        if(typeof coordinate.min !== 'undefined' && velocityX < coordinate.min) {
          return false;
        }
        if(typeof coordinate.max !== 'undefined' && velocityX > coordinate.max) {
          return false;
        }
      }

      if(handData.palmVelocity.y) {
        var coordinate = handData.palmVelocity.y;
        if(typeof coordinate.min !== 'undefined' && velocityY < coordinate.min) {
          return false;
        }
        if(typeof coordinate.max !== 'undefined' && velocityY > coordinate.max) {
          return false;
        }
      }

      if(handData.palmVelocity.z) {
        var coordinate = handData.palmVelocity.z;
        if(typeof coordinate.min !== 'undefined' && velocityZ < coordinate.min) {
          return false;
        }
        if(typeof coordinate.max !== 'undefined' && velocityZ > coordinate.max) {
          return false;
        }
      }
    }


    // Rotation
    // TODO: Figure out a use for this
    if(typeof handData.rotation !== 'undefined') {
      var previousFrame = loopController.frame(1);
      var rotation = hand.rotationAxis(previousFrame);

      //console.info("rotation: [" + rotation[0] + "," + rotation[1] + "," + rotation[2] + "]");

      var rotationX = rotation[0];
      var rotationY = rotation[1];
      var rotationZ = rotation[2];

      if(handData.rotation.x) {
        var coordinate = handData.rotation.x;
        if(typeof coordinate.min !== 'undefined' && rotationX < coordinate.min) {
          return false;
        }
        if(typeof coordinate.max !== 'undefined' && rotationX > coordinate.max) {
          return false;
        }
      }

      if(handData.rotation.y) {
        var coordinate = handData.rotation.y;
        if(typeof coordinate.min !== 'undefined' && rotationY < coordinate.min) {
          return false;
        }
        if(typeof coordinate.max !== 'undefined' && rotationY > coordinate.max) {
          return false;
        }
      }

      if(handData.rotation.z) {
        var coordinate = handData.rotation.z;
        if(typeof coordinate.min !== 'undefined' && rotationZ < coordinate.min) {
          return false;
        }
        if(typeof coordinate.max !== 'undefined' && rotationZ > coordinate.max) {
          return false;
        }
      }
    }

    // Grab strength
    //console.log("grabStrength: ", hand.grabStrength);
    if(typeof handData.grabStrength !== 'undefined') {
      if(typeof handData.grabStrength.min !== 'undefined') {
        if(hand.grabStrength < handData.grabStrength.min) {
          return false;
        }
      }
      if(typeof handData.grabStrength.max !== 'undefined') {
        if(hand.grabStrength > handData.grabStrength.max) {
          return false;
        }
      }
    }


    // Sphere radius
    //console.log("sphereRadius: ", hand.sphereRadius);
    if(typeof handData.sphereRadius !== 'undefined') {
      if(typeof handData.sphereRadius.min !== 'undefined') {
        if(hand.sphereRadius < handData.sphereRadius.min) {
          return false;
        }
      }
      if(typeof handData.sphereRadius.max !== 'undefined') {
        if(hand.sphereRadius > handData.sphereRadius.max) {
          return false;
        }
      }
    }

    if(typeof handData.pinchFinger !== 'undefined') {

      var pinchFinger = findPinchingFingerType(hand);

      //console.info("pinchFinger: ", pinchFinger);

      // From https://developer.leapmotion.com/documentation/javascript/api/Leap.Finger.html#id49
      var nameMap = ["thumb", "indexFinger", "middleFinger", "ringFinger", "pinky"];
      var fingerName = nameMap[pinchFinger.type];

      //console.log("fingerName: ", fingerName);

      if(handData.pinchFinger != fingerName) {
        return false;
      }
    }


    //console.info("handData: ", handData);

    if(handData.pointer) {

      //var usePalmPosition = (handData.pointer == "palm");

      if(hand.type == "left") {
        var handType = "leftHand";
      } else if(hand.type == "right") {
        var handType = "rightHand";        
      }

      var handCoordinatePoint = pointerModel[handType][handData.pointer];
      //console.info("Finger x: ", handCoordinatePoint.x);
      //console.info("Finger y: ", handCoordinatePoint.y);
      //console.info("Finger z: ", handCoordinatePoint.touchDistance);

      //console.info("handData: ", handData);

      //console.log("handCoordinatePoint: ", handCoordinatePoint);

      // Test maxTouchDistance - value 0 is validation
      if(typeof handData.maxTouchDistance !== 'undefined') {
        //console.info("Touchdistance model: " + handCoordinatePoint.touchDistance + ", ref: " + handData.maxTouchDistance );
        if(handCoordinatePoint.touchDistance > handData.maxTouchDistance) {
          return false;
        }
      }
      if(typeof handData.minTouchDistance !== 'undefined') {
        //console.info("Touchdistance model: " + handCoordinatePoint.touchDistance + ", ref: " + handData.maxTouchDistance );
        if(handCoordinatePoint.touchDistance < handData.minTouchDistance) {
          return false;
        }
      }
      if(typeof handData.minX !== 'undefined') {
        if(handCoordinatePoint.x < handData.minX) {
          return false;
        }
      }
      if(typeof handData.maxX !== 'undefined') {
        if(handCoordinatePoint.x > handData.maxX) {
          return false;
        }
      }
      if(typeof handData.minY !== 'undefined') {
        if(handCoordinatePoint.y < handData.minY) {
          return false;
        }
      }
      if(typeof handData.maxY !== 'undefined') {
        if(handCoordinatePoint.y > handData.maxY) {
          return false;
        }
      }
    }

    return true;
  }


  /*
   * Validate a swipe gesture against gesture data.
   */

  function validateSwipe(swipe, gestureData, frame) {

    //console.log("Validate swipe: ", swipe);

    // Nothing to validate
    if(!gestureData.swipe) {
      return true;
    }

    if(gestureData.swipe.direction) {
      var normalVector = swipe.direction;
      var swipeDirection = leapDirection(normalVector);
      //console.log("swipe direction: ", swipeDirection);
      if(gestureData.swipe.direction != swipeDirection) {
        //console.log("Swipe validation failed on direction..");
        return false;
      }
    }

    // Validate hands..
    var handIds = swipe.handIds;
    var handMap = {};
    handIds.forEach(function(handId) {
      var hand = frame.hand(handId);
      if(hand.type == "left") {
        handMap.leftHand = hand;
      }
      if(hand.type == "right") {
        handMap.rightHand = hand;
      }
    });

    // Validate hands associated to this gesture
    if(!validateHands(handMap, gestureData, frame)) {

      // var hand = handMap.leftHand;
      // var debugHand = {
      //   thumb : hand.thumb.extended,
      //   pinky : hand.pinky.extended,
      //   indexFinger : hand.indexFinger.extended,
      //   middleFinger : hand.middleFinger.extended,
      //   ringFinger : hand.ringFinger.extended
      // }

      //console.log("Swipe hand validation failed...");
      //console.log("Hand state: ", debugHand);

      return false;
    }


    //console.info("Validate swipe: ", gestureData);

    //console.info(gestureData.swipe);


    return true;
  }


  /*
   * Validate a circle gesture against gesture data.
   */

  function validateCircle(circle, gestureData, frame) {

    // Nothing to validate
    if(!gestureData.circle) {
      return true;
    }

    if(gestureData.circle.direction) {
      var normalVector = circle.normal;
      var circleDirection = leapDirection(normalVector);
      //console.log("Circle direction: " + circleDirection);
      if(gestureData.circle.direction != circleDirection) {
        return false;
      }
    }

    if(gestureData.circle.progress) {
      var progress = circle.progress;

      console.info("progresS: ", progress);
      if(gestureData.circle.progress.min > progress) {
        return false;
      }
      if(gestureData.circle.progress.max < progress) {
        return false;
      }
    }

    // state ~ [start, stop, update]
    if(gestureData.circle.state) {
      if(circle.state != gestureData.circle.state) {
        return false;
      }
    }

    if(gestureData.circle.duration) {
      var duration = circle.duration / 1000; // process duration in milliseconds instead of microseconds.

      console.info("duratioN: ", duration);
      if(gestureData.circle.duration.min > duration) {
        return false;
      }
      if(gestureData.circle.duration.max < duration) {
        return false;
      }
    }

    // Alert! This aproach would filter the gesture data for valid fingers, 
    // but Im only observing a single pointable in any gesture so this is unnecessary.

    // var handMap = {
    //   leftHand : {
    //     "indexFinger" : 0,
    //     "middleFinger" : 0,
    //     "ringFinger" : 0,
    //     "pinky" : 0,
    //     "thumb" : 0
    //   },
    //   rightHand : {
    //     "indexFinger" : 0,
    //     "middleFinger" : 0,
    //     "ringFinger" : 0,
    //     "pinky" : 0,
    //     "thumb" : 0
    //   }
    // };

    // var pointableIds = circle.pointableIds;
    // pointableIds.forEach(function(pointableId) {
    //   var pointable = frame.pointable(pointableId);
    //   var hand = pointable.hand();

    //   if(hand.type == "left") {
    //     var handType = "leftHand";
    //   }
    //   if(hand.type == "right") {
    //     var handType = "rightHand";
    //   }

    //   if(!gestureData.circle[handType]) {
    //     gestureOk = false;
    //     return;
    //   }

    //   var nameMap = ["thumb", "indexFinger", "middleFinger", "ringFinger", "pinky"];
    //   var fingerName = nameMap[pointable.type];

    //   if(!fingerName) {
    //     gestureOk = false;
    //     return;
    //   }

    //   console.log("handType: " + handType + ", fingerName: " + fingerName);

    //   handMap[handType][fingerName] = 1;

    //   // Check for false positives - fail the gesture if an extra finger is detected.
    //   if(!gestureData.circle[handType][fingerName]) {
    //     gestureOk = false;
    //   }
    // });

    // for(var handType in {leftHand : {}, rightHand : {}}) {

    //   if(gestureData.circle[handType]) {
    //     for(var fingerName in gestureData.circle[handType]) {
    //       if(gestureData.circle[handType][fingerName] != handMap[handType][fingerName]) {
    //         console.log("Fail!");
    //         console.info("handMap: ", handMap);
    //         console.info("gestureData.circle: ", gestureData.circle); 
    //         return false;
    //       }
    //     }
    //   }

    // }

    return true;
  } 


  function validateHands(handMap, frameData, frame) {

    //console.info("validateHands...");
    //console.info("handMap: ", handMap);
    //console.info("frameData: ", frameData);

    if(!handMap) {
      return false;
    }

    var leftHand = handMap.leftHand;
    var rightHand = handMap.rightHand;

    // Process left hand gestures
    if(typeof frameData.leftHand !== 'undefined') {
      if(!leftHand) {
        //console.log("No left hand..");
        return false;
      }

      var hand = leftHand;
      var handData = frameData.leftHand;

      //console.info("validateHand: ", hand);
      //console.info("handData: ", handData);

      // var debugHand = {
      //   thumb : hand.thumb.extended,
      //   pinky : hand.pinky.extended,
      //   indexFinger : hand.indexFinger.extended,
      //   middleFinger : hand.middleFinger.extended,
      //   ringFinger : hand.ringFinger.extended
      // }

      // console.log("Validate left hand..");
      // console.log("handData: ", handData);
      // console.log("hand: ", debugHand);

      if( !validateHand(hand, handData, frame) ) {
        //console.log("Invalid left hand..");
        return false;
      }
    }

    // Process right hand gestures
    if(typeof frameData.rightHand !== 'undefined') {
      if(!rightHand) {
        //console.log("No right hand..");
        return false;
      }

      var hand = rightHand;
      var handData = frameData.rightHand;

      // var debugHand = {
      //   thumb : hand.thumb.extended,
      //   pinky : hand.pinky.extended,
      //   indexFinger : hand.indexFinger.extended,
      //   middleFinger : hand.middleFinger.extended,
      //   ringFinger : hand.ringFinger.extended
      // }

      // //console.info("validateHand: ", hand);
      // //console.info("handData: ", handData);

      // console.log("Validate right hand..");
      // console.log("handData: ", handData);
      // console.log("hand: ", debugHand);

      if( !validateHand(hand, handData, frame) ) {
        //console.log("Invalid right hand..");
        return false;
      }

    }

    // Process gestures accepted by both hands

    if(frameData.hand) {

      var handData = frameData.hand;

      for(var i=0; i<frame.hands.length; i++) {
        var hand = frame.hands[i];

        if(!hand.valid) {
          return false;
        }

        if( !validateHand(hand, handData, frame) ) {
          return false;
        }
      }

    }

    return true;

  }

  /*
   * Match a leap frame against a configured gesture.
   */

  function matchGesture(gesture, frame, step) {

    //console.info("matchGesture", gesture);
    //console.info("step: ", step);

    //console.info("Match gesture: ", gesture);
    //console.info("pointerConfig: ", pointerConfig);
    //console.info("step: ", step);

    if(!gesture) {
      return false;
    }

    if(gesture.stepArray) {
      // Step array overflow - no match
      if(step >= gesture.stepArray.length) {
        return false;
      }
      var frameData = gesture.stepArray[step].frameData;
    } else {
      var frameData = gesture.frameData;
    }

    // Map right hand and left hand
    var handMap = mapHands(frame);

    // Validate hands
    if(!validateHands(handMap, frameData, frame)) {
      return false;
    }

    //console.log("Hands ok without gesture...");

    // Leap API gestures: swipe and circle
    // Scan through gestures and only return true if a valid gesture is detected!   

    // Match swipe gesture

    if(frameData.swipe) {

      var swipeDetected = false;

      //console.info("Frame gestures: ", frame.gestures);

      if(frame.gestures.length > 0) {
        for(var i = 0; i < frame.gestures.length; i++) {
          var gesture = frame.gestures[i];

          // Process swipe gestures
          if(gesture.type == "swipe") {
            //console.info("swipe: ", gesture);
            if(validateSwipe(gesture, frameData, frame)) {
              swipeDetected = true;
            }
          }
        }
      }

      if(!swipeDetected) {
        return false;
      }
    }


    // Match circle gesture

    if(frameData.circle) {

      var circleDetected = false;

      if(frame.gestures.length > 0) {
        for(var i = 0; i < frame.gestures.length; i++) {
          var gesture = frame.gestures[i];

          // Process circle gestures
          if(gesture.type == "circle") {
            //console.info("circle: ", gesture);
            if(validateCircle(gesture, frameData, frame)) {
              circleDetected = true;
            }
          }
        }
      }

      if(!circleDetected) {
        return false;
      }
    }

    //console.log("Gesture matches!", gesture.action.type);

    return true;
  }

  function gestureTearDown(gestureKey) {
    // Execute possible tear down
    if(gestureRecord[gestureKey].tearDown) {
      //console.log("Tear down?", gestureKey);

      // Gesture does not match. Execute tear down action.
      if(actionMap[gestureKey].tearDownAction) {
        // Execute tear down action..
        console.log("Execute tearDown action: ", gestureKey);
        executeAction(actionMap[gestureKey], gestureKey, true);

        // TODO: Don't execute tear down if final step is still active
      }

      // Reset gesture record
      gestureRecord[gestureKey].tearDown = false;
      gestureRecord[gestureKey].step = 0;
      gestureRecord[gestureKey].timestamp = 0; 
    }   
  }


  /*
   * Update gesture record for a single configured gesture.
   */

  function updateGestureRecord(gestureKey, timestamp, step, leapFrame) {
    //console.info("Update gesture record..", gestureKey, ", timestamp: ", timestamp + ", step: " + step);
    //console.info("sleep: " + sleep);

    if(sleep) {
      //console.log("Sleeping.. action " + gestureKey + " omitted.");
      return;
    }

    var gestureBlocked = (blockingGesture && blockingGesture != gestureKey);

    //console.log("Blocking gesture: " + blockingGesture);

    if(!gestureRecord[gestureKey]) {
      gestureRecord[gestureKey] = {};
    }

    if(actionMap[gestureKey].continuous) {
      var isContinuous = true;
    } else {
      var isContinuous = false;
    }

    if(gestureBlocked) {
      console.log("Gesture blocked.. clearing timestamp record: " + gestureKey);
      gestureTearDown(gestureKey);
    } else {

      var gestureMatch = matchGesture(actionMap[gestureKey], leapFrame, gestureRecord[gestureKey].step);

      if(gestureMatch) {

        // Blocking flag
        if(actionMap[gestureKey].blocking) {
          blockingGesture = gestureKey;
        }

        // Multi step gestures
        if(actionMap[gestureKey].stepArray) {
          var gestureData = actionMap[gestureKey].stepArray[step];
        // Single step gestures
        } else {
          var gestureData = actionMap[gestureKey];
        }


        // Ok to execute..
        var gestureOk = false;

        // Timed gestures
        if(gestureData.time) {
          // A previous record exists.. calculate time
          if(gestureRecord[gestureKey].timestamp) {
            //console.info("Update gesture record time: ", timestamp - timestampData[gestureKey]);
            var timeCap = gestureData.time;
            if(timestamp - gestureRecord[gestureKey].timestamp > timeCap) {
              console.log("Increase gesture: " + gestureKey + " step (" + step + ")");

              gestureRecord[gestureKey].step = step+1;
              var gestureOk = true;

              // Start time for next step
              gestureRecord[gestureKey].timestamp = timestamp;
            } else {
              var gestureOk = false;
            }
          // A previous record does not exists. Record gesture start time
          } else {
            var gestureOk = false;

            // Start time
            gestureRecord[gestureKey].timestamp = timestamp;
          }
        // Immediate gestures (mouse move basically)
        } else {
          gestureRecord[gestureKey].step = step+1;
          var gestureOk = true;
        }

        if(gestureOk) {
          if(actionMap[gestureKey].stepArray) {

            // Multi step gestures
            if(gestureRecord[gestureKey].step == actionMap[gestureKey].stepArray.length) {
              console.log("Execute action: " + gestureKey);

              executeAction(actionMap[gestureKey], gestureKey);
              gestureRecord[gestureKey].tearDown = true;
              
            }
          } else {
            // Single step gestures
            executeAction(actionMap[gestureKey], gestureKey);
            gestureRecord[gestureKey].tearDown = true;
          }
        }
      } else {

        // If there is no match and this is a multi step gesture: match against previous gesture to keep blocking gestures active 
        if(gestureRecord[gestureKey].step > 0 && actionMap[gestureKey].stepArray) {
          var previousStep = gestureRecord[gestureKey].step-1;

          //console.log("Gesture " + gestureKey + " previous step: " + previousStep);

          var previousGestureStillActive = matchGesture(actionMap[gestureKey], leapFrame, previousStep);

          if(previousGestureStillActive) {
            
            // Blocking flag
            if(actionMap[gestureKey].blocking) {
              blockingGesture = gestureKey;
            }

            //console.log("Previous gesture step still active: " + gestureKey + "(" + previousStep + ")");

            // Maintain the gestureRecord step number
            gestureRecord[gestureKey].timestamp = timestamp;

          } else {

            //console.log("Previous step no longer active.." + gestureKey);

            //console.log("gestureKey: ", gestureKey);
            //console.log("previousStep: ", previousStep);

            // Gesture does not match - clear outdated gesture records
            var gestureData = actionMap[gestureKey].stepArray[previousStep];

            //console.info("gestureData: ", gestureData);

            var timeCap = gestureData.timeout;

            //console.info("timeCap: " + timeCap);

            if(timeCap) {
              //console.log("Time cap present");
              if(timestamp - gestureRecord[gestureKey].timestamp > timeCap) {
                gestureTearDown(gestureKey);
              }
            } else {
              gestureTearDown(gestureKey);
            }
          }
        } else {
        // Single step shit
          gestureTearDown(gestureKey);

        }
      }

      if(isContinuous) {
        gestureTearDown(gestureKey);
      }

      //console.log("GestureKey: ", gestureKey);
      //console.log("Step: ", step);

    }



    //console.info("gestureRecord after update: ", gestureRecord);
    manager.fireEvent("gesture record", gestureRecord);
  }

  var blockingGesture = "";

  /*
   * Update gesture records for all configured gestures.
   *
   * The gesture records track how long a gesture has been active.
   */

  function updateGestureRecords(leapFrame, timestamp) {

    //console.info("gestureRecord: ", gestureRecord);
    //console.info("timestampData: ", timestampData);

    //console.info("Update gesture records: ", timestamp);
    //console.info("Blocking gesture from previous frame: ", blockingGesture);
    
    //console.info("actionMap (A): ", actionMap);

    blockingGesture = "";

    //console.log("Last frame processed: ", lastFrameProcessed);

    if(lastFrameProcessed == leapFrame.id) {
      //console.log("Discard already processed frame..");
      return;
    }

    var currentPriority = 1;
    var keyArray = [];
    for (var gestureKey in actionMap) {
      keyArray.push(gestureKey);
    }
    keyArray.sort(function(keyA,keyB) {
      var priorityA = actionMap[keyA].priority || 6;
      var priorityB = actionMap[keyB].priority || 6;

      //console.info("priorityA: " + priorityA +", priorityB: " + priorityB);

      if(priorityA < priorityB) {
        return -1;
      } else if(priorityA > priorityB) {
        return 1;
      } else {
        return 0;
      }

    });

    //console.info("keyArray: ", keyArray);

    for(var i = 0; i<keyArray.length; i++) {
      var gestureKey = keyArray[i];

      //console.log("Gesture key: ", gestureKey);
      //console.log("Blocking gesture in loop: ", blockingGesture);

      if(blockingGesture && gestureKey != blockingGesture) {
        continue;
      }

      if(sleep) {
        // Sleeping..
        break;
      }

      //console.log("gestureKey: ", gestureKey);
      //console.info("actionMap[gestureKey]: ", actionMap[gestureKey]);

      // Initiate gesture record if one is not present
      if(!gestureRecord[gestureKey]) {
        gestureRecord[gestureKey] = {};
      }
      if(!gestureRecord[gestureKey].step) {
        gestureRecord[gestureKey].step = 0;
      }

      // Figure out gesture step
      var step = gestureRecord[gestureKey].step;

      updateGestureRecord(gestureKey, timestamp, step, leapFrame);

    }

    inputController.releaseButtons();

    //manager.fireEvent("gesture record", gestureRecord);
    //manager.fireEvent("timestamps", timestampData);

    //console.info("gestureRecord: ", gestureRecord);

    //console.log("Blocking gesture after loop: ", blockingGesture);
    //console.log("-----Iteration over---------");

    lastFrameProcessed = leapFrame.id;

  }

  function getGestureRecord() {
    return {
      gestureRecord : gestureRecord,
      gestureTimestamps : timestampData
    }
  }

  // Initial config
  var actionMap;
  var pointerConfig; 

  function configure(newConfig) {

    /*
      Possible actionMap hand parameters:  (https://developer.leapmotion.com/documentation/javascript/api/Leap.Hand.html)

      - grabStrength
      - direction
      - palmNormal
      - palmPosition
      - pinchStrength
      - sphereCenter
      - stabilizedPalmPosition
      - palmVelocity

    */
    actionMap = newConfig.actions;

    /*
     * Configure cursor pointable
     *
     * hand : [left, right]
     * finger : [thumb, indexFinger, middleFinger, ringFinger, pinky]
     */
    pointerConfig = newConfig.pointer;

    gestureRecord = {};
    timestampData = {};

    console.log("actionMap after reconfigure: ", actionMap);

  }

  configure(config);

  return {
    updateGestureRecords : updateGestureRecords,
    updatePointerModel : updatePointerModel,
    getPointerModel : getPointerModel,
    getGestureRecord : getGestureRecord,
    reconfigure : configure,
    handInfo : handInfo
  }

}());

function statusInfo() {
  var data = {};
  if(loopController.connected()) {
    data.connected = true
  } else {
    data.connected = false
  }

  if(loopController.streaming()) {
    data.streaming = true;
  } else {
    data.streaming = false;
  }
  manager.fireEvent("status info", data);

  return data;
}

/*
 * Leap motion controller
 */

var loopController = new Leap.Controller({
  enableGestures: true,
  frameEventName: 'deviceFrame'
});

// Use hand entry plugin. Logging hand entry is convenient since the user can be notified when leap motion is actually registering hand data.
loopController.use('handEntry');

// Remain operational when running in the background.
loopController.setBackground(true);


// Hand tracking event handlers

loopController.on('handFound', function(hand) {
   console.log("handFound");
   if(hand.type == "right") {
    //audioController.audioReply("rollover4.mp3"); 
   } else if(hand.type == "left") {
    //audioController.audioReply("rollover5.mp3");
   }

});
loopController.on('handLost', function(hand) {
  console.log("handLost");
  //audioController.audioReply("switch1.mp3");
});

// Device monitoring
loopController.on('deviceStreaming', function() {
  console.log("deviceStreaming");
  statusInfo();
  audioController.audioReply("greenlight.mp3");
});

loopController.on('deviceStopped', function() {
  console.log("deviceStopped");
  statusInfo();
  audioController.audioReply("redlight.mp3");
});

loopController.on('connected', function() {
  console.log("connected");
  statusInfo();
});

loopController.on('disconnected', function() {
  console.log("disconnected");
  statusInfo();
});

loopController.on('deviceConnected', function() {
  console.log("deviceConnected");
  statusInfo();
});

loopController.on('deviceDisconnected', function() {
  console.log("deviceDisconnected");
  statusInfo();
});

loopController.on('deviceRemoved', function() {
  console.log("deviceRemoved");
  statusInfo();
});

var loopInterval = config.loopInterval || 10;


/*
 * Process frames at fixed intervals
 *
 * We could alternatively listen to loopController for frame events and process
 * every new frame that the sensor device registers, but this approach isn't
 * feasible because of performance issues.
 */

function processFrame() {
  var frame = loopController.frame();

  if(!frame.valid) {
    console.log("Invalid frame!");
    return;
  }

  gestureController.updatePointerModel(frame);
  var timestamp = new Date().getTime();

  var handInfo = gestureController.handInfo(frame);
  manager.fireEvent("hand info", handInfo);

  gestureController.updateGestureRecords(frame, timestamp);  
}

var intervalId = setInterval( processFrame, loopInterval );


function refreshInterval() {

  console.log("Refresh interval!");

  console.log("old loopInterval: " + loopInterval);
  console.info("intervalId: ", intervalId);

  // Clear old
  clearInterval(intervalId);

  loopInterval = config.loopInterval || 10;

  console.log("new loopInterval: " + loopInterval);

  intervalId = setInterval( processFrame, loopInterval );
}


/*
 * Connect to websocket
 */

loopController.connect();

if(!loopController.streaming()) {
  console.log("Device is not operational");
}