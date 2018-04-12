export default class SourceContentsApi {
	setConfigValues() {
		return { isRawResponse: true };
	}

	getContentType() {
		return 'application/json';
	}

	getResponseData() {
		return JSON.stringify(require('../dir-contents.json'));
	}
}
