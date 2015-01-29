
var SuperAgentWrapper = require('../util/SuperAgentWrapper'),
	Loader = require("../Loader"),
	ObjectGraph = require('../util/ObjectGraph'),
	Navigator = require('./Navigator'),
	RequestLocals = require('../util/RequestLocalStorage').getNamespace(),
	Q = require('q');

// TODO FIXME
var REFERRER_DOMAIN = "http://node.redfintest.com";

class RequestContext {

	constructor (routes, loaderOpts, defaultHeaders, extraOpts) {

		// don't include headers client-side (browser has them already)
		if (!SERVER_SIDE || !defaultHeaders) {
			defaultHeaders = {};
		}
		this.superagent = new SuperAgentWrapper(defaultHeaders);

		this.loader = new Loader(this /*context */, loaderOpts);

		this.navigator = new Navigator(this, routes);

		this._navigateListeners = [];

		// Kick this off right away, and make the promise available.
		this.loadUserData();

		RequestLocals().instance = this;
	}

	static getCurrentRequestContext () {
		return RequestLocals().instance;
	}

	loadUserData () {
		if (this._userDataPromise) {
			return this._userDataPromise
		}
		
		var dfd = Q.defer();
		this._userDataPromise = dfd.promise;

		this.loader
			.load('/stingray/reactLdp/userData')
			.done( apiResult => {
				this._resolveUserDataRequest(apiResult, dfd)
			});

		return this._userDataPromise;
	}

	_resolveUserDataRequest (apiResult, dfd) {
		// TODO: what is the equivalent here
		// if (!res.ok) {
		// 	dfd.reject({ message: 'Error', status: res.status, text: res.text });
		// 	return;
		// }

		if (apiResult.resultCode) {
			dfd.reject({ message: apiResult.errorMessage });
			return;
		}

		var userDataResult = apiResult.payload;

		this._userData = new ObjectGraph(userDataResult.userData).getRoot();

		dfd.resolve(userDataResult);
	}

	onNavigate (callback) {
		this.navigator.on('navigateDone', callback);
	}

	onNavigateStart (callback) {
		this.navigator.on('navigateStart', callback);
	}

	navigate (request, type) {
		this.navigator.navigate(request, type);
	}

	getUserDataPromise () {
		return this._userDataPromise;
	}

	dehydrate () {
		return {
			loader: this.loader.dehydrate()
		}
	}

	rehydrate (state) {
		this.loader.rehydrate(state.loader);
		var loaded = this.loader.checkLoaded('/stingray/reactLdp/userData');
		if (loaded) {
			var dfd = Q.defer();
			this._userDataPromise = dfd.promise;
			this._resolveUserDataRequest(loaded.getData(), dfd);
		} else {
			this.loadUserData();
		}
	}

}

class RequestContextBuilder {

	constructor () {
		this.defaultHeaders = {};
		this.loaderOpts = {};
	}

	setRoutes(routes) {
		this.routes = routes;
		return this;
	}

	setDefaultXhrHeadersFromRequest (req) {
		var defaultHeaders = {};
		if (req) {
			defaultHeaders['Cookie'] = req.get('cookie');
			defaultHeaders['Referer'] = REFERRER_DOMAIN;
		}
		this.defaultHeaders = defaultHeaders;
		return this;
	}

	setLoaderOpts (loaderOpts) {
		this.loaderOpts = loaderOpts || {};
		return this;
	}

	create (extraOpts) {

		return new RequestContext(this.routes, this.loaderOpts, this.defaultHeaders, extraOpts);
	}

}

module.exports = RequestContext;
module.exports.Builder = RequestContextBuilder;

