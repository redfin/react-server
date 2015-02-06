var superagent = require('superagent'),
	RLS = require('./RequestLocalStorage').getNamespace(),
	logger = require('../logging').getLogger(__LOGGER__),
	config = require("../config"),
	Q = require('q');

/**
 * Wrapper around superagent.Request. Passes through function calls
 * to the wrapped request, except for end() which it enhances with
 * caching for server-side requests.
 */
function Request(req) {
	logger.debug("Making wrapped request");
	this._req = req;
}

// mix in properties from superagent.Request,
// but skip the 'end' method -- we'll do that manaully
Object.keys(superagent.Request.prototype)
	.filter( propName => propName !== 'end' )
	.forEach( propName => {
		var originalProp = superagent.Request.prototype[propName];
		if (typeof originalProp === 'function') {
			Request.prototype[propName] = () => originalProp.apply(this._req, arguments);
		} else {
			Request.prototype[propName] = originalProp;
		}
	});

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
	if (this._req.method !== 'GET') {
		return superagentRequestEnd.apply(this._req, arguments);
	}

	var url = this._req.url;

	// get cache entry for url if exists; if server-side, create one if it doesn't already exist
	var entry = makeRequest.cache().entry(url, SERVER_SIDE /* createIfMissing */);
	if (!SERVER_SIDE && !entry) {
		return superagentRequestEnd.apply(this._req, arguments);
	}

	// no previous requesters? fire the request
	if (entry.requesters === 0) {
		superagentRequestEnd.call(this._req, function (err, res) {
			if (err) {
				entry.setError(err);
				return;
			}
			entry.setResponse(res);
		});
	}

	entry.whenDataReady().then( (res) => {
		fn(null, res);
	}, (err) => {
		fn(err);
	});

	return this;
}


// wrapper for superagent
function makeRequest (method, url) {
	var req = superagent.apply(null, arguments);
	
	// add default headers to request (if necessary)
	var defaultHeaders = makeRequest.defaultHeaders();
	if (defaultHeaders) {
		req.set(defaultHeaders);
	}

	return new Request(req);
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



makeRequest.cache = function () {
	if (!SERVER_SIDE) {
		var cache = window.__cache;
		if (!cache) {
			cache = window.__cache = new RequestDataCache();
		}
		return cache;
	}

	// TODO: why doesn't this work in the browser!?
	var cache = RLS().cache;
	if (!cache) {
		cache = RLS().cache = new RequestDataCache();
	}
	return cache;
}

/**
 * Get or set the default headers for TritonAgent's http requests.
 * If `headers` is specified, set them; else, return them.
 */
makeRequest.defaultHeaders = function (headers) {
	if (SERVER_SIDE) {
		if (typeof headers === 'undefined') {
			return RLS().defaultHeaders;
		}
		RLS().defaultHeaders = headers;
	} else {
		logger.warning("Attempted to set defaultHeaders in TritonAgent on the client");
	}
}

/**
 * An entry in the RequestDataCache
 */
class CacheEntry {

	constructor (cache, url) {
		this.cache = cache;
		this.url = url;
		this.requesters = 0;
		this.dfd = Q.defer();
		this.dfd.promise.fin/*ally*/( () => logger.debug(`Data resolved for: ${url}`) );
		this.loaded = false;
		this.res = undefined;
		this.err = undefined;
	}

	dehydrate () {
		return {
			url: this.url,
			requesters: this.requesters,
			loaded: this.loaded,
			res: this.res,
			err: this.err // TODO: does this do something reasonable for Error objects?
		};
	}

	rehydrate (state) {
		this.url = state.url;
		this.requesters = state.requesters;
		this.loaded = state.loaded;
		this.res = state.res;
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

	setResponse (res) {
		// TODO: store superagent response? or body? or payload?
		this.res = this._copyResponseData(res);
		this.loaded = true;
		this.dfd.resolve(this.res);
	}

	setError (err) {
		this.err = err;
		this.loaded = true;
		this.dfd.reject(this.err);
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

	// create a copy of the data on the superagent response suitable
	// for writing as JSON
	_copyResponseData (res) {
		var result = {};
		[
			"body",
			"text",
			/*'files'*/ // TODO
			"header",
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

	dehydrate () {

		var out = {};
		
		out.dataCache = {};

		var dataCache = this.dataCache;
		Object.keys(dataCache).forEach(function (url) {
			var result = dataCache[url];
			out.dataCache[url] = result.dehydrate();
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
	 * @param createIfMissing boolean default true
	 */
	entry (url, createIfMissing) {
		if (typeof createIfMissing === 'undefined') {
			createIfMissing = true;
		}
		logger.debug(`Getting cache entry for ${url}`)

		var cacheEntry = this.dataCache[url];
		if (!cacheEntry && createIfMissing) {
			cacheEntry = this.dataCache[url] = new CacheEntry(this, url);
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
		var promises = this.getAllRequests().map(req => req.entry.promise);
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

	lateArrival (url, res) {
		logger.debug(`Late arrival for ${url}`);
		var dataCache = this.dataCache;
		if (dataCache[url]) {
			dataCache[url].setResponse(res);
		} else {
			logger.debug("WTF?");
		}
	}

}
