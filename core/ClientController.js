
var React = require('react/addons'),
	debug = require('debug')('triton:ClientController'),
	RequestContext = require('./context/RequestContext'),
	Q = require('q'),
	cssHelper = require('./util/ClientCssHelper'),
	EventEmitter = require("events").EventEmitter,
	ClientRequest = require("./ClientRequest"),
	History = require('./components/History'),
	PageUtil = require("./util/PageUtil");

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
		var TRITON_DATA_ATTRIBUTE = "data-triton-root-id";

		// if we were previously rendered on the client, clean up the old divs and 
		// their ReactComponents
		if (this._previouslyRendered) {
			debug("Removing previous page's React components");
			// first, copy the children from a node list to an array so that 
			// we can remove elements from their parent during the loop without modifying
			// the list we are iterating over.
			var tritonRootsNL = this.mountNode.children;
			var tritonRoots = [];
			for (var i = 0; i < tritonRootsNL.length; i++) {
				tritonRoots[i] = tritonRootsNL[i];
			}

			tritonRoots.forEach((tritonRoot) => {
				if (tritonRoot.hasAttribute(TRITON_DATA_ATTRIBUTE)) {
					// since this node has a data-triton-root-id, we can assume that we made it.
					React.unmountComponentAtNode(tritonRoot);
					this.mountNode.removeChild(tritonRoot);
				} else {
					// it's deeply troubling that there's a div we didn't create, but for now, just warn, and  
					// don't obliterate the node.
					console.warn("Found an element inside Triton's rendering canvas that did not have data-triton-root-id " +
						"and was probably not created by Triton. Other code may be manually mucking with the DOM, which could " +
						"cause unpredictable behavior", tritonRoot);
				}
			})
		}

		// if we are reattaching to server-generated HTML, we should find the triton roots that were sent down.
		// we store them in a temp array indexed by their triton-root-id.
		var existingTritonRoots = [];
		for (var i = 0; i < this.mountNode.children.length; i++) {
			if (this.mountNode.children[i].hasAttribute(TRITON_DATA_ATTRIBUTE)) {
				existingTritonRoots[this.mountNode.children[i].getAttribute(TRITON_DATA_ATTRIBUTE)] = this.mountNode.children[i];
			}
		}
	
		// TODO: deal with promises of elements -sra.
		debug('React Rendering');
		var elements = PageUtil.standardizeElements(page.getElements());
		elements.forEach((element, index) => {
			var root = existingTritonRoots[index];
			if (!root) {
				// create a new triton root element for each ReactElement that we want to render.
				root = document.createElement("div");
				root.setAttribute(TRITON_DATA_ATTRIBUTE, index);
				this.mountNode.appendChild(root);
			}
			// TODO: replace this once continuation-local-storage holds our important context vars.
			element = React.addons.cloneWithProps(element, { context: this.context });
			React.render(element, root, () => {
				debug('React Rendered');
				this.emit('render');
			});
		});


		this._previouslyRendered = true;
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

                // REDFIN-TODO: this appears to pass some state. Should we figure out how to replicate that?
                // context.executeAction(navigateAction, {type: History.events.POPSTATE, path: path, params: e.state});

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

