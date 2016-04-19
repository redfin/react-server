import Q from "q";

export default class DelayDataPage {
	setConfigValues() {
		return { isRawResponse: true };
	}
	getContentType() {
		return 'application/json';
	}
	getResponseData() {
		const { ms, val } = this.getRequest().getQuery();
		return Q.delay(ms||0)
			.then(() => val||JSON.stringify({'ok':true}));
	}
}
