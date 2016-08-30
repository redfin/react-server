class HttpHeadersPage {

	getHeaders() {
		return [
			["Content-Security-Policy", "example.com"],
		];
	}

	getContentType() {
		return "application/example";
	}
}

module.exports = HttpHeadersPage;
