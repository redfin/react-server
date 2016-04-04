var Promise = require("bluebird");

class AsyncTitlePage {
	getTitle() {
		// this is a title that should display on the server, as it's less than the server timeout.
		return Promise.resolve("An asynchonous title").delay(150);
	}
}

module.exports = AsyncTitlePage;
