var cookie = require("cookie"),
	decode = require("querystring/decode");

/**
 * This class implements the react-server request API for client-side transitions.
 */
class ClientRequest {

	constructor(url, {
		bundleData,
		frameback,
		reuseDom,
		reuseFrame,

		// These is for internal statekeeping.  Don't use it yourself.
		_framebackExit,
		_fromOuterFrame,
	}={}) {
		this._url = url;
		this._opts = {
			bundleData,
			frameback,
			reuseDom,
			reuseFrame,
			_framebackExit,
			_fromOuterFrame,
		}
	}

	setRoute(route) {
		this._route = route;
	}

	getUrl() {
		return this._url;
	}

	getOpts() {
		return this._opts;
	}

	getFrameback() {
		return this._opts.frameback;
	}

	getReuseDom() {
		return this._opts.reuseDom;
	}

	getReuseFrame() {
		return this._opts.reuseFrame;
	}

	getBundleData() {
		return this._opts.bundleData;
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
	getHttpHeader(name) {
		// this is a no-op; there are no HTTP headers on the client-side.
	}

	getHttpHeaders() {
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
