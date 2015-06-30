var RLS = require('./util/RequestLocalStorage').getNamespace()
,	Cache = require("./TritonAgent/Cache")
,	Request = require("./TritonAgent/Request")
,	RequestPlugins = require("./TritonAgent/RequestPlugins")
;


// wrapper for superagent
function makeRequest (method, url) {
	return new Request(method, url, makeRequest.cache());
}

makeRequest.get = function (url, data, fn) {
	var req = makeRequest('GET', url);
	if ('function' == typeof data) fn = data, data = null;
	if (data) req.query(data);
	if (fn) req.end(fn);
	return req;
}

makeRequest.head = function (url, data, fn){
	var req = makeRequest('HEAD', url);
	if ('function' == typeof data) fn = data, data = null;
	if (data) req.send(data);
	if (fn) req.end(fn);
	return req;
};

makeRequest.del = function (url, fn){
	var req = makeRequest('DELETE', url);
	if (fn) req.end(fn);
	return req;
};

makeRequest.patch = function (url, data, fn){
	var req = makeRequest('PATCH', url);
	if ('function' == typeof data) fn = data, data = null;
	if (data) req.send(data);
	if (fn) req.end(fn);
	return req;
};

makeRequest.post = function (url, data, fn){
	var req = makeRequest('POST', url);
	if ('function' == typeof data) fn = data, data = null;
	if (data) req.send(data);
	if (fn) req.end(fn);
	return req;
};

makeRequest.put = function (url, data, fn){
	var req = makeRequest('PUT', url);
	if ('function' == typeof data) fn = data, data = null;
	if (data) req.send(data);
	if (fn) req.end(fn);
	return req;
};

/**
 * Exposes the TritonAgent request data cache from RequestLocalStorage.
 */
makeRequest.cache = function () {

	var cache = RLS().cache;
	if (!cache) {
		cache = RLS().cache = new Cache();
	}
	return cache;
}

makeRequest._clearCache = function () {
	delete RLS().cache;
}

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
makeRequest.plugRequest = function (pluginFunc) {
	RequestPlugins.add(pluginFunc);
}

module.exports = makeRequest;