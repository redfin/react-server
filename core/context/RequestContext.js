
var Navigator = require('./Navigator'),
	RequestLocals = require('../util/RequestLocalStorage').getNamespace();

class RequestContext {

	constructor (routes) {

		this.navigator = new Navigator(this, routes);

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

	// Generally if we're setting dataLoadWait we actually just want to
	// make sure it's _at least_ a certain value.  If someone else has
	// already set it _higher_, we don't want to clobber their setting.
	setDataLoadWaitMinimum (ms) {
		if (this.dataLoadWait < ms){
			this.dataLoadWait = ms;
		}
		return this;
	}

	setDataLoadWait (ms) {
		this.dataLoadWait = ms
		return this
	}

	getDataLoadWait () {
		return this.dataLoadWait
	}

	setServerStash (stash) {
		this.serverStash = stash;
		return this;
	}

	getServerStash () {
		return this.serverStash;
	}

	setIsMobile (isMobile) {
		this.isMobile = isMobile;
		return this;
	}

	getIsMobile () {
		return this.isMobile;
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

