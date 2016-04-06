var RLS = require('./util/RequestLocalStorage').getNamespace()
,	Q = require("q")
,	Cache = require("./ReactServerAgent/Cache")
,	Request = require("./ReactServerAgent/Request")
,	Plugins = require("./ReactServerAgent/Plugins")
;


// wrapper for superagent
function makeRequest (method, url) {
	return new Request(method, url, API.cache());
}

// REALLY don't want to accidentally cache data across requests on the server.
// We throw an error if `preloadDataForURL` is called server-side, but it's
// worth being doubly cautious here.
const DATA_BUNDLE_CACHE     = SERVER_SIDE?undefined:{};
const DATA_BUNDLE_PARAMETER = '_react_server_data_bundle';
const DATA_BUNDLE_OPTS      = {[DATA_BUNDLE_PARAMETER]: 1};

var API = {

	DATA_BUNDLE_PARAMETER,

	get (url, data) {
		var req = makeRequest('GET', url);
		if (data) req.query(data);
		return req;
	},

	head (url, data) {
		var req = makeRequest('HEAD', url);
		if (data) req.send(data);
		return req;
	},

	del (url) {
		return makeRequest('DELETE', url);
	},

	patch (url, data) {
		var req = makeRequest('PATCH', url);
		if (data) req.send(data);
		return req;
	},

	post (url, data) {
		var req = makeRequest('POST', url);
		if (data) req.send(data);
		return req;
	},

	put (url, data) {
		var req = makeRequest('PUT', url);
		if (data) req.send(data);
		return req;
	},

	/**
	 * Exposes the ReactServerAgent request data cache from RequestLocalStorage.
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
	 * ReactServerAgent.plugRequest(function (request) {
	 *     // e.g.
	 *     request.set(defaultHeaders)
	 * })
	 * ```
	 */
	plugRequest (pluginFunc) {
		Plugins.forRequest().add(pluginFunc);
	},

	/**
	 * Adds a plugin function that can be used to modify the response
	 * object before it is passed the caller's callback.
	 *
	 * The callback function will take err and response as parameters
	 * (like the callback to `end()`), and the request as well:
	 * ```
	 * ReactServerAgent.plugResponse(function (err, response, request) {
	 *     // e.g.
	 *     console.log("Response received!", res.body);
	 *     res.wasLogged = true; // or whatever
	 * })
	 * ```
	 */
	plugResponse (pluginFunc) {
		Plugins.forResponse().add(pluginFunc);
	},

	preloadDataForURL (url) {
		if (SERVER_SIDE) throw new Error("Can't preload server-side");
		if (!DATA_BUNDLE_CACHE[url]){
			DATA_BUNDLE_CACHE[url] = API._fetchDataBundle(url);
		}
		return DATA_BUNDLE_CACHE[url];
	},

	_fetchDataBundle(url) {
		return this.get(url, DATA_BUNDLE_OPTS).then(data => JSON.stringify(data.body));
	},

	_rehydrateDataBundle(url) {
		// If we don't have any then we can't use it.
		if (!DATA_BUNDLE_CACHE[url]) return Q();

		return DATA_BUNDLE_CACHE[url]
			.then(data => API.cache().rehydrate(JSON.parse(data)));
	},

}



module.exports = API;
