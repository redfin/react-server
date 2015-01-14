
var React = require('react'),
	debug = require('debug')('triton:ClientController'),
	RequestContext = require('./context/RequestContext'),
	AppRoot = React.createFactory(require('./components/AppRoot')),
	Q = require('q'),
	cssHelper = require('./util/ClientCssHelper'),
	EventEmitter = require("events").EventEmitter,
	ClientRequest = require("./ClientRequest"),
	History = require('./components/History');

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

	terminate() {
        this._history.off(this._historyListener);
        this._historyListener = null;
        this._history = null;
	}

	_setupNavigateListener () {
		var context = this.context; 

		/**
		 * type is one of 
		 *    History.events.PUSHSTATE: user clicked something to go forward but browser didn't do a 
		 * full page load
		 *    History.events.POPSTATE: user clicked back button but browser didn't do a full page load
		 *    History.events.PAGELOAD: full browser page load, not using History API.
		 */
		context.onNavigate( (err, page, path, type) => {
			debug('Executing navigate action');
			
			if (err) {
				// redirects are sent as errors, so let's handle it if that's the case. 
				if (err.status && (err.status === 301 || err.status === 302)) {
					if (!err.redirectUrl) {
						console.error("A redirect status was sent without a corresponding redirect redirectUrl.", err);
					} else {
						setTimeout(() => this.context.navigate(new ClientRequest(err.redirectUrl)), 0);
					}
				} else {
					debug("There was an error:", err);
					console.error(err);
				}
				return;
			}

			var routeName = context.navigator.getCurrentRoute().name;

			if (!this._previouslyRendered) {
				cssHelper.registerPageLoad(routeName);
			} else {
				// getTitle can return a String or a Promise of String. we wrap with Q here
				// to normalize the result to promise of String.
				Q(page.getTitle()).then(newTitle => {
					if (newTitle && newTitle !== document.title) {
						document.title = newTitle;
					}
				}).catch(err => console.error("Error while setting the document title", err));
			}

			cssHelper.ensureCss(routeName, page);

			// if this is a History.events.PUSHSTATE navigation, we should change the URL in the bar location bar right
			// before rendering. 
			// note that for browsers that do not have pushState, this will result in a window.location change 
			// and full browser load. It's kind of late to do that, as we may have waited for handleRoute to 
			// finish asynchronously. perhaps we should have an "URLChanged" event that happens before "NavigateDone".
			if (type === History.events.PUSHSTATE && this._history) {
				this._history.pushState(null, null, path);
			}

			this._render(page);

		});

	}

	_render (page) {
		debug('React Rendering');

		React.render(AppRoot({
			childComponent: page.getElements(), // TODO: deal with promises and arrays of elements -sra.
			context: this.context
		}), this.mountNode, () => {
			debug('React Rendered');
			this.emit('render');
		});
	}

	init () {
		var location = window.location;
		var path = location.pathname + location.search;
		this._initializeHistoryListener(this.context);
		this.context.navigate(new ClientRequest(path));
	}

	/**
	 * Initializes us to listen to back button events. When the user presses the back button, the history 
	 * listener will be called and cause a navigate() event.
	 */
	_initializeHistoryListener(context) {

        this._historyListener = (e) => {
            if (context) {
                var path = this._history.getPath();
                
                // pass in "popstate" because this is when a user clicks the back button.
                context.navigate(new ClientRequest(path), History.events.POPSTATE);
                
            }
        };

        this._history = new History();
        this._history.on(this._historyListener);
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
	var config = require("./config")();
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

