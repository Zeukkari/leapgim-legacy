#!/bin/bash


socket="$1"
cmd="$2"

if [ "$cmd" == "off" ]; then
  tdtool --off $socket
elif [ "$cmd" == "on" ]; then
  tdtool --on $socket
else
	echo "Error! Unknown command";
fi