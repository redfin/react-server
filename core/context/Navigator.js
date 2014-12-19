
var EventEmitter = require('events').EventEmitter,
	Router = require('routr'),
	Q = require('q');

class Navigator extends EventEmitter {

	constructor (context, routes, applicationStore) {
		this.router = new Router(routes);
		this.context = context;
		
		this._loading = false;
		this._currentRoute = null;
	}

	navigate (navOpts) {

		var route = this.router.getRoute(navOpts.path, {navigate: navOpts});
		if (!route) {
			setTimeout( () => {
				this.emit('navigateDone', { status: 404, message: "No Route!" });
			}, 0);
			return;
		}

		this.startRoute(route);
		this.emit('navigateStart', route);

		/* Breathe... */

		route.config.resolveComponent().done( component => {
			// when the handler function is done, we'll start it executing, optimistically
			var actionFunc = Q.nfbind(component.handleRoute);
			actionFunc(this.context, route).done( (pageObject) => {
				this.finishRoute(route);
				this.emit('navigateDone', null, {
					component: component,
					pageObject: pageObject
				});
			}, (err) => {
				// if the handler function had an error (i.e., an indication of a redirect)
				this.emit('navigateDone', err);
			});
		}, handlerFuncErr => {
			console.error("Error resolving handler function", handlerFuncErr);
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