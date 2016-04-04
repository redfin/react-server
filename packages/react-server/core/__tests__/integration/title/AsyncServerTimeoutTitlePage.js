var Promise = require("bluebird");

class AsyncServerTimeoutTitlePage {
	getTitle() {
		// this is a title that should NOT display on the server, as it's more than the server timeout.
		return Promise.resolve("An asynchonous timeout title").delay(500);
	}
}

module.exports = AsyncServerTimeoutTitlePage;
