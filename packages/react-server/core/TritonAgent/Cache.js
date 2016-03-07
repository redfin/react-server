
var logger = require('../logging').getLogger(__LOGGER__)
,	Q = require('q')
,	isArray = require("lodash/lang/isArray")
,	CacheEntry = require("./CacheEntry")
;

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
			entries = isArray(entries) ? entries : [entries];
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

		logger.debug(`Getting TritonAgent request data cache entry for ${requestData.urlPath}`)

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
		this.getPendingRequests().forEach(req => req.entry.late = true);
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
