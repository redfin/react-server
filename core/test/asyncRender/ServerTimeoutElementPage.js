var React = require("react")
,	Q = require("q")
,	getCurrentRequestContext = require("../../common").getCurrentRequestContext
;

var DATA_WAIT = 10
,	ELEMENT_DELAY = 500
;

class ServerTimeoutElementPage {
	
	handleRoute (next) {
		if (SERVER_SIDE) {
			// guarantee that element render is longer than data wait
			getCurrentRequestContext().setDataLoadWait(DATA_WAIT);
		}
		return next();
	}

	getElements() {
		// this is more than the server timeout for rendering, so it should NOT render server-side.
		return Q(<div id="main">rendered!</div>).delay(ELEMENT_DELAY);
	}
}

module.exports = ServerTimeoutElementPage;