var Q = require("Q");

class AsyncHttpHeadersPage {

	getHeaders() {
		return Q([
			["Content-Security-Policy", "example.com"],
		]);
	}
}

module.exports = AsyncHttpHeadersPage;
