
var EventEmitter = require('events').EventEmitter,
	logger = require('../logging').getLogger(__LOGGER__),
	Router = require('routr'),
	Q = require('q'),
	History = require("../components/History"),
	PageUtil = require("../util/PageUtil");

class Navigator extends EventEmitter {

	constructor (context, routes, applicationStore) {
		this.router = new Router(routes.routes);
		this.context = context;
		
		this._globalMiddleware = routes.middleware;
		this._loading = false;
		this._currentRoute = null;
	}

	/**
	 * type is one of 
	 *    History.events.PUSHSTATE: user clicked something to go forward but browser didn't do a 
	 * full page load
	 *    History.events.POPSTATE: user clicked back button but browser didn't do a full page load
	 *    History.events.PAGELOAD: full browser page load, not using History API.
	 *
	 * Default is History.events.PAGELOAD.
	 */
	navigate (request, type) {
		logger.debug(`Navigating to ${request.getUrl()}`);
		type = type || History.events.PAGELOAD;

		var route = this.router.getRoute(request.getUrl(), {navigate: {path:request.getUrl(), type:type}});
		if (!route) {
			setTimeout( () => {
				this.emit('navigateDone', { status: 404, message: "No Route!" }, null, request.getUrl(), type);
			}, 0);
			return;
		}
		logger.debug(`Mapped ${request.getUrl()} to route ${route.name}`);

		this.startRoute(route);
		this.emit('navigateStart', route);

		/* Breathe... */

		route.config.page().done( pageConstructor => {
			if (request.setRoute) {
				request.setRoute(route);
			}
			this.handlePage(pageConstructor, request, this.context.loader, type);

		}, err => {
			console.error("Error resolving page", err);
		});

	}

	handlePage(pageConstructor, request, loader, type) {
		// instantiate the pages we need to fulfill this request.
		var pageClasses = [];

		this._addPageMiddlewareToArray(this._globalMiddleware, pageClasses);
		this._addPageMiddlewareToArray([pageConstructor], pageClasses);

		var pages = pageClasses.map((pageClass) => new pageClass());
		var page = PageUtil.createPageChain(pages);

		// call page.handleRoute(), and use the resulting code to decide how to 
		// respond.
		page.handleRoute(request, loader).then(handleRouteResult => {
			// TODO: I think that 3xx/4xx/5xx shouldn't be considered "errors" in navigateDone, but that's
			// how the code is structured right now, and I'm changing too many things at once at the moment. -sra.
			if (handleRouteResult.code && handleRouteResult.code / 100 !== 2) {
				this.emit("navigateDone", {status: handleRouteResult.code, redirectUrl: handleRouteResult.location}, null, request.getUrl(), type);
				return;
			}
			if (handleRouteResult.page) {
				// in this case, we should forward to a new page *without* changing the URL. Since we are already
				// in an async callback, we should schedule a new handlePage with the new page constructor and return
				// from this call.
				setTimeout(() => this.handlePage(handleRouteResult.page, request, loader, type), 0);
				return;
			}

			this.finishRoute();
			this.emit('navigateDone', null, page, request.getUrl(), type);
		}).catch(err => {
			console.error("Error while handling route.", err);
		});

	}

	/** 
	 * recursively adds the middleware in the pages array to array.
	 */
	_addPageMiddlewareToArray(pages, array) {
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
			route: this._currentRoute
		}
	}

	getCurrentRoute () {
		return this._currentRoute;
	}

	getLoading () {
		return this._loading;
	}

	startRoute (route) {
		this._loading = true;
		this._currentRoute = route;
	}

	finishRoute () {
		this._loading = false;
	}

}

module.exports = Navigator;