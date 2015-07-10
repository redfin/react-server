
var React = require('react/addons'),
	logger = require('./logging').getLogger(__LOGGER__),
	RequestContext = require('./context/RequestContext'),
	RequestLocalStorage = require('./util/RequestLocalStorage'),
	Q = require('q'),
	cssHelper = require('./util/ClientCssHelper'),
	EventEmitter = require("events").EventEmitter,
	ClientRequest = require("./ClientRequest"),
	History = require('./components/History'),
	PageUtil = require("./util/PageUtil"),
	TritonAgent = require('./TritonAgent');

// for dev tools
window.React = React;

var TRITON_DATA_ATTRIBUTE = "data-triton-root-id";

// Browsers handle error and stack serialization in various ways.  This gives
// us a good shot at getting something useful out of it.
logClientError = (msg, err) => logger.error(msg, `${err}\n${err.stack}`)

/**
 * Set up a Q error handler to make sure that errors that bubble
 * up are logged via our logger. Note: This will affect all unhandled
 * Q promise rejections, not just the ones in this file.
 */
Q.onerror = (err) => {
	logClientError("Unhandled exception in Q promise: ", err);
}

class ClientController extends EventEmitter {

	constructor ({routes}) {
		var dehydratedState = window.__tritonState;

		checkNotEmpty(dehydratedState, 'InitialContext');
		checkNotEmpty(dehydratedState, 'Config');

		RequestLocalStorage.startRequest();

		this.config = buildConfig(dehydratedState.Config);

		if (routes.onClientConfigLoaded) {
			routes.onClientConfigLoaded.call(this);
		}

		this.context = buildContext(routes);
		TritonAgent.cache().rehydrate(dehydratedState.InitialContext['TritonAgent.cache']);
		this.mountNode = document.getElementById('content');

		var irDfd = this._initialRenderDfd = Q.defer();
		this.once('render', irDfd.resolve.bind(irDfd));

		this._setupNavigateListener();
		this._setupLateArrivalHandler();

		this._previouslyRendered = false;
	}

	terminate() {
		// We may not have set up any history stuff...
		if (!this._history) return;
        this._history.off(this._historyListener);
        this._historyListener = null;
        this._history = null;
	}

	_startRequest() {

		// If this is a secondary request (client transition) within a
		// session, then we'll get a fresh RequestLocalStorage
		// container.
		if (this._previouslyRendered){
			RequestLocalStorage.startRequest();
			// we need to re-register the request context as a RequestLocal.
			this.context.registerRequestLocal();
		}
	}

	_setupNavigateListener () {
		var context = this.context; 

		context.onNavigateStart(this._startRequest.bind(this));

		/**
		 * type is one of 
		 *    History.events.PUSHSTATE: user clicked something to go forward but browser didn't do a 
		 * full page load
		 *    History.events.POPSTATE: user clicked back button but browser didn't do a full page load
		 *    History.events.PAGELOAD: full browser page load, not using History API.
		 */
		context.onNavigate( (err, page, path, type) => {
			logger.debug('Executing navigate action');
			
			// if this is a History.events.PUSHSTATE navigation, we should change the URL in the bar location bar 
			// before rendering. 
			// note that for browsers that do not have pushState, this will result in a window.location change 
			// and full browser load. It's kind of late to do that, as we may have waited for handleRoute to 
			// finish asynchronously. perhaps we should have an "URLChanged" event that happens before "NavigateDone".
			if (type === History.events.PUSHSTATE && this._history) {
				this._history.pushState(null, null, path);
			}

			if (err) {
				// redirects are sent as errors, so let's handle it if that's the case. 
				if (err.status && (err.status === 301 || err.status === 302)) {
					if (!err.redirectUrl) {
						console.error("A redirect status was sent without a corresponding redirect redirectUrl.", err);
					} else {
						setTimeout(() => {
							this._history.replaceState(null, null, err.redirectUrl);
							this.context.navigate(new ClientRequest(err.redirectUrl)); 
						}, 0);
					}
				} else {
					logClientError("onNavigate error:", err);
				}
				return;
			}

			var routeName = context.navigator.getCurrentRoute().name;

			if (!this._previouslyRendered) {
				cssHelper.registerPageLoad(routeName);
			} else {
				// render the document title.
				this._renderTitle(page);

				// render the base tag.
				this._renderBase(page);

				this._renderMetaTags(page);

			}

			cssHelper.ensureCss(routeName, page);

			page.getBodyClasses().then((classes) => {
				classes.push(`route-${routeName}`);
				document.body.className = classes.join(' ');
			}).then(() => this._render(page)).catch((err) => {
				logClientError("Error while adding body classes", err);
			}).done();

		});

	}

	_renderTitle(page) {
		page.getTitle().then(newTitle => {
			if (newTitle && newTitle !== document.title) {
				document.title = newTitle;
			}
		})
		.catch(err => { logClientError("Error while setting the document title:", err) })
		.done();
	}

	_renderBase(page) {
		page.getBase().then(base => {
			var currentBaseTag = document.head.querySelector("head base");
			if (base === null) {
				// get rid of the current base tag.
				if (currentBaseTag) currentBaseTag.parentNode.removeChild(currentBaseTag);
			} else {
				// we need a base tag. add one if it's not there yet. 
				if (!currentBaseTag) {
					currentBaseTag = document.createElement("base");
					document.head.appendChild(currentBaseTag);
				}
				currentBaseTag.href = base.href;
				if (base.target) currentBaseTag.target = base.target;
			}

		}).catch(err => {
			logClientError("Error rendering <base>", err);
		}).done();
	}

	_renderMetaTags(page) {
		// first, remove all the current meta tags.
		var currentMetaTags = document.head.querySelectorAll("meta");
		for (var i = 0; i < currentMetaTags.length; i++) {
			currentMetaTags[i].parentNode.removeChild(currentMetaTags[i]);
		}

		// now add all the meta tags for the new page.
		page.getMetaTags().forEach((metaTagPromise) => {
			metaTagPromise.then((metaTag) => {
				var parent = document.head;
				if (metaTag.noscript) {
					var noscript = document.createElement("noscript");
					parent.appendChild(noscript);
					parent = noscript;
				}

				var meta = document.createElement("meta");
				["name", "httpEquiv", "charset", "content"].forEach((name) => {
					if (metaTag[name]) meta[name] = metaTag[name];
				});

				parent.appendChild(meta);
			})
			.catch( err => { logClientError("Error rendering meta tags: ", err); })
			.done();
		});
	}

	_render (page) {
		var t0 = new Date;
		logger.debug('React Rendering');

		// if we were previously rendered on the client, clean up the old divs and 
		// their ReactComponents.
		this._cleanupPreviousRender(this.mountNode);

		// if we are reattaching to server-generated HTML, we should find the root elements that were sent down.
		// we store them in a temp array indexed by their triton-root-id.
		var serverRenderedRoots = [];
		this._getRootElements(this.mountNode).forEach((rootElement) => {
			serverRenderedRoots[rootElement.getAttribute(TRITON_DATA_ATTRIBUTE)] = rootElement;
		});

		var elementPromises = PageUtil.standardizeElements(page.getElements());

		var newRenderedElements = []
		,   syncRenderDfd       = Q.defer()
		,   syncRenderTimer     = null

		var renderElement = (element, index) => {

			// for each ReactElement that we want to render, either use the server-rendered root element, or 
			// create a new root element.
			logger.debug("Rendering root node #" + index);
			var root = serverRenderedRoots[index] || this._createTritonRootNode(this.mountNode, index);

			// TODO: get rid of context once continuation-local-storage holds our important context vars.
			// `element` can be null if getValue() on the root element promise returns null
			if (element) {
				element = React.addons.cloneWithProps(element, { context: this.context });
				newRenderedElements[index] = React.render(element, root);
			}
			if (index === elementPromises.length - 1) {
				logger.debug('React Rendered');
				logger.time('render', new Date - t0);
				this.emit("render");
			}
		};


		// When the TritonAgent cache is depleted there may be some
		// react root elements left that didn't rely on any store data,
		// but were stuck behind elements that _did_.  In order to give
		// those elements a chance to render normally (not via
		// `getValue()`) we'll schedule the sync render for a few
		// milliseconds in the future.
		//
		var scheduleSyncRender = () => {
			syncRenderTimer = setTimeout(() => {
				syncRenderTimer = null;
				syncRenderDfd.resolve();
			}, 25);
		};

		// Then, each time an element successfully renders normally it
		// will _reschedule_ the sync render for _another_ few
		// milliseconds in the future.  This allows the normal render
		// to stay ahead of the sync render so long as it's not waiting
		// on anything async.
		//
		var rescheduleSyncRender = () => {
			if (!syncRenderTimer) return;
			clearTimeout(syncRenderTimer)
			scheduleSyncRender();
		}

		syncRenderDfd.promise.then(() => {
			logger.debug("Starting sync render.");

			elementPromises.forEach((promise, index) => {

				// If this element was already rendered
				// normally we don't need to do anything.
				if (!newRenderedElements[index]){
					renderElement(promise.getValue(), index);
				}
			});
		}).catch(err => {
			logClientError("Error during syncRender:", err);
		}).done();

		// if and when the loader runs out of cache, we should render everything we have synchronously through EarlyPromises.
		// this lets us render when the server timed out.
		TritonAgent.cache().whenCacheDepleted().then(() => {
			logger.debug("Loader cache depleted.");
			scheduleSyncRender();
		}).catch(err => {
			logClientError("Error in scheduleSyncRender: ", err);
		}).done();

		// if no element promises, break early,
		// and say we rendered
		if (!elementPromises.length) {
			return Q().then(() => {
				this._previouslyRendered = true;
			});
		}

		// I find the control flow for chaining promises impossibly mind-bending, but what I intended was something
		// like: 
		// 
		//		elementPromises.forEach((elementPromise, index) => {
		//			var element = await elementPromise;
		//			renderElement(element, index);
		//		});
		//		this._previouslyRendered = true;
		//		this.emit("render");
		//
		// if it was using ES7 async/await syntax. I learned how to chain an array of promises in ES5/6
		// from http://bahmutov.calepin.co/chaining-promises.html , and apparently it looks like the code below. But
		// if I got something wrong, what I intended was the control flow expressed in this comment.
		return elementPromises.reduce((chain, next, index) => {
			return chain.then((element) => {
		 		renderElement(element, index - 1);

				// If our TritonAgent cache has been depleted
				// we're racing with the sync render.  We want
				// to stay ahead of it, so we'll tell it to
				// wait a few milliseconds before kicking off.
				// This gives the next element in the promise
				// chain a head start in the event loop if it's
				// not waiting for anything asynchronous.
				rescheduleSyncRender();

				return next;
			})
		}).then((element) => {
			// reduce is called length - 1 times. we need to call one final time here to make sure we 
			// chain the final promise.
	 		renderElement(element, elementPromises.length - 1);

			this._previouslyRendered = true;
		}).catch((err) => {
			logClientError("Error while rendering:", err);
		}); // no done(), because we're handing this promise off to someone else
	}

	/**
	 * Cleans up a previous React render in the document. Unmounts all the components and destoys the mounting
	 * DOM node(s) that were created.
	 */
	_cleanupPreviousRender(mountNode) {
		if (this._previouslyRendered) {
			logger.debug("Removing previous page's React components");

			this._getRootElements(mountNode).forEach((tritonRoot) => {
				// since this node has a "data-triton-root-id" attribute, we can assume that we created it and 
				// should destroy it. Destruction means first unmounting from React and then destroying the DOM node.
				React.unmountComponentAtNode(tritonRoot);
				mountNode.removeChild(tritonRoot);
			});
		}
	}

	/**
	 * Returns an array of all of the root elements that are children of mountNode. The root elements
	 * should all have a "data-triton-root-id" attribute and be direct children of mountNode.
	 */
	_getRootElements(mountNode) {
		// if children returned an array instead of a NodeList, we could use .filter(), but 
		// alas, it does not. We could copy it over to an array, but seems easier to just iterate 
		// over the NodeList.
		var potentialRoots = mountNode.children;
		var result = [];
		for (var i = 0; i < potentialRoots.length; i++) {
			var potentialRoot = potentialRoots[i];
			if (potentialRoot.hasAttribute(TRITON_DATA_ATTRIBUTE)) {
				// since this node has a "data-triton-root-id" attribute, we can assume that we created it.
				result.push(potentialRoot);
			} else {
				// it's deeply troubling that there's a div we didn't create, but for now, just warn, and  
				// don't obliterate the node.
				console.warn("Found an element inside Triton's rendering canvas that did not have data-triton-root-id " +
					"and was probably not created by Triton. Other code may be manually mucking with the DOM, which could " +
					"cause unpredictable behavior", potentialRoot);
			}
		}
		return result;
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

		var unloadHandler = () => {this.terminate();};

		if (window && window.addEventListener) {
		    window.addEventListener("unload", unloadHandler);
		}
		else if (window && window.attachEvent) {
		    window.attachEvent("onunload", unloadHandler);
		}

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
		var init = () => this._history.on(this._historyListener);

		// Need to go _after_ 'load' callbacks complete.
		// Safari fires a 'popstate' on load (RED-67600).
		// https://developer.mozilla.org/en-US/docs/Web/Events/popstate
		if (document.readyState === 'complete'){
			init();
		} else {
			window.addEventListener('load', ()=>setTimeout(init,0));
		}
	}

	_setupLateArrivalHandler () {
		// used by <script> callbacks to register data sent down on the
		// initial connection after initial render
		window.__lateArrival = this.lateArrival.bind(this);
	}

	lateArrival (url, dehydratedEntry) {
		this._initialRenderDfd.promise.done( () => {
			TritonAgent.cache().lateArrival(url, dehydratedEntry);
		});
	}

}

function checkNotEmpty(state, key) {
	if (typeof state[key] === 'undefined') {
		var msg = key + ' not defined in dehydrated state';
		logger.error(msg)
		throw new Error(msg);
	}
}

function buildConfig(dehydratedConfig) {
	// rehydrate the config object
	var config = require("./config")();
	config.rehydrate(dehydratedConfig);
	return config;
}

function buildContext(routes) {
	var context = new RequestContext.Builder()
		.setRoutes(routes)
		.create();
	return context;
}

module.exports = ClientController;

