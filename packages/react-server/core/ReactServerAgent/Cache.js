
var logger = require('../logging').getLogger(__LOGGER__)
,	Q = require('q')
,	merge = require("lodash/merge")
,	isEqual = require("lodash/isEqual")
;

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
	},
}

/**
 * An entry in the RequestDataCache
 */
class CacheEntry {

	/**
	 * @param cache [required] the RequestDataCache instance that owns this
	 *        `CacheEntry`.
	 * @param requestData a request data descriptor. Won't be passed if this
	 *        CacheEntry is in the process of being rehydrated
	 * @param cacheWhiteList [optional] the whitelist of repsonse fields that
	 *        will be serialized with this entry. Not passed when rehydrating.
	 */
	constructor (cache, requestData = {}, cacheWhitelist) {
		this.cache = cache;
		this.cacheWhitelist = cacheWhitelist;
		this.requesters = 0;
		this.dfd = Q.defer();
		this.loaded = false;
		this.res = undefined;
		this.err = undefined;
		// copy the rest of the properties from input requestData
		// to this.requestData

		this.url = requestData.urlPath;
		this.requestData = {};
		Object.keys(requestData)
			.forEach(key => {this.requestData[key] = requestData[key]});
	}

	dehydrate ( {responseBodyOnly} = {} ) {

		var err = this.err;
		if (err) {
			// create a shallow copy of the error object
			var errCopy = merge({}, err);
			if (errCopy.response) {
				errCopy.response = this._copyResponseForDehydrate(errCopy.response, { responseBodyOnly });
			}
		}

		return {
			url: this.url,
			requestData: this.requestData,
			requesters: this.requesters,
			loaded: this.loaded,
			res: this._copyResponseForDehydrate(this.res, { responseBodyOnly }),
			err: errCopy,
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
					logger.warning(`ReactServerAgent needs responseBodyParser for content-type: ${res.type} to avoid duplicating data in cache body`);
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

		var err = state.err;
		if (err) {
			err.response = this._rehydrateResponse(err.response);
		}

		this.url = state.url;
		this.requestData = state.requestData;
		this.requesters = state.requesters;
		this.loaded = state.loaded;
		this.res = this._rehydrateResponse(state.res);
		this.err = err;

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
				logger.warning(`Unparseable content type for ${this.url}: ${res.type}, but response._hasBody was true. (This may be a bug in ReactServerAgent)`);
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

	// for internal (react-server middleware) calls
	whenDataReadyInternal () {
		return this.dfd.promise;
	}

	decrementRequesters () {
		logger.debug("Decrementing: " + this.url);
		this.requesters -= 1;

		if (this.requesters === 0) {
			this.cache._removeEntry(this);
		}
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

	isForSameRequest (requestData) {
		var otherRD = requestData;
		var myRD = this.requestData;

		function same(propName) {
			return isEqual(myRD[propName], otherRD[propName]);
		}

		// specifying the order of checks here to let the fast/common checks
		// fail first
		return same("urlPath")
			&& same("method")
			&& same("type")
			&& same("queryParams")
			&& same("postParams");
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
			"forbidden",
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
		/*
		 * Map[String -> CacheEntry[]]
		 */
		this.dataCache = {};
	}

	dehydrate ({responseBodyOnly=false} = {}) {

		var out = {
			dataCache: {},
		};

		var dataCache = this.dataCache;
		Object.keys(dataCache).forEach(url => {
			// as a nice-to-have for FragmentDataCache, if there's only one entry
			// for a given URL, don't serialize it as an array, serialize it as a single
			// CacheEntry
			var dehydratedEntries =
				dataCache[url].map(entry => entry.dehydrate({ responseBodyOnly }));
			out.dataCache[url] = dehydratedEntries.length === 1 ? dehydratedEntries[0] : dehydratedEntries;

		});

		return out;
	}

	rehydrate (state) {

		logger.debug("Rehydrating RequestDataCache");

		// clear state
		var dataCache = this.dataCache = {};

		Object.keys(state.dataCache).forEach(url => {

			var entries = state.dataCache[url];
			// convert entries to an array, if it was serialized as
			// a single entry
			entries = Array.isArray(entries) ? entries : [entries];
			dataCache[url] = entries.map(entryData => {
				var newEntry = new CacheEntry(this);
				newEntry.rehydrate(entryData);
				return newEntry;
			})
		});

	}

	/**
	 * Get (optionally creating if necessary) the entry for the given
	 * requestData from the cache.
	 *
	 * @param createIfMissing boolean default false
	 * @param cacheWhitelist array default []
	 */
	entry (requestData, createIfMissing = false, cacheWhitelist = []) {
		if (!requestData.urlPath) {
			throw new Error("Missing requestData.urlPath");
		}

		logger.debug(`Getting ReactServerAgent request data cache entry for ${requestData.urlPath}`)

		var cacheEntry = this._findEntry(requestData);
		if (!cacheEntry && createIfMissing) {
			cacheEntry = this._addEntry(requestData, cacheWhitelist);
		}

		return cacheEntry;
	}

	_findEntry (requestData) {
		var urlPath = requestData.urlPath;
		var entries = this.dataCache[urlPath] || [];
		// old-school loop so we can break early
		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i];
			if (entry.isForSameRequest(requestData)) {
				return entry;
			}
		}
		return null;
	}

	/**
	 * Add a new CacheEntry for the request described by `requestData`
	 *
	 * @param requestData the request data descriptor, as defined by
	 *        Request._getCacheAffectingData.
	 * @param cacheWhiteList the whitelist of fields that will be provided
	 *        on the request.
	 */
	_addEntry (requestData, cacheWhitelist) {
		var urlPath = requestData.urlPath,
			entries = this.dataCache[urlPath] || (this.dataCache[urlPath] = []),
			newEntry = new CacheEntry(this, requestData, cacheWhitelist);
		entries.push(newEntry);
		return newEntry
	}

	_removeEntry (entry) {
		var urlPath = entry.requestData.urlPath,
			entries = this.dataCache[urlPath],
			idx = entries.indexOf(entry);
		if (idx >= 0) {
			entries.splice(idx, 1);
		}
		this.checkCacheDepleted();
	}

	markLateRequests () {
		this.getPendingRequests().forEach(req => {req.entry.late = true});
	}

	getLateRequests () {
		return this.getAllRequests().filter(req => req.entry.late);
	}

	getPendingRequests () {
		return this.getAllRequests().filter(req => !req.entry.loaded);
	}

	getAllRequests() {
		var all = [];
		Object.keys(this.dataCache).forEach(url => {
			this.dataCache[url].forEach(entry => {
				all.push({ url, entry })
			})
		});
		return all;
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
			this.getAllRequests().forEach(req => {
				if (req.entry.loaded) {
					totalRequestersPending += req.entry.requesters;
				}
			});
			logger.debug(`Checking for depleted cache, with ${totalRequestersPending} requesters left`);
			if (totalRequestersPending === 0) this.whenCacheDepletedDfd.resolve();
		}
	}

	lateArrival (url, dehydratedEntry) {
		logger.debug(`Late arrival for ${url}`);
		var entry = this._findEntry(dehydratedEntry.requestData);
		if (entry) {
			entry.rehydrate(dehydratedEntry);
		} else {
			logger.debug("WTF?");
		}
	}

}

module.exports = RequestDataCache;
