
export default class EchoCssPage {
	setConfigValues() {
		return { isRawResponse: true };
	}
	getContentType() {
		return 'text/css';
	}
	getResponseData() {
		const {css} = this.getRequest().getQuery();
		return css;
	}
}
