var Q = require("q");

class AsyncHttpHeadersPage {

	getHeaders() {
		return Q([
			["Content-Security-Policy", "example.com"],
		]);
	}

	getContentType() {
		return "application/example";
	}
}

module.exports = AsyncHttpHeadersPage;
