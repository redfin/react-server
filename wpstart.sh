#!/bin/bash
trap 'killall' INT

WEBPACK="./node_modules/webpack/bin/webpack.js"

EXTRAS="$1"

killall() {
    trap '' INT TERM     # ignore INT and TERM while shutting down
    echo "**** Shutting down... ****"     # added double quotes
    kill -TERM 0         # fixed order, send TERM not INT
    wait
    echo DONE
}

mvn clean

# build code for client-side, and then watch for changes
$WEBPACK --config webpack.config.js $EXTRAS

# build code for server-side, and start node
$WEBPACK --config webpack-node.config.js

node ./target/node/compiled-app.js

