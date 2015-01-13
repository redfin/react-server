
var EventEmitter = require('events').EventEmitter,
	Router = require('routr'),
	Q = require('q'),
	History = require("../components/History");

class Navigator extends EventEmitter {

	constructor (context, routes, applicationStore) {
		this.router = new Router(routes);
		this.context = context;
		
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
		type = type || History.events.PAGELOAD;

		var route = this.router.getRoute(request.getUrl(), {navigate: {path:request.getUrl(), type:type}});
		if (!route) {
			setTimeout( () => {
				this.emit('navigateDone', { status: 404, message: "No Route!" }, null, request.getUrl(), type);
			}, 0);
			return;
		}

		this.startRoute(route);
		this.emit('navigateStart', route);

		/* Breathe... */

		route.config.page().done( pageConstructor => {
			if (request.setRoute) {
				request.setRoute(route);
			}
			// instantiate the page we need to fulfill this request.
			var page = new pageConstructor();

			// call page.handleRoute(), and use the resulting code to decide how to 
			// respond. -sra.
			// note that handleRoute can return a handleRouteResult or a Promise of handleRouteResult. using
			// Q() to normalize that and make it always be a Promise of handleRouteResult. -sra.
			var handleRouteValueOrPromise = page.handleRoute ? page.handleRoute(request, this.context.loader) : {code: 200};
			Q(handleRouteValueOrPromise).then(handleRouteResult => {
				// TODO: I think that 3xx/4xx/5xx shouldn't be considered "errors" in navigateDone, but that's
				// how the code is structured right now, and I'm changing too many things at once at the moment. -sra.
				if (handleRouteResult.code && handleRouteResult.code / 100 !== 2) {
					this.emit("navigateDone", {status: handleRouteResult.code, redirectUrl: handleRouteResult.location}, null, request.getUrl(), type);
				}
				if (handleRouteResult.page) {
					// TODO: deal with returning a new Page object in handleRouteResult -sra.
				}

				this.finishRoute(route);
				this.emit('navigateDone', null, page, request.getUrl(), type);
			}).catch(err => {
				console.error("Error while handling route.", err);
			});
		}, err => {
			console.error("Error resolving page", err);
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

	finishRoute (route) {
		this._loading = false;
	}

}

module.exports = Navigator;