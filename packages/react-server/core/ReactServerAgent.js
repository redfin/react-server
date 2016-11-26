/**
 * maybe this will work?
 */

var RLS = require('./util/RequestLocalStorage').getNamespace()
,	Cache = require("./ReactServerAgent/Cache")
,	Request = require("./ReactServerAgent/Request")
,	Plugins = require("./ReactServerAgent/Plugins")
;


// wrapper for superagent
function makeRequest (method, url) {
	return new Request(method, url, API.cache());
}

const DATA_BUNDLE_PARAMETER = '_react_server_data_bundle';
const DATA_BUNDLE_OPTS      = {[DATA_BUNDLE_PARAMETER]: 1};


/**
 * A wrapper around superagent.
 * @module ReactServerAgent
 * @type {Object}
 */
var API = {

	DATA_BUNDLE_PARAMETER,

	/**
	 * Performs a GET request
	 * @method get
	 * @param  {String} url  The url to GET from
	 * @param  {Object} data The http params
	 * @return {Object}      The SuperAgent request
	 */
	get (url, data) {
		var req = makeRequest('GET', url);
		if (data) req.query(data);
		return req;
	},

	/**
	 * Performs a HEAD request
	 * @method head
	 * @param  {String} url  The url to HEAD
	 * @param  {Object} data The http params
	 * @return {Object}      The SuperAgent request
	 */
	head (url, data) {
		var req = makeRequest('HEAD', url);
		if (data) req.send(data);
		return req;
	},

	/**
	 * Performs a DEL request
	 * @method del
	 * @param  {String} url The url to DEL
	 * @return {Object}     The SuperAgent request
	 */
	del (url) {
		return makeRequest('DELETE', url);
	},

	/**
	 * Performs a PATCH request
	 * @method patch
	 * @param  {String} url  The url to PATCH
	 * @param  {Object} data The data to PATCH
	 * @return {Object}      The SuperAgent request
	 */
	patch (url, data) {
		var req = makeRequest('PATCH', url);
		if (data) req.send(data);
		return req;
	},

	/**
	 * Performs a POST request
	 * @method post
	 * @param  {String} url  The url to POST
	 * @param  {Object} data The data to POST
	 * @return {Object}      The SuperAgent request
	 */
	post (url, data) {
		var req = makeRequest('POST', url);
		if (data) req.send(data);
		return req;
	},

	/**
	 * Performs a PUT request
	 * @method put
	 * @param  {String} url  The url to PUT
	 * @param  {Object} data The data to PUT
	 * @return {Object}      The SuperAgent request
	 */
	put (url, data) {
		var req = makeRequest('PUT', url);
		if (data) req.send(data);
		return req;
	},

	/**
	 * Exposes the ReactServerAgent request data cache from RequestLocalStorage.
	 * @method cache
	 * @return {Object} The cache
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
	 * The callback function will take the Request instance as a parameter
	 * @method plugRequest
	 * @example
	 *     var defaultHeaders = { ... };
	 *     ReactServerAgent.plugRequest(function (request) {
	 *         // e.g.
	 *         request.set(defaultHeaders)
	 *     })
	 *
	 */
	plugRequest (pluginFunc) {
		Plugins.forRequest().add(pluginFunc);
	},

	/**
	 * Adds a plugin function that can be used to modify the response
	 * object before it is passed the caller's callback.
	 *
	 * The callback function will take err and response as parameters
	 * (like the callback to `end()`), and the request as well
	 * @method plugResponse
	 * @example
	 *     ReactServerAgent.plugResponse(function (err, response, request) {
	 *         // e.g.
	 *         console.log("Response received!", res.body);
	 *         res.wasLogged = true; // or whatever
	 *     })
	 *
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
