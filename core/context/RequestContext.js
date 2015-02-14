
var ObjectGraph = require('../util/ObjectGraph'),
	Navigator = require('./Navigator'),
	RequestLocals = require('../util/RequestLocalStorage').getNamespace(),
	Q = require('q'),
	TritonAgent = require('../util/TritonAgent');

// TODO FIXME
var REFERRER_DOMAIN = "http://node.redfintest.com";

class RequestContext {

	constructor (routes, defaultHeaders, extraOpts) {

		// don't include headers client-side (browser has them already)
		if (!SERVER_SIDE || !defaultHeaders) {
			defaultHeaders = {};
		}

		if (SERVER_SIDE && defaultHeaders) {
			// stored in RequestLocalStorage
			TritonAgent.plugRequest(function (dataRequest) {
				dataRequest.set(defaultHeaders);
			});
		}

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

	setServerStash (stash) {
		this.serverStash = stash;
		return this;
	}

	getServerStash () {
		return this.serverStash;
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
			'TritonAgent.cache': TritonAgent.cache().dehydrate()
		}
	}

	rehydrate (state) {
		TritonAgent.cache().rehydrate(state['TritonAgent.cache']);
	}

}

class RequestContextBuilder {

	constructor () {
		this.defaultHeaders = {};
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

	create (extraOpts) {

		return new RequestContext(this.routes, this.defaultHeaders, extraOpts);
	}

}

module.exports = RequestContext;
module.exports.Builder = RequestContextBuilder;

