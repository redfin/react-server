#!/bin/bash

# check for the candiru user
USERID=`id -n -u`
if [ "$USERID" != "candiru" ]; then
  echo "Error: user must be candiru to start commerce"
  exit 1
fi 

NODE_HOME=/platform/nodejs

# number of subprocesses
export CLUSTER=5

# optimize things (TODO: trunk, staging also?)
export NODE_ENV="production"

# Use this PID file
export R3S_PID="/redfin/r3s/.pid"

export R3S_CONFIGS="/redfin/r3s/conf"

export DEBUG="rf:*"

LOGDIR=/redfin/r3s/logs
echo "Starting R3S..."
echo "Logging to: $LOGDIR/r3s.log"

nohup $NODE_HOME/bin/node /redfin/r3s/compiled-app.js >> $LOGDIR/r3s.log 2>&1 &