#!/bin/bash

#
# Easy access wrapper script to Ubuntu media controls
#

cmd="$1"

if [ "$cmd" == "AudioRaiseVolume" ]; then
	# Volume up
	#pactl set-sink-volume 0 +10%
	xdotool key XF86AudioRaiseVolume
elif [ "$cmd" == "AudioLowerVolume" ]; then
	# Volume down
	#pactl set-sink-volume 0 -- -10%
	xdotool key XF86AudioLowerVolume 
elif [ "$cmd" == "AudioMute" ]; then
	# Mute
	xdotool key XF86AudioMute
elif [ "$cmd" == "AudioMuteOn" ]; then
	# Mute hold
	pactl set-sink-mute 0 1
elif [ "$cmd" == "AudioMuteOff" ]; then
	# Unmute
	pactl set-sink-mute 0 0
elif [ "$cmd" == "AudioNext" ]; then
	# Next track
	xdotool key XF86AudioNext
elif [ "$cmd" == "AudioPrev" ]; then
	# Previous track
	xdotool key XF86AudioPrev
elif [ "$cmd" == "AudioStop" ]; then
	# Stop playback
	xdotool key XF86AudioStop
elif [ "$cmd" == "AudioPlay" ]; then
	# Play (or play/pause)
	xdotool key XF86AudioPlay
elif [ "$cmd" == "AudioMedia" ]; then	
	# Media player
	xdotool key XF86AudioMedia
else
	echo "Error! Unknown command";
fi