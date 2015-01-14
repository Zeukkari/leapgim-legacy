# Leapgim

_Control mouse and keybord with Leap Motion

Leapgim is a general purpose input mapper for the Leap Motion (http://www.leapmotion.com) controller. It provides a way for mapping hand gestures into keyboard and mouse input. Hand gestures can also be used to evoke shell scripts.



Goals
=====

Leap Motion is a sensor device for detecting detecting hand motions. A neat little piece of future technology. My first thought was that I would love to use the controller as a mouse replacement. Unfortunately the controller works with Leap-enabled software only. The goal of this project is to enable the Leap Motion controller to be used with other software also.

The basic premise of this project is that the Leap Motion controller can't replace both the mouse and the keyboard, since all the possible actions that a user could perform with a keyboard and a mouse can't feasibly be mapped into hand gestures. But it doesn't have to! A significant portion of desktop applications could be used with a small subset of possible mouse and keyboard input.

This project provides a way to define custom hand gestures and evoke actions based on those gestures. Supported actions include mouse and keyboard control, and shell scripts. Hand gesture customization allows timed, multi-step gestures to be defined, and includes as much as possible from the offical API.

Leapgim can be used as a prototyping platform to easily test a variety of hand gestures and their reliability.



Features
========

- Invoke mouse & keyboard actions with hand gestures.
- Support for a variety hand gesture triggered actions:
	* Support for mouse move action.
	* Support for mouse button click, hold and release actions.
	* Support for mouse wheel rotation actions. 
	* Support for keyboard button press, hold and release actions.
	* Support for evoking bash scripts via hand gestures.
- Extensive hand gesture configurability:
	* Hand type
	* Extended fingers
	* Hand pose time
	* Swipe
	* Circle
	* Palm direction
	* Velocity
	* Grab strength
	* Pinch strength & pinch finger type
	* Gesture time
- Support for multistep hand gestures.
- Linux/OSX/Windows support (tested on Windows and Linux).
- Web based monitoring utility
- Command line monitoring and reconfiguration utility.



Default Gesture Mapping
=======================

In the default gesture mapping, left hand gestures are related to keyboard actions and right hand gestures are related to mouse actions.

Left hand:

- Page up: with a light grabbing pose (grabStrength > 0.4), pull the hand up.
- Page down: with a light grabbing pose, pull the hand down.
 


Right hand:

- Mouse move: the mouse cursor will follow palm position as long as the hand is open and not on a grabbing pose ( i.e.grabStrength < 0.4 ). A grabbing pose will release the mouse cursor. Releasing the mouse cursor allowes the user to click small areas on the screen without accidentaly misplacing the cursor when performing a button click.
- Left mouse button hold: a pinching gesture between the thumb and the index finger will hold left mouse button down. Releasing the pinch will release the mouse button.
- Right mouse button hold: a pinching gesture between the thumb and the ring finger will hold right mouse button down. Releasing the pinch will release the mouse button.
- Left mouse button click: pull the hand downwards with a grabbing pose sufficient for cursor release will perform a right click.
- Mouse wheel: circle gesture with only the index finger extended.

Notice that there are two gestures related to left clicks. The pinching gesture enables drag and drop, but is too unreliable for clicking since it's extremely easy to accidently nudge the pointer.



Setup
=====

Prequisites
-----------

- Leap Motion v2 beta SDK
- NodeJS
- Java


Installation
------------

npm install leapgim


Notes:

- Keyboard and mouse input are generated with java. The node-java library installation is a bit tricky and I ran into issues on Windows and Linux. If you run into any issues see: https://github.com/joeferner/node-java


Running
-------

node leapgim

node leapgim --config FILE


Configuration
-------------

The gesture mapping is defined as JSON. If no configuration file is specified the configuration defaults to config.json in the module root directory.