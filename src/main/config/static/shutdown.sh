#!/bin/bash

R3S_PID=/redfin/r3s/.pid

PID=`cat $R3S_PID`

if [ ! -z $PID ]; then
	kill $PID
else
	echo "No PID file found at . Doing nothing."
fi