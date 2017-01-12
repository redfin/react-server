export default class TestMiddleware {

	setConfigValues() {
		return { isRawResponse: true };
	}

	getContentType() {
		return 'text/plain';
	}

	handleRoute(next) {
		return next();
	}

	getResponseData(next) {
		return next().then(data => data + "Middleware iteration succeeded.\r\n");
	}
}
