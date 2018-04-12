var React = require("react")
	, Q = require("q")
	;

var ELEMENT_DELAY = 150
	;

class AsyncElementPage {

	handleRoute(next) {
		return next();
	}

	getElements() {
		// this is less than the server timeout for rendering, so it should render server-side.
		return Q(<div id="main">rendered!</div>).delay(ELEMENT_DELAY);
	}
}

module.exports = AsyncElementPage;