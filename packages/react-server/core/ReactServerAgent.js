var RLS = require('./util/RequestLocalStorage').getNamespace()
,	Cache = require("./ReactServerAgent/Cache")
,	Request = require("./ReactServerAgent/Request")
,	Plugins = require("./ReactServerAgent/Plugins")
;


const DATA_BUNDLE_PARAMETER = '_react_server_data_bundle';
const DATA_BUNDLE_OPTS      = {[DATA_BUNDLE_PARAMETER]: 1};

var API = {

	DATA_BUNDLE_PARAMETER,

	get (url, data) {
		var req = new Request('GET', url, API.cache());
		if (data) req.query(data);
		return req;
	},

	head (url, data) {
		var req = new Request('HEAD', url, API.cache());
		if (data) req.query(data);
		return req;
	},

	del (url) {
		return new Request('DELETE', url, API.cache());
	},

	patch (url, data) {
		var req = new Request('PATCH', url, API.cache());
		if (data) req.send(data);
		return req;
	},

	post (url, data) {
		var req = new Request('POST', url, API.cache());
		if (data) req.send(data);
		return req;
	},

	put (url, data) {
		var req = new Request('PUT', url, API.cache());
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

	_fetchDataBundle(url) {
		return API.get(url, DATA_BUNDLE_OPTS).then(data => JSON.stringify(data.body));
	},

	_rehydrateDataBundle(data) {
		API.cache().rehydrate(JSON.parse(data))
	},

}



module.exports = API;
