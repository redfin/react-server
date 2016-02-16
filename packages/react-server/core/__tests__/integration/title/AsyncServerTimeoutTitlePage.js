var Q = require("q");

class AsyncServerTimeoutTitlePage {
	getTitle() {
		// this is a title that should NOT display on the server, as it's more than the server timeout.
		return Q("An asynchonous timeout title").delay(500);
	}
}

module.exports = AsyncServerTimeoutTitlePage;