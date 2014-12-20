
var Q = require('q'),
	debug = require('debug')('rf:Loader'),
	config = require("triton/core/config");


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

		debug("REHYDRATING LOADER!!");

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
			}
			
		});

	}
	
	load (urlPattern) {
		var actualUrl = this.buildUrl(urlPattern);

		if (this.dataCache[actualUrl]) {
			debug("HITTING CACHE, OH YEAH. ");

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

				debug("Response Came Back!");

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
			debug("Decrementing: ", dataCache[actualUrl]);
			if (dataCache[actualUrl].requesters === 0) {
				delete dataCache[actualUrl];
			}

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
				getData: function () {
					// sort of a synchronous promise thing
					cached.requesters -= 1;
					if (cached.requesters === 0) {
						delete dataCache[actualUrl];
					}
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

	lateArrival (url, data) {
		var dataCache = this.dataCache;
		if (dataCache[url]) {
			dataCache[url].loaded = true;
			dataCache[url].data = data;
			dataCache[url].dfd.resolve(data);
		} else {
			debug("WTF?");
		}
	}

	_apiServerPrefix () {
		var prefix;

		if (SERVER_SIDE) {
			// internal URL. Is likely different than the public URL, and indeed
			// shouldn't be displayed publicly, probably?
			prefix = config.internal.apiServerPrefix;
		} else {
			// public URL (e.g. http://www.redfin.com)
			prefix = config.apiServerPrefix;
		}
		debug("_apiServerPrefix: " + prefix);
		return prefix;
	}

};
