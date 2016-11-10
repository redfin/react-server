export default class JsonResponseMiddleware {

	setConfigValues() {
		return { isRawResponse: true };
	}

	getContentType() {
		return 'application/json';
	}

	getResponseData(next) {
		return next().then(data => JSON.stringify(data));
	}
}
