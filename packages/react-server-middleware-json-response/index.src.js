export default class JsonResponseMiddleware {

	setConfigValues() {
		return { isRawResponse: true };
	}

	getContentType(next) {
		return next() || 'application/json';
	}

	getResponseData(next) {
		return next().then(data => JSON.stringify(data));
	}
}
