
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

var TRITON_DATA_ATTRIBUTE = "data-triton-root-id";


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

		// if we were previously rendered on the client, clean up the old divs and 
		// their ReactComponents.
		this._cleanupPreviousRender();

		// if we are reattaching to server-generated HTML, we should find the root elements that were sent down.
		// we store them in a temp array indexed by their triton-root-id.
		var serverRenderedRoots = [];
		for (var i = 0; i < this.mountNode.children.length; i++) {
			if (this.mountNode.children[i].hasAttribute(TRITON_DATA_ATTRIBUTE)) {
				serverRenderedRoots[this.mountNode.children[i].getAttribute(TRITON_DATA_ATTRIBUTE)] = this.mountNode.children[i];
			}
		}
	
		debug('React Rendering');
		var elementPromises = PageUtil.standardizeElements(page.getElements());

		var renderElement = (element, index) => {
			// for each ReactElement that we want to render, either use the server-rendered root element, or 
			// create a new root element.
			var root = serverRenderedRoots[index] || this._createTritonRootNode(this.mountNode, index);

			// TODO: get rid of context once continuation-local-storage holds our important context vars.
			element = React.addons.cloneWithProps(element, { context: this.context });
			React.render(element, root);
		};

		// TODO: deal with the timeouts. 
		// I learned how to chain an array of promises from http://bahmutov.calepin.co/chaining-promises.html
		return elementPromises.reduce((chain, next, index) => {
			return chain.then((element) => {
		 		renderElement(element, index - 1);
				return next;
			})
		}).then((element) => {
			// reduce is called length - 1 times. we need to call one final time here to make sure we 
			// chain the final promise.
	 		renderElement(element, elementPromises.length - 1);

			this._previouslyRendered = true;
			debug('React Rendered');
			this.emit('render');
		});
	}

	/**
	 * Cleans up a previous React render in the document. Unmounts all the components and destoys the mounting
	 * DOM node(s) that were created.
	 */
	_cleanupPreviousRender() {
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

			// Now, for each of the roots, unmount the React component and destroy the DOM node.
			tritonRoots.forEach((tritonRoot) => {
				if (tritonRoot.hasAttribute(TRITON_DATA_ATTRIBUTE)) {
					// since this node has a data-triton-root-id, we can assume that we created it and should
					// destroy it.
					React.unmountComponentAtNode(tritonRoot);
					this.mountNode.removeChild(tritonRoot);
				} else {
					// it's deeply troubling that there's a div we didn't create, but for now, just warn, and  
					// don't obliterate the node.
					console.warn("Found an element inside Triton's rendering canvas that did not have data-triton-root-id " +
						"and was probably not created by Triton. Other code may be manually mucking with the DOM, which could " +
						"cause unpredictable behavior", tritonRoot);
				}
			});
		}
	}

	/**
	 * This method creates a new div to render a ReactElement in to at the end of the mount node.
	 */
	_createTritonRootNode(mountNode, index) {
		var root = document.createElement("div");
		root.setAttribute(TRITON_DATA_ATTRIBUTE, index);
		mountNode.appendChild(root);
		return root;
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

