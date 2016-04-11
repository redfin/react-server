import Q from "q";

export default class DelayDataPage {
	setConfigValues() {
		return { isRawResponse: true };
	}
	getContentType() {
		return 'application/json';
	}
	handleRoute(next) {
		return Q.delay(this.getRequest().getQuery().ms||0).then(next);
	}
	getResponseData() {
		return JSON.stringify({'ok': true});
	}
}
