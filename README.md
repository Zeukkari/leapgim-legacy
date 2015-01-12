# LeapGIM

LeapGIM is a general purpose input mapper for mapping Leap Motion hand gestures into other types of input. LeapGIM enables the Leap Motion controller to be used as a mouse controller and additionally enables hand gestures to be mapped to key presses and keyboard shortcuts.

The underlying idea is that using the Leap Motion controller as a mouse & keyboard replacement is not possible, since all the buttons can't feasibly be mapped to hand gestures. However, hand gestures would work as an intutive alternative to keyboard shortcuts, and a significant portion of desktop applications could be used with a small subset of possible mouse and keyboard input (e.g. mouse & arrow keys).

LeapGIM can be used as a prototyping platform to easily test a variety of hand gestures and their reliability.



Setup
=====

Prequisites
-----------

- Leap Motion v2 beta SDK
- NodeJS
- Java
- Python 2.x


Installation
------------

npm install leapgim


Notes:

- The node-java library installation is a bit tricky and I ran into issues on Windows and Linux. If you run into any issues see: https://github.com/joeferner/node-java


Usage
=====

node leapgim

node leapgim --config FILE



Default Gesture Mapping
=======================

In the default gesture mapping, left hand gestures are related to keyboard actions and right hand gestures are related to mouse actions.

Left Hand
---------

- Page up: with a light grabbing pose (grabStrength > 0.4), pull the hand up.
- Page down: with a light grabbing pose, pull the hand down.
 


Right hand
----------

- Mouse move: the mouse cursor will follow palm position as long as the hand is open and not on a grabbing pose ( i.e.grabStrength < 0.4 ). A grabbing pose will release the mouse cursor. Releasing the mouse cursor allowes the user to click small areas on the screen without accidentaly misplacing the cursor when performing a button click.
- Left mouse button hold: a pinching gesture between the thumb and the index finger will hold left mouse button down. Releasing the pinch will release the mouse button.
- Right mouse button hold: a pinching gesture between the thumb and the ring finger will hold right mouse button down. Releasing the pinch will release the mouse button.
- Left mouse button click: pull the hand downwards with a grabbing pose sufficient for cursor release will perform a right click.

Notice that there are two gestures related to left clicks. The pinching gesture enables drag and drop, but is too unreliable for clicking since it's extremely easy to accidently nudge the pointer.



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