
/**
 * This class wraps a Request object from the Express Server and provides the react-server Request
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

	getHostname() {
		return this._wrappedRequest.hostname;
	}

	getProtocol() {
		return this._wrappedRequest.protocol;
	}

	getSecure() {
		return this._wrappedRequest.secure;
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
		return this._wrappedRequest.body;
	}

	getBundleData() {
		return false; // Not on the server.
	}

}

module.exports = ExpressServerRequest;
