var Q = require("q");

class AsyncTitlePage {
	getTitle() {
		// this is a title that should display on the server, as it's less than the server timeout.
		return Q("An asynchonous title").delay(150);
	}
}

module.exports = AsyncTitlePage;