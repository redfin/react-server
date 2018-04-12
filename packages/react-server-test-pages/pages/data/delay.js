import Q from "q";
import _ from "lodash";
import JsonResponseMiddleware from "react-server-middleware-json-response"

const BIG = n => _.range(+n).reduce((m, v) => (m['element_' + v] = v, m), {})

export default class DelayDataPage {

	static middleware() {
		return [JsonResponseMiddleware];
	}

	getResponseData() {
		const { ms, val, big } = this.getRequest().getQuery();
		return Q.delay(ms || 0)
			.then(() => val ? JSON.parse(val) : (big ? BIG(big) : { 'ok': true }));
	}
}
