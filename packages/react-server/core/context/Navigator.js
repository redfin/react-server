
var EventEmitter = require('events').EventEmitter,
	logger = require('../logging').getLogger(__LOGGER__),
	Router = require('routr'),
	Q = require('q'),
	History = require("../components/History"),
	ReactServerAgent = require("../ReactServerAgent"),
	PageUtil = require("../util/PageUtil"),
	DebugUtil = require("../util/DebugUtil").default,
	{setResponseLoggerPage} = SERVER_SIDE ? require('../logging/response') : { setResponseLoggerPage: () => {} };

class Navigator extends EventEmitter {

	constructor (context, routes) {
		super();

		this.router = new Router(routes.routes);
		this.context = context;

		this._globalMiddleware = routes.middleware;
		this._loading = false;
		this._currentRoute = null;
		this._nextRoute = null;
	}


	navigate (request, type) {

		logger.debug(`Navigating to ${request.getUrl()}`);
		type = type || History.events.PAGELOAD;

		this._haveInitialized = true;

		DebugUtil.setRequest(request);

		var route = this.router.getRoute(request.getUrl(), { method: request.getMethod() });

		if (route) {
			logger.debug(`Mapped ${request.getUrl()} to route ${route.name}`);
		} else {
			this.emit('navigateDone', { status: 404, message: "No Route!" }, null, request.getUrl(), type);
			return;
		}

		
		this
			.startRoute(route, request, type)

			.then(this._dealWithDataBundleLoading.bind(this, request))

			.then(() => {
				if (this._ignoreCurrentNavigation){
				// This is a one-time deal.
					this._ignoreCurrentNavigation = false;
					return;
				}

				/* Breathe... */

				var loaders = route.config.page;

				var deviceType = this.context.getDeviceType();

				if (loaders[deviceType]) {
					route.name += "-" + deviceType;
				}

				// Our route may have multiple page implementations if
				// there are device-specific variations.
				//
				// We'll take one of those if the request device
				// matches, otherwise we'll use the default.
				//
				// Note that the page object may either directly be a
				// loader or it may be an object whose values are
				// loaders.
				(
					loaders[deviceType] ||
				loaders.default ||
				loaders
				)().done(pageConstructor => {
					if (request.setRoute) {
						request.setRoute(route);
					}
					this.handlePage(pageConstructor, request, type);

				}, err => {
					console.error("Error resolving page", err);
				});

			});

	}

	
	ignoreCurrentNavigation() {
		this._ignoreCurrentNavigation = true;
	}

	_dealWithDataBundleLoading(request) {

		// If we're managing a frame's navigation, we want _it_ to
		// use a data bundle.
		if (this._ignoreCurrentNavigation) return Q();

		// If this request doesn't use a data bundle, we're done.
		if (!request.getBundleData()) return Q();

		// If the request wants all of the data fetched as a bundle
		// we'll need to kick off the request for the bundle.
		return ReactServerAgent._fetchDataBundle(request.getUrl())
			.then(ReactServerAgent._rehydrateDataBundle)
			.catch(err => logger.error('Data bundle error', err));
	}

	handlePage(pageConstructor, request, type) {
		// instantiate the pages we need to fulfill this request.
		var pageClasses = [];

		this._addPageMiddlewareToArray(this._globalMiddleware, pageClasses);
		this._addPageMiddlewareToArray([pageConstructor], pageClasses);

		var pages = pageClasses.map((pageClass) => {
			if (Object.getOwnPropertyNames(pageClass).length === 0) {
				throw new Error("Tried to instantiate a page or middleware class that was an empty object. Did you forget to assign a class to module.exports?");
			}
			return new pageClass();
		});
		var page = PageUtil.createPageChain(pages);

		this.emit("page", page);

		page.setRequest(request);

		PageUtil.PageConfig.initFromPageWithDefaults(page, {
			isFragment    : false,
			isRawResponse : false,
		});

		// Set the page context on the response logger so it can figure
		// out whether to flush logs to the response document
		setResponseLoggerPage(page);

		// call page.handleRoute(), and use the resulting code to decide how to
		// respond.
		// We call it in a promise handler so any exception that
		// arises will get converted to a rejection that we can handle
		// below.
		Q().then(page.handleRoute).then(handleRouteResult => {

			page.setStatus(handleRouteResult.code);

			page.setHasDocument(handleRouteResult.hasDocument);

			page.setJsBelowTheFold(DebugUtil.getJsBelowTheFold() || handleRouteResult.jsBelowTheFold);
			page.setSplitJsLoad(DebugUtil.getSplitJsLoad() || handleRouteResult.splitJsLoad);

			if (handleRouteResult.code && ((handleRouteResult.code / 100)|0) !== 2) {
				this.emit("navigateDone", {status: handleRouteResult.code, redirectUrl: handleRouteResult.location}, page, request.getUrl(), type);
				return;
			}
			if (handleRouteResult.page) {
				setTimeout(() => this.handlePage(handleRouteResult.page, request, type), 0);
				return;
			}

			this.emit('navigateDone', null, page, request.getUrl(), type);
		}).catch(err => {
			logger.error("Error while handling route", err);

			this.emit('navigateDone', {status: 500}, page, request.getUrl(), type);
		});

	}

	/**
	 * recursively adds the middleware in the pages array to array.
	 */
	_addPageMiddlewareToArray(pages, array) {
		if (!pages) return;
		pages.forEach((page) => {
			if (page.middleware) {
				this._addPageMiddlewareToArray(page.middleware(), array);
			}
			array.push(page);
		});
	}

	getState () {
		return {
			loading: this._loading,
			route: this._currentRoute,
		}
	}

	getCurrentRoute () {
		return this._currentRoute;
	}

	getLoading () {
		return this._loading;
	}

	startRoute (route, request, type) {

		var dfd, promise;

		if (request) {

			if (this._nextRoute) this._nextRoute.dfd.reject();

			dfd = Q.defer(), promise = dfd.promise;

			this._nextRoute = {route, request, type, dfd};
		}

		if (!this._loading && this._nextRoute){

			const {route, request, type, dfd} = this._nextRoute;

			this._loading      = true;
			this._currentRoute = route;
			this._nextRoute    = null;

			this.emit('navigateStart', {route, request, type});

			dfd.resolve();
		}

		return promise;
	}

	finishRoute () {
		this._loading = false;

		this.emit('loadComplete');

		this.startRoute();
	}
}

module.exports = Navigator;
