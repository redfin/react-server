
var React = require('react'),
	debug = require('debug')('triton:ClientController'),
	RequestContext = require('./context/RequestContext'),
	AppRoot = React.createFactory(require('./components/AppRoot')),
	Q = require('q'),
	cssHelper = require('./util/ClientCssHelper'),
	EventEmitter = require("events").EventEmitter;

// for dev tools
window.React = React;

class ClientController extends EventEmitter {

	constructor ({routes, dehydratedState, mountNode}) {

		checkNotEmpty(dehydratedState, 'InitialContext');
		checkNotEmpty(dehydratedState, 'Config');

		this.config = buildConfig(dehydratedState.Config);
		this.context = buildContext(
			dehydratedState.InitialContext,
			routes
		);
		this.mountNode = mountNode;

		var irDfd = this._initialRenderDfd = Q.defer();
		this.once('render', irDfd.resolve.bind(irDfd));

		this._setupNavigateListener();
		this._setupLateArrivalHandler();

		this._previouslyRendered = false;
	}

	_setupNavigateListener () {
		var context = this.context; 

		context.onNavigate( (err, result) => {
			debug('Executing navigate action');
			
			if (err) {
				debug("There was an error:", err);
				console.error(err);
				return;
			}

			var routeName = context.navigator.getCurrentRoute().name;

			if (!this._previouslyRendered) {
				cssHelper.registerPageLoad(routeName);
			} else {
				var newTitle = result.pageObject.getTitle();
				if (newTitle && newTitle !== document.title) {
					document.title = newTitle;
				}
			}

			cssHelper.ensureCss(routeName, result.pageObject);

			this._render(result);

		});

	}

	_render (result) {

		debug('React Rendering');
		React.render(AppRoot({
			childComponent: result.component,
			context: this.context,
			pageStore: result.pageObject.getPageStore()
		}), this.mountNode, () => {
			debug('React Rendered');
			this.emit('render');
		});
	}

	init () {
		var location = window.location;
		var path = location.pathname + location.search;
		this.context.navigate({path: path});
	}

	_setupLateArrivalHandler () {
		// used by <script> callbacks to register data sent down on the
		// initial connection after initial render
		window.__lateArrival = this.lateArrival.bind(this);
	}

	lateArrival (url, data) {
		this._initialRenderDfd.promise.done( () => {
			this.context.loader.lateArrival(url, data);
		});
	}

}

function checkNotEmpty(state, key) {
	if (typeof state[key] === 'undefined') {
		var msg = key + ' not defined in dehydrated state';
		debug(msg)
		throw new Error(msg);
	}
}

function buildConfig(dehydratedConfig) {
	// rehydrate the config object
	var config = require("./config");
	config.rehydrate(dehydratedConfig);
	return config;
}

function buildContext(dehydratedContext, routes) {
	var context = new RequestContext.Builder()
		.setRoutes(routes)
		.create();
	context.rehydrate(dehydratedContext);
	return context;
}


module.exports = ClientController;

