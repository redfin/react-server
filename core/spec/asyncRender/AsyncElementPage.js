var React = require("react"), 
	Q = require("q");

class AsyncElementPage {
	getElements() {
		// this is less than the server timeout for rendering, so it should render server-side.
		return Q(<div id="main">rendered!</div>).delay(150);
	}
}

module.exports = AsyncElementPage;