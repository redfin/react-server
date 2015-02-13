var React = require("react"), 
	Q = require("q");

class ServerTimeoutElementPage {
	getElements() {
		// this is more than the server timeout for rendering, so it should NOT render server-side.
		return Q(<div id="main">rendered!</div>).delay(500);
	}
}

module.exports = ServerTimeoutElementPage;