
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

		RequestLocals().instance = this;
	}

	static getCurrentRequestContext () {
		return RequestLocals().instance;
	}

	setDataLoadWait (ms) {
		this.dataLoadWait = ms
		return this
	}

	getDataLoadWait (ms) {
		return this.dataLoadWait
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

	dehydrate () {
		return {
			loader: this.loader.dehydrate()
		}
	}

	rehydrate (state) {
		this.loader.rehydrate(state.loader);
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

