var cookie = require("cookie"),
	decode = require("querystring/decode");

/**
 * This class implements the react-server request API for client-side transitions.
 */
class ClientRequest {

	constructor(url, {
		bundleData,
		reuseDom,
	} = {}) {
		this._opts = {
			bundleData,
			reuseDom,
		}

		// Chop off the fragment identifier from the url i.e everything from the # to the end of the url
		// if it exists to make this consistent with ExpressServerRequest.
		var match = url.match(/([^#]*)/);
		if (match === null || !match[1]) {
			this._url = url
		} else {
			this._url = match[1];
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

	getReuseDom() {
		return this._opts.reuseDom;
	}

	getBundleData() {
		return this._opts.bundleData;
	}

	getQuery() {
		// Grab fragment after first "?"
		var match = this._url.match(/\?(.*)/);

		if (match === null || !match[1]) {
			return {};
		}

		return decode(match[1]);
	}

	getHostname() {
		var hostname = null;
		if (typeof window.location.hostname === "string") {
			hostname = window.location.hostname;
		}

		return hostname;
	}

	getProtocol() {
		var proto = null;
		if (typeof window.location.protocol === "string") {
			proto = window.location.protocol.replace(/:/g, '');
		}

		return proto;
	}

	getSecure() {
		return ('https' === this.getProtocol());
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
