var cookie = require("cookie"),
	decode = require("querystring/decode");

/**
 * This class implements the Triton Request API for client-side transitions.
 */
class ClientRequest {

	constructor(url, {frameback}={}) {
		this._url = url;
		this._frameback = frameback;
	}

	setRoute(route) {
		this._route = route;
	}

	getUrl() {
		return this._url;
	}

	getFrameback() {
		return this._frameback;
	}

	getQuery() {
		var indexOfQuestion = this._url.indexOf("?");
		if (-1 === indexOfQuestion) {
			return {};
		}
		return decode(this._url.substring(indexOfQuestion + 1));
	}

	getRouteParams() {
		return this._route.params;
	}

	getMethod() {
		// I believe that client-side transitions should always be
		// HTTP GETs -sra.
		return "get";
	}

	getRouteName() {
		return this._route.name;
	}
	/*eslint-disable no-unused-vars */
	getHttpHeader(name, callback) {
		// this is a no-op; there are no HTTP headers on the client-side.
	}

	getHttpHeaders(callback) {
		// this is a no-op; there are no HTTP headers on the client-side.
	}
	/*eslint-enable no-unused-vars */
	getCookie(name) {
		return this.getCookies()[name];
	}

	getCookies() {

		return cookie.parse(document.cookie);
	}

	getBody() {
		console.error("ClientRequest.getBody not implemented.");
	}


}

module.exports = ClientRequest;
