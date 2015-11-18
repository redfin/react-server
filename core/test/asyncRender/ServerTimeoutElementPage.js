var React = require("react")
,	Q = require("q")
;

var ELEMENT_DELAY = 500
;

class ServerTimeoutElementPage {
	
	handleRoute (next) {
		return next();
	}

	getElements() {
		// this is more than the server timeout for rendering, so it should NOT render server-side.
		return Q(<div id="main">rendered!</div>).delay(ELEMENT_DELAY);
	}
}

module.exports = ServerTimeoutElementPage;