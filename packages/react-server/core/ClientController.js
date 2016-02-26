
var React = require('react'),
	ReactDOM = require('react-dom'),
	MobileDetect = require('mobile-detect'),
	logger = require('./logging').getLogger(__LOGGER__),
	RequestContext = require('./context/RequestContext'),
	RequestLocalStorage = require('./util/RequestLocalStorage'),
	Q = require('q'),
	cssHelper = require('./util/ClientCssHelper'),
	EventEmitter = require("events").EventEmitter,
	ClientRequest = require("./ClientRequest"),
	History = require('./components/History'),
	PageUtil = require("./util/PageUtil"),
	ReactServerAgent = require('./ReactServerAgent'),
	FramebackController = require('./FramebackController'),
	{getRootElementAttributes} = require('./components/RootElement'),
	{PAGE_LINK_NODE_ID, PAGE_CONTAINER_NODE_ID} = require('./constants');

var _ = {
	forEach: require('lodash/collection/forEach'),
};

// for dev tools
window.React = React;

var REACT_SERVER_DATA_ATTRIBUTE = "data-react-server-root-id";

/**
 * Set up a Q error handler to make sure that errors that bubble
 * up are logged via our logger. Note: This will affect all unhandled
 * Q promise rejections, not just the ones in this file.
 */
Q.onerror = (err) => {
	logger.error("Unhandled exception in Q promise", err);
}

class ClientController extends EventEmitter {

	constructor ({routes}) {
		super();

		var wakeTime = new Date - window.__reactServerTimingStart;

		var dehydratedState = window.__reactServerState;

		checkNotEmpty(dehydratedState, 'InitialContext');
		checkNotEmpty(dehydratedState, 'Config');

		RequestLocalStorage.startRequest();

		this.config = buildConfig(dehydratedState.Config);

		if (routes.onClientConfigLoaded) {
			routes.onClientConfigLoaded.call(this);
		}

		this.context = buildContext(routes);
		ReactServerAgent.cache().rehydrate(dehydratedState.InitialContext['ReactServerAgent.cache']);
		this.mountNode = document.getElementById('content');

		this._setupFramebackController();
		this._setupNavigateListener();
		this._setupArrivalHandlers();

		this._previouslyRendered = false;
		this._rootNodeDfds = [];
		this._failDfd = Q.defer();

		// Log this after loglevel is set.
		logger.time('wakeFromStart', wakeTime);
	}

	terminate() {
		// We may not have set up any history stuff...
		if (!this._history) return;
		this._history.off(this._historyListener);
		this._historyListener = null;
		this._history = null;
	}

	_startRequest({request, type}) {

		if (request.getFrameback()){

			// Tell the navigator we got this one.
			this.context.navigator.ignoreCurrentNavigation();

			var url = request.getUrl();

			if (type === History.events.PUSHSTATE) {
				this._history.pushState({frameback:true}, null, url);
			}

			this.framebackController.navigateTo(url).then(() => {
				this.context.navigator.finishRoute();
			});

		} else {

			// If this is a secondary request (client transition)
			// within a session, then we'll get a fresh
			// RequestLocalStorage container.
			if (this._previouslyRendered){

				RequestLocalStorage.startRequest();

				// we need to re-register the request context
				// as a RequestLocal.
				this.context.registerRequestLocal();
			}
		}
	}

	_setupFramebackController () {
		this.framebackController = new FramebackController();
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
							// we're about to load the _next_ page, so we should mark the
							// redirect navigation finished
							context.navigator.finishRoute();
							this._history.replaceState(null, null, err.redirectUrl);
							context.navigate(new ClientRequest(err.redirectUrl));
						}, 0);
					}
				} else {
					logger.error("onNavigate error", err);
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

				this._renderLinkTags(page);
			}

			cssHelper.ensureCss(routeName, page);

			page.getBodyClasses().then((classes) => {
				classes.push(`route-${routeName}`);
				document.body.className = classes.join(' ');
			}).then(() => this._render(page)).catch((err) => {
				logger.error("Error during client transition render", err);
			}).then(() => {

				// We're responsible for letting the navigator
				// know when we're more or less done stomping
				// around in the current request context
				// setting things up.
				//
				// We can't _guarantee_ that pages/middleware
				// haven't set timers to mess with things in
				// the future, so we need to wait a bit before
				// letting the navigator yank our context if
				// an immediate subsequent navigation is
				// scheduled.
				//
				// I don't like this magic delay here, but it
				// gives us a better shot at falling after
				// things like lazy load images do their
				// post-render wire-up.
				//
				// Anything that the current page does in the
				// request context _after_ this timeout has
				// elapsed and we've started a subsequent
				// navigation is pure corruption. :p
				//
				setTimeout(() => context.navigator.finishRoute(), 200);
			}).done();

		});

	}

	_renderTitle(page) {
		page.getTitle().then(newTitle => {
			if (newTitle && newTitle !== document.title) {
				document.title = newTitle;
			}
		})
		.catch(err => { logger.error("Error while setting the document title", err) })
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
			logger.error("Error rendering <base>", err);
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
			.catch( err => { logger.error("Error rendering meta tags", err); })
			.done();
		});
	}

	_renderLinkTags(page) {

		// First, remove all the current link tags.
		;[].slice.call(document.head.querySelectorAll(`link[${PAGE_LINK_NODE_ID}]`))
			.forEach(tag => tag.parentNode.removeChild(tag));

		// Then add all the link tags for the new page.
		page.getLinkTags()
		.forEach(promise => promise.then(PageUtil.makeArray).then(tags => tags.forEach(tag => {
			document.head.appendChild(
				[document.createElement('link'), PAGE_LINK_NODE_ID]
				.concat(Object.keys(tag))
				.reduce((link, attr) => (link.setAttribute(attr, tag[attr] || ''), link))
			);
		})).catch(err => logger.error("Error rendering link tags", err)).done());
	}

	_render (page) {
		var tStart = window.__reactServerTimingStart;
		var t0 = new Date;
		var retval = Q.defer();

		logger.debug('React Rendering');

		// We keep track of the _total_ time we spent rendering during
		// each request so we can keep track of that overhead.
		var totalRenderTime = 0;

		// We'll consider the page "interactive" when we've rendered
		// all elements that we expect to be above the fold.
		// Need this to be an integer value greater than zero.
		var aboveTheFoldCount = Math.max(page.getAboveTheFoldCount()|0, 1)

		// if we were previously rendered on the client, clean up the old divs and
		// their ReactComponents.
		this._cleanupPreviousRender(this.mountNode);

		// These resolve with React elements when their data
		// dependencies are fulfilled.
		var elementPromises = PageUtil.standardizeElements(page.getElements());

		// These resolve with DOM mount points for the elements.
		//
		// Our behavior is different here for the _first_ render vs
		// during a client transition.
		var rootNodePromises;
		if (this._previouslyRendered){

			// On a client transition we've just blown away all of
			// our mount points from the previous page, and we'll
			// create a fresh set.  We'll defer creating them
			// until we've actually got our elements, since some
			// items in the elements array may be container
			// control.
			rootNodePromises = elementPromises.map(() => Q())
		} else {

			// On our _first_ render we want to mount to the DOM
			// nodes produced during the _server-side_ render.
			//
			// We're awake and doing our thing while these
			// server-rendered elements are streaming down, so we
			// need to wait to render a given element until its
			// mount point arrives.
			//
			// The server will tell us when each mount point is
			// ready by calling `nodeArrival`, which triggers
			// resolution of the corresponding `rootNodePromise`.
			elementPromises.forEach((promise, index) => {
				this._ensureRootNodeDfd(index);
			});
			rootNodePromises = this._rootNodeDfds.map(dfd => dfd.promise);
		}

		var mountNode = this.mountNode;

		// Once we've got an element and a root DOM node to mount it
		// in we can finally render.
		var renderElement = (element, root, index) => {

			// During client transitions we create our root
			// elements as we go.
			if (!root && this._previouslyRendered){
				if (element.containerOpen){

					// If we're opening a container that's
					// our new mountNode.
					mountNode = this._createContainerNode(
						mountNode,
						element.containerOpen,
						index
					);
				} else if (element.containerClose) {

					// If we're closing a container its
					// parent is once again our mountNode.
					mountNode = mountNode.parentNode;
				} else {

					// Need a new root element in our
					// current mountNode.
					root = this._createReactServerRootNode(mountNode, index)
				}
			}

			if (element.containerOpen || element.containerClose){
				return; // Nothing left to do.
			}

			var name  = PageUtil.getElementDisplayName(element)
			,   timer = logger.timer(`renderElement.individual.${name}`)

			element = React.cloneElement(element, { context: this.context });
			ReactDOM.render(element, root);

			_.forEach(
				getRootElementAttributes(element),
				(v, k) => root.setAttribute(k, v)
			);

			totalRenderTime += timer.stop();

			if (!this._previouslyRendered){
				var tDisplay = root.getAttribute('data-react-server-timing-offset');
				logger.time(`displayElement.fromStart.${name}`, +tDisplay);
				logger.time(`renderElement.fromStart.${name}`, new Date - tStart);

				if (index === aboveTheFoldCount - 1) {
					logger.time(`renderAboveTheFold.fromStart`, new Date - tStart);
					logger.time(`renderAboveTheFold.individual`, totalRenderTime);
					logger.time(`renderAboveTheFold.elementCount`, aboveTheFoldCount);
				}
			}
		};

		// As elements become ready, prime them to render as soon as
		// their mount point is available.
		//
		// Always render in order to proritize content higher in the
		// page.
		//
		elementPromises.reduce((chain, promise, index) => chain.then(
			() => promise.then(element => rootNodePromises[index]
				.then(root => renderElement(element, root, index))
				.catch(e => logger.error(`Error with element render ${index}`, e))
			).catch(e => logger.error(`Error with element promise ${index}`, e))
		), Q()).then(retval.resolve);

		// Look out for a failsafe timeout from the server on our
		// first render.
		if (!this._previouslyRendered){
			this._failDfd.promise.then(retval.resolve);
		}

		return retval.promise.then(() => {

			// This first one is just for historical continuity.
			logger.time('render', new Date - t0);

			// These are more interesting.
			logger.time('renderCPUTime', totalRenderTime);

			// Don't track this on client transitions.
			if (!this._previouslyRendered){
				logger.time('renderFromStart', new Date - tStart);
			}

			// Some things are just different on our first pass.
			this._previouslyRendered = true;

			this.emit('render');
		});
	}

	/**
	 * Cleans up a previous React render in the document. Unmounts all the components and destoys the mounting
	 * DOM node(s) that were created.
	 */
	_cleanupPreviousRender(mountNode) {
		if (this._previouslyRendered) {
			logger.debug("Removing previous page's React components");

			[].slice.call(
				mountNode.querySelectorAll(`div[${REACT_SERVER_DATA_ATTRIBUTE}]`)
			).forEach(root => {

				// Since this node has a "data-react-server-root-id"
				// attribute, we can assume that we created it
				// and should destroy it. Destruction means
				// first unmounting from React and then
				// destroying the DOM node.
				React.unmountComponentAtNode(root);
				root.parentNode.removeChild(root);
			});

			[].slice.call(
				mountNode.querySelectorAll(`div[${PAGE_CONTAINER_NODE_ID}]`)
			).forEach(root => {

				// Gotta get rid of our containers, too.
				// Need to do this _after_ killing the
				// elements, since they might live within
				// these containers.
				root.parentNode.removeChild(root);
			});
		}
	}

	/**
	 * This method creates a new div to render a ReactElement in to at the end of the mount node.
	 */
	_createReactServerRootNode(mountNode, index) {
		var root = document.createElement("div");
		root.setAttribute(REACT_SERVER_DATA_ATTRIBUTE, index);
		mountNode.appendChild(root);
		return root;
	}

	_createContainerNode(mountNode, attrs, i) {
		var node = document.createElement("div");
		node.setAttribute(PAGE_CONTAINER_NODE_ID, i);
		_.forEach(attrs, (v, k) => node.setAttribute(k, v));
		mountNode.appendChild(node);
		return node;
	}

	init () {

		var unloadHandler = () => {this.terminate(); };

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

		// If we're running without client navigation then we don't
		// need a 'popstate' listener.
		if (window.__reactServerDisableClientNavigation) return;

		this._historyListener = ({state}) => {
			if (this.framebackController.isActive()){
				this.framebackController.navigateBack();
			} else {
				var frameback = (state||{}).frameback;
				if (context) {
					var path = this._history.getPath();

					// Pass in "popstate" because this is
					// when a user clicks the forward/back
					// button.
					context.navigate(
						new ClientRequest(path, {frameback}),
						History.events.POPSTATE
					);

				}
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

	_setupArrivalHandlers () {
		// used by <script> callbacks to register data sent down on the
		// initial connection after initial render
		window.__reactServerDataArrival = this.dataArrival.bind(this);
		window.__reactServerNodeArrival = this.nodeArrival.bind(this);
		window.__reactServerFailArrival = this.failArrival.bind(this);
	}

	_ensureRootNodeDfd (index) {
		if (!this._rootNodeDfds[index]){
			this._rootNodeDfds[index] = Q.defer();
		}
		return this._rootNodeDfds[index];
	}

	dataArrival (url, dehydratedEntry) {
		ReactServerAgent.cache().lateArrival(url, dehydratedEntry);
	}

	nodeArrival (index) {

		// The server has just let us know that a pre-rendered root
		// element has arrived.  We'll grab a reference to its DOM
		// node and un-block client-side rendering of the element that
		// we're going to mount into it.
		this._ensureRootNodeDfd(index).resolve(
			this.mountNode.querySelector(
				`div[${REACT_SERVER_DATA_ATTRIBUTE}="${index}"]`
			)
		);
	}

	failArrival () {
		this._failDfd.resolve();
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

	context.setMobileDetect(new MobileDetect(navigator.userAgent));

	return context;
}

module.exports = ClientController;
