#!/bin/bash
trap 'killall' INT


killall() {
    trap '' INT TERM     # ignore INT and TERM while shutting down
    echo "**** Shutting down... ****"     # added double quotes
    kill -TERM 0         # fixed order, send TERM not INT
    wait
    echo DONE
}

# build code for client-side and server-side
mvn clean package

export R3S_CONFIGS="$(pwd)/target/config/dev"
export DEBUG="rf:*"

node ./target/node/compiled-app.js
