import TestMiddleware from './test-middleware/TestMiddleware'
import _ from "lodash";

/**
* This page is a smoke test to determine whether or not the amount of middleware in
* a page is a performance bottleneck for react-server. It has a middleware chain of
* 1k copies of TestMiddleware, and the response is returned after this chain.
* Note that all that is done within the middleware itself is a small string being appended
* to the response. After the response is generated, the page is complete.
*/
export default class MiddlewarePage {

	static middleware() {
		return _.range(1000).map(() => TestMiddleware);
	}

	getResponseData() {
		return "";
	}
}
