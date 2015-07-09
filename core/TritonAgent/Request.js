var superagent = require('superagent')
,	logger = require('../logging').getLogger(__LOGGER__)
,	Q = require('q')
,	RequestPlugins = require("./RequestPlugins")
,	{ mixin } = require("./util")
;

/**
 * Implements a subset of superagent's API. Packages up arguments
 * to pass to superagent under the hood.
 */
function Request(method, urlPath, cache) {
	this._method = method;
	this._urlPath = urlPath;
	this._cache = cache;

	this._queryParams = {};
	this._postParams = {};
	this._headers = {};
	this._timeout = null;
	this._type = null;

	// public field
	this.aborted = undefined; //default to undefined
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
	var entry = this._cache.entry(urlPath, SERVER_SIDE /* createIfMissing */, this._cacheWhitelist);
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

// private function
function applyPlugins (req) {
	// run any registered plugins
	RequestPlugins.get().forEach(function (pluginFunc) {
		pluginFunc.apply(null, [req]);
	})
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


module.exports = Request;