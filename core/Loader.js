
var Q = require('q'),
	logger = require('./logging').getLogger(__LOGGER__),
	config = require("./config");


// can't do "export class Loader"
module.exports = class Loader {

	constructor (context, options) {
		// super();

		this.context = context;
		this.options = options || {};
		this.dataCache = {};
	}

	dehydrate () {

		var out = {};
		
		// dehydrate all options, except the 'headers' key,
		// which doesn't make sense client-side
		out.options = {};
		Object.keys(this.options).forEach( key => {
			if (key.toLowerCase() !== 'headers') {
				out.options[key] = this.options[key];
			}
		});

		out.dataCache = {};

		var dataCache = this.dataCache;
		Object.keys(dataCache).forEach(function (url) {
			var result = {
				loaded: dataCache[url].dfd.promise.isFulfilled(),
				requesters: dataCache[url].requesters
			};
			if (result.loaded) {
				result.data = dataCache[url].data;
			}
			out.dataCache[url] = result;
		});

		return out;

	}

	rehydrate (state) {

		logger.debug("Rehydrating HTTP loader.");

		if (state.options) {
			this.options = state.options;
		}

		// clear state
		var dataCache = this.dataCache = {};


		Object.keys(state.dataCache).forEach(function (url) {
			var cacheEntry = state.dataCache[url];
			var dfd = Q.defer();

			dataCache[url] = { dfd: dfd, requesters: cacheEntry.requesters }
			if (cacheEntry.loaded) {
				dataCache[url].data = cacheEntry.data;
				// immediately resolve
				// TODO: setTimeout, so it's not synchronous?
				// TODO: it appears to be asynchronous w/ or w/o setTimeout?
				//setTimeout(function () {
					dfd.resolve(cacheEntry.data);
				//}, 0);
				logger.debug(`Rehydrating resolved url to cache: ${url}`);
			} else {
				logger.debug(`Rehydrating pending url to cache without data: ${url}`);
			}
			
		});

	}
	
	load (urlPattern) {
		var actualUrl = this.buildUrl(urlPattern);
		logger.debug(`Loading ${actualUrl}`)

		if (this.dataCache[actualUrl]) {
			if (this.dataCache[actualUrl].loaded) {
				logger.debug(`Returning response from cache for ${actualUrl}`);
			} else {
				logger.debug(`Returning promise of late arrival for ${actualUrl}`);
			}

			var cacheEntry = this.dataCache[actualUrl],
				promise = cacheEntry.dfd.promise;

			// TODO: should probably figure out how to deep copy the data?

			if (SERVER_SIDE) {
				// server-side, we increment the number of requesters
				// we expect to retrieve the data on the frontend
				cacheEntry.requesters += 1;	
			} else {
				// client-side, whenever someone retrieves data from the cache,
				// we decrement the number of retrievals expected, and when we
				// hit zero, remove the cache entry. 

				promise = this._requesterDecrementingPromise(promise, actualUrl);
			}
			
			return promise;
		}

		var dfd = Q.defer(),
			promise = dfd.promise;

		// TODO: make this request cancelable
		this.context.superagent.get(this._apiServerPrefix() + actualUrl)
			.end( res => {

				logger.debug(`Response returned for ${actualUrl}`);

				// server-side, we cache the response in the dataCache to
				// present to the frontend
				if (SERVER_SIDE) {
					this.dataCache[actualUrl].loaded = true;
					this.dataCache[actualUrl].data = res.body;
				}
				dfd.resolve(res.body);
			});
		
		if (SERVER_SIDE) {
			// server-side, we cache the data, and count the number of requesters so
			// that we know how many requests to fulfill client-side
			this.dataCache[actualUrl] = { dfd: dfd, loaded: false, requesters: 1 };
		} else {
			// client-side, we do *nothing* on this code path, because it means
			// that a url was requested that we couldn't serve from our cache, i.e.
			// it was either not previously requested on the backend, or was requested,
			// but we fulfilled our obligations to its requestors. This is a *new* request,
			// and we shouldn't need to cache it (Right?)
			// TODO: it might be cool if two people on the frontend could request the same resource,
			// and if they did it fast enough, they both got the same instance of it. That seems like
			// a P2 though?
		}
		return promise;
	}

	/**
	 * Chain a promise with another promise that decrements
	 * the number of expected requesters.
	 */
	_requesterDecrementingPromise (promise, actualUrl) {
		var dataCache = this.dataCache;
		return promise.then(function (data) {
			dataCache[actualUrl].requesters -= 1;
			logger.debug("Decrementing: " + dataCache[actualUrl]);
			if (dataCache[actualUrl].requesters === 0) {
				delete dataCache[actualUrl];
			}

			this._checkCacheDepleted();
			// since we're adding to the original promise chain,
			// we need to pass the data through
			return data;

		}.bind(this));
	}

	/**
	 * Synchronously check if data is loaded already.
	 * Returns an object with a getData() function, to
	 * make it possible to check for the existence of a URL
	 * in the cache, but not actually retrieve if (if desired).
	 * Calling getData() will retrieve the data from the cache
	 * and decrement the number of requesters
	 */
	checkLoaded (urlPattern) {
		var actualUrl = this.buildUrl(urlPattern),
			dataCache = this.dataCache,
			cached = dataCache[actualUrl];

		if (cached && cached.data) {
			return {
				getData: () => {
					// sort of a synchronous promise thing
					cached.requesters -= 1;
					if (cached.requesters === 0) {
						delete dataCache[actualUrl];
					}
					this._checkCacheDepleted();
					return cached.data;
				}
			};
		}
		return null;
	}

	buildUrl (urlPattern) {
		// keep it dead-simple for now
		if (this.options.id) {
			return urlPattern.replace(/{id}/g, this.options.id);
		} else {
			return urlPattern;
		}
	}

	getPendingRequests () {
		var dataCache = this.dataCache;

		return Object.keys(dataCache)
			.filter( url => !dataCache[url].loaded )
			.map( url => {
				return {url: url, entry: dataCache[url] }
			});
	}

	whenAllPendingResolve () {
		var promises = Object.keys(this.dataCache)
			.map( url => this.dataCache[url].dfd.promise );
		return Q.allSettled(promises);
	}

	/** 
	 * Fires when the cache has been completely depleted, which is used as a signal to render when there was a timeout on the server.
	 */
	whenCacheDepleted () {
		this.whenCacheDepletedDfd = this.whenCacheDepletedDfd || Q.defer();

		this._checkCacheDepleted();

		return this.whenCacheDepletedDfd.promise;
	}

	_checkCacheDepleted() {
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

	lateArrival (url, data) {
		logger.debug(`Late arrival for ${url}`);
		var dataCache = this.dataCache;
		if (dataCache[url]) {
			dataCache[url].loaded = true;
			dataCache[url].data = data;
			dataCache[url].dfd.resolve(data);
		} else {
			logger.debug("WTF?");
		}
	}

	_apiServerPrefix () {
		var prefix;

		if (SERVER_SIDE) {
			// internal URL. Is likely different than the public URL, and indeed
			// shouldn't be displayed publicly, probably?
			prefix = config().internal.apiServerPrefix;
		} else {
			// public URL (e.g. http://www.redfin.com)
			prefix = config().apiServerPrefix;
		}
		return prefix;
	}

};
