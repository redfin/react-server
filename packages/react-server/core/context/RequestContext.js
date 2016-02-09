
var Navigator = require('./Navigator'),
	RequestLocals = require('../util/RequestLocalStorage').getNamespace();

class RequestContext {

	constructor (routes) {

		this.navigator = new Navigator(this, routes);

		this.navigator.on('page', page => this.page = page);

		this._navigateListeners = [];

		this.registerRequestLocal();
	}

	static getCurrentRequestContext () {
		return RequestLocals().instance;
	}

	// when we transition from page to page, we clear out the RequestLocals, but we need to re-register
	// the RequestContext in the RequestLocals.
	registerRequestLocal() {
		RequestLocals().instance = this;
	}

	setServerStash (stash) {
		this.serverStash = stash;
		return this;
	}

	getServerStash () {
		return this.serverStash;
	}

	setMobileDetect (mobileDetect) {
		this.mobileDetect = mobileDetect;
		return this;
	}

	getMobileDetect () {
		return this.mobileDetect;
	}

	getCurrentPath () {
		return this.navigator.getCurrentRoute().url;
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

}

class RequestContextBuilder {

	constructor () {
	}

	setRoutes(routes) {
		this.routes = routes;
		return this;
	}

	setDefaultXhrHeadersFromRequest () {
		return this;
	}

	create (extraOpts) {

		return new RequestContext(this.routes, extraOpts);
	}

}

module.exports = RequestContext;
module.exports.Builder = RequestContextBuilder;

