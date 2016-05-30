// See docs/logging
if (SERVER_SIDE) {
	module.exports = require('./logging/server.js');
} else {
	module.exports = require('./logging/client.js');
}
