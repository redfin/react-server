
/**
 * This class wraps a Request object from the Express Server and provides the Triton Request
 * API.
 */
class ExpressServerRequest {
	constructor(expressServerRequest) {
		this._wrappedRequest = expressServerRequest;
	}

	setRoute(route) {
		this._route = route;
	}

	getUrl() {
		return this._wrappedRequest.url;
	}

	getQuery() {
		return this._wrappedRequest.query;
	}

	getRouteParams() {
		return this._route.params;
	}

	getMethod() {
		return this._wrappedRequest.method;
	}

	getHttpHeader(name) {
		return this._wrappedRequest.get(name);
	}

	getRouteName() {
		return this._route.name;
	}

	getHttpHeaders() {
		return this._wrappedRequest.headers;
	}

	getCookie(name) {
		return this.getCookies()[name];
	}

	getCookies() {
		return this._wrappedRequest.cookies;
	}

	getBody() {
		throw new Error("ExpressServerRequest.getBody not implemented.");
	}

}

module.exports = ExpressServerRequest;
