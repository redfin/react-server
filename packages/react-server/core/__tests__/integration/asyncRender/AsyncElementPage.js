var React = require("react")
,	Promise = require("bluebird")
;

var ELEMENT_DELAY = 150
;

class AsyncElementPage {

	handleRoute (next) {
		return next();
	}

	getElements() {
		// this is less than the server timeout for rendering, so it should render server-side.
		return Promise.resolve(<div id="main">rendered!</div>).delay(ELEMENT_DELAY);
	}
}

module.exports = AsyncElementPage;
