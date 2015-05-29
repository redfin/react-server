var React = require("react")
,	Q = require("q")
,	getCurrentRequestContext = require("../../common").getCurrentRequestContext
;

var DATA_WAIT = 500
,	ELEMENT_DELAY = 150
;

class AsyncElementPage {

	handleRoute (next) {
		if (SERVER_SIDE) {
			// guarantee that data wait is longer than element delay
			getCurrentRequestContext().setDataLoadWait(DATA_WAIT);
		}
		return next();
	}

	getElements() {
		// this is less than the server timeout for rendering, so it should render server-side.
		return Q(<div id="main">rendered!</div>).delay(ELEMENT_DELAY);
	}
}

module.exports = AsyncElementPage;