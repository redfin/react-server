var React = require("react")
,	Promise = require("bluebird")
;

var ELEMENT_DELAY = 500
;

class ServerTimeoutElementPage {

	handleRoute (next) {
		return next();
	}

	getElements() {
		// this is more than the server timeout for rendering, so it should NOT render server-side.
		return Promise.resolve(<div id="main">rendered!</div>).delay(ELEMENT_DELAY);
	}
}

module.exports = ServerTimeoutElementPage;
