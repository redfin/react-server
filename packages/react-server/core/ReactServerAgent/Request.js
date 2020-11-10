var superagent = require('superagent')
	,	logger = require('../logging').getLogger(__LOGGER__)
	,	Q = require('q')
	,	Plugins = require("./Plugins")
	,	merge = require("lodash/merge")
;

/**
 * Implements a subset of superagent's API. Packages up arguments
 * to pass to superagent under the hood.
 */
function Request(method, urlPath, cache) {
	this._method = method;
	this._urlPath = urlPath;
	this._cache = cache;

	this._queryParams = [];
	// _postParams should initially be null instead of {} because we want to allow people to send POST requests with
	// empty data sets (if they need to).  This way, we can differentiate between a default of null, an empty data set,
	// and a populated data set.
	this._postParams = null;
	this._headers = {};
	this._timeout = null;
	this._type = "json"; // superagent's default, only for POST/PUT/PATCH methods
	// CORS off by default
	this._withCredentials = false;
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
		throw new Error("Request.query does not support retrieving the current query string");
	}
	this._queryParams.push(queryParams);
	return this;
}

Request.prototype.send = function (postParams) {
	if (typeof postParams === 'undefined') {
		return merge({}, this._postParams || {});
	}
	if (postParams !== null) {
		if (this._postParams === null) {
			this._postParams = {};
		}
		merge(this._postParams, postParams);
	}
	return this;
}

Request.prototype.set = function (headers) {
	if (typeof headers === 'undefined') {
		return merge({}, this._headers);
	}
	merge(this._headers, headers);
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

Request.prototype.toJSON = function(){
	return {
		aborted: this.aborted,
		cacheWhitelist: this._cacheWhitelist,
		headers: this._headers,
		method: this._method,
		postParams: this._postParams,
		queryParams: this._queryParams,
		timeout: this._timeout,
		type: this._type,
		urlPath: this._urlPath,
	};
}

// Enable CORS
Request.prototype.withCredentials = function (on) {
	if (on === undefined) {
		on = true;
	}
	this._withCredentials = on;
	return this;
};

/**
 * Wrap superagent's end() method to create an entry in a request-local
 * data cache that will be serialized to the client and replayed in the
 * browser.
 */
Request.prototype.end = function (fn) {

	if (!fn || fn.length !== 2) {
		// a superagent requirement, as of ~v1.0; We're providing a default callback here.
		fn = (a, b) => {}; // eslint-disable-line no-unused-vars
	}

	var executeRequest = function (cb) {
		applyRequestPlugins(this);

		// set up some params
		var saRequest = buildSuperagentRequest.call(this);

		// actually execute the request via superagent
		superagent.Request.prototype.end.call(saRequest, cb);

		return this;
	}.bind(this);

	// helper, for cleaner code below
	var wrapResponseCallback = responsePluginApplyingCallback.bind(this);

	// only do caching for responses for GET requests for now
	if (this._method !== 'GET') {
		return executeRequest(wrapResponseCallback(fn));
	}

	// get cache entry for url if exists; if server-side, create one if it doesn't already exist.
	// the cache key here needs to be the same server-side and client-side, so the full URL, complete
	// with host (which can vary between client and server) is not usable. The URL path (without the
	// host) works fine though.
	var entry = this._cache.entry(this._getCacheAffectingData(), SERVER_SIDE /* createIfMissing */, this._cacheWhitelist);
	if (!SERVER_SIDE && !entry) {
		return executeRequest(wrapResponseCallback(fn));
	}

	// no previous requesters? fire the request
	if (entry.requesters === 0) {
		executeRequest(function (err, res) {
			if (err) {
				entry.setError(err);
				return;
			}
			entry.setResponse(res);
		});
	}

	entry.whenDataReady().nodeify(wrapResponseCallback(fn));

	return this;
}

// private function
function applyRequestPlugins (req) {
	// run any registered plugins
	Plugins.forRequest().asArray().forEach(function (pluginFunc) {
		pluginFunc.apply(null, [req]);
	})
}

// private function; called with a Request instance bound to
// `this`
function responsePluginApplyingCallback(cb) {
	// partly pedantic, partly so the code in the wrapped callback
	// is shorter; saving plugins here guarantees that plugins added
	// *after* the request is made, but *before* the response comes
	// aren't called for this particular request
	var thisReq = this;
	var plugins = Plugins.forResponse().asArray();
	return function (err, res) {
		plugins.forEach(function (pluginFunc) {
			pluginFunc.apply(null, [err, res, thisReq]);
		});
		cb(err, res);
	}
}

// private function; called with a Request instance bound
// to `this`
function buildSuperagentRequest() {
	var req = superagent(this._method, this._buildUrl());

	if (this._agent){
		req.agent(this._agent);
	}

	req.set(this._headers);

	this._queryParams.forEach(params => req.query(params));

	var postParams = this._postParams;

	// convert params to FormData if the request type is form-data
	if (this._type === "form-data") {
		if (!SERVER_SIDE) {
			var formData = new FormData();
			if (postParams) {
				var paramKeys = Object.keys(postParams);
				paramKeys.forEach(key => {
					formData.append(key, postParams[key]);
				});
			}
			postParams = formData;
		} else {
			throw new Error(`ReactServerAgent.type("form-data") not allowed server-side`);
		}
	}

	//Set CORS flag
	if (this._withCredentials) {
		req.withCredentials(this._withCredentials);
	}

	// query parameters exist if there are more than one set
	// post parameters exist if the value is not null
	const hasQueryParams = (this._queryParams.length > 0),
		hasPostParams = (this._postParams !== null);

	if (hasPostParams) {
		// superagent has some weird, implicit file upload support
		// that only works if you don't set `type`.
		if (this._type && this._type !== 'form-data') {
			req.type(this._type);
		}

		req.send(postParams);
	}

	switch (this._method) {
		case 'GET':
		case 'HEAD':
			if (hasPostParams) {
				logger.warning(`Attempting a ${this._method} request with POST data (using SuperAgent's .send() function). This might result in a CORS preflight request`);
			}
			break;

		case 'POST':
		case 'PATCH':
		case 'PUT':
			if (hasQueryParams) {
				logger.info(`Attempting a ${this._method} request with query data (using SuperAgent's .query() function). This might not be what you want.`);
			}
			break;
	}

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

Request.prototype._getCacheAffectingData = function () {
	return {
		urlPath: this._urlPath,
		method: this._method,
		queryParams: this._queryParams,
		postParams: this._postParams,
		// headers: this._headers, // headers are not included
		type: this._type,
	};
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
	var promise = this.asPromise();
	return promise.then.apply(promise, arguments);
};

/**
 * Convenience method wrapping `.end()` and returning a promise
 * that is resolved if the request is successful, and rejected if
 * the request results in an error.
 */
Request.prototype.asPromise = function () {
	var dfd = Q.defer();
	dfd.promise.catch(logRequestError.bind(this));
	this.end(dfd.makeNodeResolver());
	return dfd.promise;
}

// private method; 'this' bound to request object
function logRequestError(err) {

	var {response} = err;
	if (!response) {
		logger.warning(`ReactServerAgent raised exception for URL ${this._urlPath}`, err);
	} else if (response.notFound) {
		// 404? don't care about response
		logger.warning(`Resource not found on server: ${this._urlPath}`);
	} else if (response.serverError) {
		logger.warning(`Received server error for URL ${this._urlPath}`, err);
	} else {
		logger.warning(`Unexpected status code returned for URL ${this._urlPath}`, err);
	}
}

/**
 * Overriding superagent use() function to give a more descriptive
 * error message than just not including it altogether.
 */
Request.prototype.use = function () {
	throw new Error(`use() function is superseded by plugRequest(...)`);
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
