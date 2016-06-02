import Q from "q";
import _ from "lodash";

const BIG = n => _.range(+n).reduce((m, v) => (m['element_'+v] = v, m), {})

export default class DelayDataPage {
	setConfigValues() {
		return { isRawResponse: true };
	}
	getContentType() {
		return 'application/json';
	}
	getResponseData() {
		const { ms, val, big } = this.getRequest().getQuery();
		return Q.delay(ms||0)
			.then(() => val||JSON.stringify(big?BIG(big):{'ok':true}));
	}
}
