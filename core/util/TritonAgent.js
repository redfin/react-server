var superagent = require('superagent'),
	RLS = require('./RequestLocalStorage').getNamespace(),
	logger = require('../logging').getLogger(__LOGGER__),
	config = require("../config"),
	Q = require('q');

/**
 * Implements a subset of superagent's API. Packages up arguments
 * to pass to superagent under the hood.
 */
function Request(method, urlPath) {
	this._method = method;
	this._urlPath = urlPath;
	this._queryParams = {};
	this._postParams = {};
	this._headers = {};
	this._timeout = null;
	this._type = null;

	// public field
	this.aborted = void 0; //default to undefined
}

// we implement a subset of superagent's API. for the other methods,
// for now, we'll just throw an exception if they're called. By default,
// all methods throw exceptions, and we override some below
Object.keys(superagent.Request.prototype)
	.forEach( propName => {
		var originalProp = superagent.Request.prototype[propName];
		if (typeof originalProp === 'function') {
			Request.prototype[propName] = function () {
				throw new Error(`${propName}() from superagent's API isn't implemented yet.`);
			}
		}
	});

Request.prototype.agent = function (agent) {
	if (typeof agent === 'undefined') {
		return this._agent;
	}
	this._agent = agent;
	return this;
}

Request.prototype.method = function (method) {
	if (typeof method === 'undefined') {
		return this._method;
	}
	this._method = method;
	return this;
}

Request.prototype.urlPath = function (urlPath) {
	if (typeof urlPath === 'undefined') {
		return this._urlPath;
	}
	this._urlPath = urlPath;
	return this;
}

Request.prototype.query = function (queryParams) {
	if (typeof queryParams === 'undefined') {
		return mixin({}, this._queryParams);
	}
	mixin(this._queryParams, queryParams);
	return this;
}

Request.prototype.send = function (postParams) {
	if (typeof postParams === 'undefined') {
		return mixin({}, this._postParams);
	}
	mixin(this._postParams, postParams);
	return this;
}

Request.prototype.set = function (headers) {
	if (typeof headers === 'undefined') {
		return mixin({}, this._headers);
	}
	mixin(this._headers, headers);
	return this;
}

function mixin (to, from) {
	Object.keys(from).forEach( headerName => to[headerName] = from[headerName] );
	return to;
}

Request.prototype.timeout = function (timeout) {
	if (typeof timeout === 'undefined') {
		return this._timeout;
	}
	this._timeout = timeout;
	return this;
}

Request.prototype.type = function (type) {
	if (typeof type === 'undefined') {
		return this._type;	
	}
	this._type = type;
	return this;
}

/**
 * Wrap superagent's end() method to create an entry in a request-local
 * data cache that will be serialized to the client and replayed in the
 * browser.
 */
Request.prototype.end = function (fn) {
	var superagentRequestEnd = superagent.Request.prototype.end;

	// TODO: support both (err, res) and (res) function signatures
	if (fn.length !== 2) {
		throw `Callback passed to end() must be the two-arg version: (err, res)`;
	}

	// only do caching for responses for GET requests for now
	if (this._method !== 'GET') {
		applyPlugins(this);
		return superagentRequestEnd.apply(this._buildSuperagentRequest(), arguments);
	}

	var urlPath = this._urlPath;

	// get cache entry for url if exists; if server-side, create one if it doesn't already exist.
	// the cache key here needs to be the same server-side and client-side, so the full URL, complete
	// with host (which can vary between client and server) is not usable. The URL path (without the
	// host) works fine though.
	var entry = makeRequest.cache().entry(urlPath, SERVER_SIDE /* createIfMissing */, this._cacheWhitelist);
	if (!SERVER_SIDE && !entry) {
		// TODO: do we need a publicly-visible prefix? it seems like relative URLs would
		// be fine?
		applyPlugins(this);
		return superagentRequestEnd.apply(this._buildSuperagentRequest(), arguments);
	}

	// no previous requesters? fire the request
	if (entry.requesters === 0) {
		// update URL if we're actually making the call
		applyPlugins(this);
		superagentRequestEnd.call(this._buildSuperagentRequest(), function (err, res) {
			if (err) {
				entry.setError(err);
				return;
			}
			entry.setResponse(res);
		});
	}

	entry.whenDataReady().nodeify(fn);

	return this;
}

Request.prototype._buildSuperagentRequest = function () {
	var req = superagent(this._method, this._buildUrl());

	if (this._agent){
		req.agent(this._agent);
	}

	if (this._type) {
		req.type(this._type);
	}

	req.set(this._headers)
		.query(this._queryParams)
		.send(this._postParams)

	if (this._timeout) {
		req.timeout(this._timeout);
	}

	// cache the internal request, so that we can cancel it
	// if necessary (see: `abort()`)
	this._superagentReq = req;

	return req;
}

Request.prototype._buildUrl = function () {
	// only modify relative paths
	if (this._urlPrefix && this._urlPath.charAt(0) === '/') {
		return this._urlPrefix + this._urlPath;
	}
	return this._urlPath;
}


Request.prototype.getProtocol = function(){

	// Returns undefined if no protocol found.
	return (this._buildUrl().match(/^(.+?):/)||[])[1];
}

/**
 * Convenience method to treat the request as then-able (promise-like).
 * This is shorthand for the simple case. If you want access to the full
 * power of the underlying promise library, use `Request.asPromise()`
 */
Request.prototype.then = function (/*arguments*/) {
	var dfd = this.asPromise();
	dfd.catch( (err) => {
		if (err.status) {
			logger.warning(`Received HTTP code ${err.status} from server for URL ${this._urlPath}.\nResponse: ${err.response.text}.\nMessage: `, err);
		} else {
			logger.warning("TritonAgent raised exception", err);
		}
	});
	return dfd.then.apply(dfd, arguments);
};

/**
 * Convenience method wrapping `.end()` and returning a promise
 * that is resolved if the request is successful, and rejected if
 * the request results in an error.
 */
Request.prototype.asPromise = function () {
	var dfd = Q.defer();
	this.end(dfd.makeNodeResolver());
	return dfd.promise;
}

/**
 * Overriding superagent use() function to give a more descriptive
 * error message than just not including it altogether.
 */
Request.prototype.use = function () {
	throw `use() function is superseded by plugRequest(...)`;
}

/**
 * Get/Set the prefix used for relative URLs
 */
Request.prototype.urlPrefix = function (urlPrefix) {
	if (typeof urlPrefix === 'undefined') {
		return this._urlPrefix;
	}
	this._urlPrefix = urlPrefix;
	return this;
}

/**
 * Abort the active request. Passes through to superagent's
 * `abort()` method. Sets 'aborted' flag on this request
 */
Request.prototype.abort = function () {
	if (this._superagentReq) {
		this.aborted = true;
		this._superagentReq.abort();
	}
	return this;
}

/**
 * Enables saving the 'header' property in the response cache.
 * This is disabled by default to save space in the cache.
 */
Request.prototype.withHeaderInResponse = function () {
	if (typeof this._cacheWhitelist === 'undefined') {
		this._cacheWhitelist = [];
	}
	this._cacheWhitelist.push('header');
	return this;
}

// wrapper for superagent
function makeRequest (method, url) {
	return new Request(method, url);
}
module.exports = makeRequest;


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
		cache = RLS().cache = new RequestDataCache();
	}
	return cache;
}

makeRequest.requestPlugins = function () {
	var plugins = RLS().requestPlugins;
	if (!plugins) {
		plugins = RLS().requestPlugins = [];
	}
	return plugins;
}

/**
 * Adds a plugin function that can be used to modify the Request
 * object before the request is actually
 * triggered.
 *
 * The callback function will take the Request instanceo as a parameter:
 * ```
 * var defaultHeaders = { ... };
 * TritonAgent.plugRequest(function (request) {
 *     // e.g.
 *     request.set(defaultHeaders)
 * })
 * ```
 */
makeRequest.plugRequest = function (pluginFunc) {
	var rlsPlugins = makeRequest.requestPlugins();
	rlsPlugins.push(pluginFunc);
}

// private function
function applyPlugins (req) {
	// run any registered plugins
	var plugins = makeRequest.requestPlugins();
	plugins.forEach(function (pluginFunc) {
		pluginFunc.apply(null, [req]);
	})
}

// TODO: we should figure out a way to consolidate this with SuperAgentExtender
var responseBodyParsers = {
	'application/json': function (text) {
		if (text && text.trim) {
			text = text.trim();
		}
		if (/^{}&&/.test(text)) {
			text = text.substr(4);
		}
		return JSON.parse(text);
	}
}

/**
 * An entry in the RequestDataCache
 */
class CacheEntry {

	constructor (cache, url, cacheWhitelist) {
		this.cache = cache;
		this.url = url;
		this.cacheWhitelist = cacheWhitelist;
		this.requesters = 0;
		this.dfd = Q.defer();
		this.loaded = false;
		this.res = undefined;
		this.err = undefined;
	}

	dehydrate ( {responseBodyOnly} = {} ) {

		var err = this.err;
		if (err) {
			// create a shallow copy of the error object
			var errCopy = shallowCopy(err);
			if (errCopy.response) {
				errCopy.response = this._copyResponseForDehydrate(errCopy.response, { responseBodyOnly });
			}
		}

		return {
			url: this.url,
			requesters: this.requesters,
			loaded: this.loaded,
			res: this._copyResponseForDehydrate(this.res, { responseBodyOnly }),
			err: errCopy
		};
	}

	/**
	 * _copyResponseForDehydrate attempts to construct a canonical form of the response object
	 * that can be used later to reconstruct it. Its primary goal is to avoid duplication of
	 * the response body in both the `.text` and `.body` properties of the cached response object.
	 *
	 * There are several ways this could have been handled, but the purest way (as of right now)
	 * from the standpoint of the API appears to be to provide parsing functions for known
	 * response types (e.g., "application/json"). If the response content-type is known, we'll
	 * simply serialize a placeholder (`_hasBody`) indicating that we should try to reparse the
	 * body from the response text when rehydrating. If there is a parsed body on the response at
	 * the time of dehydrating and we *don't* recognize the response type, we'll serialize both
	 * `.text` and `.body`, paying a penalty in response size, but guaranteeing correctness.
	 * (We'll also log a warning saying that we should probably add another response type).
	 * 
	 */
	_copyResponseForDehydrate (res, {responseBodyOnly} = {}) {
		if (!res) return res;

		var resCopy = {};
		if (responseBodyOnly) {
			resCopy.body = res.body;
			return resCopy;
		}

		var parseable = !!responseBodyParsers[res.type];
		
		Object.keys(res).forEach( (prop) => {
			if ("body" === prop && parseable) {
				// don't copy body if it's a well-known (easily-parsed) content-type
				resCopy._hasBody = true;
			} else {
				if ("body" === prop) {
					// 'parseable' must be false. we should log a warning
					logger.warning(`TritonAgent needs responseBodyParser for content-type: ${res.type} to avoid duplicating data in cache body`);
				}
				resCopy[prop] = res[prop];
			}
		});
		return resCopy;
	}

	rehydrate (state) {

		// NOTE: rehydrate will be called _TWICE_ for late arrivals:
		// once initially, when not loaded, and once again when
		// the request arrives

		this.url = state.url;
		this.requesters = state.requesters;
		this.loaded = state.loaded;
		this.res = this._rehydrateResponse(state.res);
		this.err = state.err;
		
		// TODO FIXME: these won't work if the response from the server was an error

		if (this.loaded) {
			// call setResponse to resolve the deferred
			if (this.res) {
				this.setResponse(this.res);
			} else if (this.err) {
				this.setError(this.err);
			}
			logger.debug(`Rehydrating resolved url to cache: ${this.url}`);
		} else {
			logger.debug(`Rehydrating pending url to cache without data: ${this.url}`);
		}
	}

	_rehydrateResponse (res) {
		if (!res) return res;

		if (res._hasBody) {
			// re-parse the text of the response body serialized by the server. 
			// if the body wasn't in a known format, it will have been included directly

			var parse = responseBodyParsers[res.type];
			if (!parse) {
				logger.warning(`Unparseable content type for ${this.url}: ${res.type}, but response._hasBody was true. (This may be a bug in TritonAgent)`);
			}
			res.body = parse && res.text && res.text.length
				? parse(res.text)
				: null;
			delete res._hasBody;
		}

		return res;
	}

	setResponse (res) {
		// TODO: store superagent response? or body? or payload?

		if (SERVER_SIDE){

			// Pull out the pieces of the response we care about.
			// This would be a NOOP client-side, so we'll skip it.
			res = this._trimResponseData(res);
		}

		// Stash away a reference to the response.
		this.res    = res;
		this.loaded = true;

		if (SERVER_SIDE){

			// Deep copy.
			//
			// Leave ourselves with a clean copy of the original
			// response regardless of what mutation might happen
			// once stores get ahold of it.
			//
			// This is important to ensure that we provide the same
			// data from the cache when we wake up in the browser
			// as we initially provide on the server.
			//
			res = JSON.parse(JSON.stringify(res));
		}

		this.dfd.resolve(res);
	}

	setError (err) {

		if (SERVER_SIDE) {

			// If the error was caused by a server response, trim it
			// and serialize it like a regular response
			if (err && err.response) {
				err.response = this._trimResponseData(err.response);
			}
		}

		this.err = err;
		this.loaded = true;

		if (SERVER_SIDE) {
			// Deep copy, to make sure nobody plays with the 
			// object we put in the cache
			err = JSON.parse(JSON.stringify(err));
		}

		this.dfd.reject(err);
	}

	whenDataReady () {
		if (SERVER_SIDE) {
			// server-side, we increment the number of requesters
			// we expect to retrieve the data on the frontend
			this.requesters += 1;
			return this.dfd.promise;
		} else {
			// client-side, whenever someone retrieves data from the cache,
			// we decrement the number of retrievals expected, and when we
			// hit zero, remove the cache entry. 
			return this._requesterDecrementingPromise(this.dfd.promise);
		}
	}

	// for internal (triton middleware) calls
	whenDataReadyInternal () {
		return this.dfd.promise;
	}

	decrementRequesters () {
		logger.debug("Decrementing: " + this.url);
		this.requesters -= 1;
			
		if (this.requesters === 0) {
			delete this.cache.dataCache[this.url];
		}

		this.cache.checkCacheDepleted();
	}

	/**
	 * Chain a promise with another promise that decrements
	 * the number of expected requesters.
	 */
	_requesterDecrementingPromise (promise) {
		// regardless of whether we're resolved with a 'res' or 'err',
		// we want to decrement requests. the appropriate 'success' or 'error'
		// callback will be executed on whatever is chained after this method
		return promise.fin( resOrErr => {
			this.decrementRequesters();		
			return resOrErr;
		});
	}

	// Pull out the properties of the superagent response that we care
	// about and produce an object that's suitable for writing as JSON.
	_trimResponseData (res) {
		var result = {};
		[
			"body",
			"text",
			"type",

			/*'files'*/ // TODO

			/* "header",*/ // header is no longer included by default in the cache to save space
			"status",
			"statusType",
			"info",
			"ok",
			"clientError",
			"serverError",
			"error",

			"accepted",
			"noContent",
			"badRequest",
			"unauthorized",
			"notAcceptable",
			"notFound",
			"forbidden"
		].forEach( prop => {
			result[prop] = res[prop];
		});
		if (this.cacheWhitelist) {
			this.cacheWhitelist.forEach( prop => {
				result[prop] = res[prop];
			});
		}

		return result;
	}

}


/**
 * Cache of responses to API requests made server-side that will be
 * serialized as part of the initial page request and replayed in the
 * browser.
 */
class RequestDataCache {

	constructor () {
		this.dataCache = {};
	}

	dehydrate ({responseBodyOnly=false} = {}) {

		var out = {};
		
		out.dataCache = {};

		var dataCache = this.dataCache;
		Object.keys(dataCache).forEach(function (url) {
			var result = dataCache[url];
			out.dataCache[url] = result.dehydrate({ responseBodyOnly });
		});

		return out;
	}

	rehydrate (state) {

		logger.debug("Rehydrating RequestDataCache");

		// clear state
		var dataCache = this.dataCache = {};

		Object.keys(state.dataCache).forEach( (url) => {
			var cacheEntry = dataCache[url] = new CacheEntry(this, url);
			cacheEntry.rehydrate(state.dataCache[url]);
		});

	}

	/**
	 * Get (optionally creating if necessary) the entry for the given
	 * URL from the cache.
	 *
	 * @param createIfMissing boolean default false
	 * @param cacheWhitelist array default []
	 */
	entry (url, createIfMissing, cacheWhitelist) {
		if (typeof createIfMissing === 'undefined') {
			createIfMissing = false;
		}
		if (typeof cacheWhitelist === 'undefined') {
			cacheWhitelist = [];
		}
		logger.debug(`Getting cache entry for ${url}`)

		var cacheEntry = this.dataCache[url];
		if (!cacheEntry && createIfMissing) {
			cacheEntry = this.dataCache[url] = new CacheEntry(this, url, cacheWhitelist);
		}

		return cacheEntry;
	}

	/**
	 * Synchronously check if data is loaded already.
	 * Returns an object with a getData() function, to
	 * make it possible to check for the existence of a URL
	 * in the cache, but not actually retrieve if (if desired).
	 * Calling getData() will retrieve the data from the cache
	 * and decrement the number of requesters
	 */
	checkLoaded (url) {
		var cached = this.dataCache[url];

		if (cached && cached.res) {
			return {
				getData: () => {
					// sort of a synchronous promise thing
					cached.decrementRequesters();
					return cached.res;
				}
			};
		}
		return null;
	}

	markLateRequests () {
		this.getPendingRequests().forEach(req => req.entry.late = true);
	}

	getLateRequests () {
		return this.getAllRequests().filter(req => req.entry.late);
	}

	getPendingRequests () {
		return this.getAllRequests().filter(req => !req.entry.loaded);
	}

	getAllRequests() {
		return Object.keys(this.dataCache)
			.map(
				url => (
					{
						url   : url,
						entry : this.dataCache[url],
					}
				)
			);
	}

	whenAllPendingResolve () {
		var promises = this.getAllRequests().map(req => req.entry.dfd.promise);
		return Q.allSettled(promises);
	}

	/** 
	 * Fires when the cache has been completely depleted, which is used as a signal to render when there was a timeout on the server.
	 */
	whenCacheDepleted () {
		this.whenCacheDepletedDfd = this.whenCacheDepletedDfd || Q.defer();

		this.checkCacheDepleted();

		return this.whenCacheDepletedDfd.promise;
	}

	checkCacheDepleted() {
		logger.debug("_checkCacheDepleted");
		if (this.whenCacheDepletedDfd) {
			var totalRequestersPending = 0;
			Object.keys(this.dataCache).forEach((name) => {
				if (this.dataCache[name].loaded) {
					totalRequestersPending += this.dataCache[name].requesters;
				}
			});
			logger.debug(`Checking for depleted cache, with ${totalRequestersPending} requesters left`);
			if (totalRequestersPending === 0) this.whenCacheDepletedDfd.resolve();
		}
	}

	lateArrival (url, dehydratedEntry) {
		logger.debug(`Late arrival for ${url}`);
		var dataCache = this.dataCache;
		if (dataCache[url]) {
			dataCache[url].rehydrate(dehydratedEntry);
		} else {
			logger.debug("WTF?");
		}
	}

	// helper method. Useful in unit-tests
	_clear () {
		delete RLS().cache;
	}

}

function shallowCopy(fromObj) {
	return [{}].concat(Object.keys(fromObj))
		.reduce( (toObj, k) => (toObj[k] = fromObj[k], toObj));
}
