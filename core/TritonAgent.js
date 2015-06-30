var RLS = require('./util/RequestLocalStorage').getNamespace()
,	Cache = require("./TritonAgent/Cache")
,	Request = require("./TritonAgent/Request")
,	RequestPlugins = require("./TritonAgent/RequestPlugins")
,	{ mixin } = require("./TritonAgent/util")
;


// wrapper for superagent
function makeRequest (method, url) {
	return new Request(method, url, makeRequest.cache());
}

var API = {

	get (url, data, fn) {
		var req = makeRequest('GET', url);
		if ('function' == typeof data) fn = data, data = null;
		if (data) req.query(data);
		if (fn) req.end(fn);
		return req;
	},

	head (url, data, fn) {
		var req = makeRequest('HEAD', url);
		if ('function' == typeof data) fn = data, data = null;
		if (data) req.send(data);
		if (fn) req.end(fn);
		return req;
	},

	del (url, data, fn) {
		var req = makeRequest('DELETE', url);
		if (fn) req.end(fn);
		return req;
	},

	patch (url, data, fn) {
		var req = makeRequest('PATCH', url);
		if ('function' == typeof data) fn = data, data = null;
		if (data) req.send(data);
		if (fn) req.end(fn);
		return req;
	},

	post (url, data, fn) {
		var req = makeRequest('POST', url);
		if ('function' == typeof data) fn = data, data = null;
		if (data) req.send(data);
		if (fn) req.end(fn);
		return req;
	},

	put (url, data, fn) {
		var req = makeRequest('PUT', url);
		if ('function' == typeof data) fn = data, data = null;
		if (data) req.send(data);
		if (fn) req.end(fn);
		return req;
	},

	/**
	 * Exposes the TritonAgent request data cache from RequestLocalStorage.
	 */
	cache () {
		var cache = RLS().cache;
		if (!cache) {
			cache = RLS().cache = new Cache();
		}
		return cache;
	},

	_clearCache () {
		delete RLS().cache;
	},

	/**
	 * Adds a plugin function that can be used to modify the Request
	 * object before the request is actually
	 * triggered.
	 *
	 * The callback function will take the Request instance as a parameter:
	 * ```
	 * var defaultHeaders = { ... };
	 * TritonAgent.plugRequest(function (request) {
	 *     // e.g.
	 *     request.set(defaultHeaders)
	 * })
	 * ```
	 */
	plugRequest (pluginFunc) {
		RequestPlugins.add(pluginFunc);
	}


}



module.exports = mixin(makeRequest, API);