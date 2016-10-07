
var React = require('react'),
	ReactDOM = require('react-dom'),
	MobileDetect = require('mobile-detect'),
	logging = require('./logging'),
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
	forEach: require('lodash/forEach'),
	assign: require('lodash/assign'),
};

var RLS = RequestLocalStorage.getNamespace();

var logger = logging.getLogger(__LOGGER__);

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

function getHistoryStateFrame(request) {

	// Mark the frame as ours.
	// Stash the request opts that were used to navigate to this frame.
	return { reactServerFrame: request?request.getOpts():{} }
}

function getHistoryPathname() {
	return location.pathname + location.search + location.hash;
}

class ClientController extends EventEmitter {

	constructor ({routes}) {
		super();

		window.__reactServerTimingStart = window.performance ? window.performance.timing.navigationStart : undefined;

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

		this._setupNavigateListener();
		this._setupArrivalHandlers();

		this._previouslyRendered = false;
		this._rootNodeDfds = [];
		this._failDfd = Q.defer();

		// Log this after loglevel is set.
		logTimingData('wakeFromStart', window._reactServerTimingStart);
		// this is a proxy for when above the fold content gets painted (displayed) on the browser
		logTimingData('displayAboveTheFold.fromStart', window._reactServerTimingStart, window.__displayAboveTheFold);
	}

	terminate() {
		// We may not have set up any history stuff...
		if (!this._history) return;
		this._history.off(this._historyListener);
		this._historyListener = null;
		this._history = null;
	}

	_startRequest({request, type}) {

		const t0 = type === History.events.PAGELOAD
			?window.__reactServerTimingStart // Try to use navigation timing.
			:new Date;                       // There's no naviagation.  We're it.

		const url = request.getUrl();
		const FC = this.context.framebackController;
		const isPush = type === History.events.PUSHSTATE;
		const shouldEnterFrame = request.getFrameback() && (
			// A push to a frame, or a pop _from_ a previous push.
			isPush || ((this._lastState||{}).reactServerFrame||{})._framebackExit
		);

		// This is who we're going to listen to regarding when navigation is
		// complete for timing purposes.  By default it's our navigator, but
		// if we're going to do a frameback navigation we'll listen to the
		// frameback controller instead.
		let navigationTimingAuthority = this.context.navigator;

		this._reuseDom = request.getReuseDom();

		// If we're _entering_ a frame or we're _already in_ a frame
		// then we'll delegate navigation to the frameback controller,
		// which will tell the client controller within the frame what
		// to do.
		if (shouldEnterFrame || FC.isActive()) {

			// Tell the navigator we got this one.
			this.context.navigator.ignoreCurrentNavigation();

			// This only happens on a popstate.
			if (request.getOpts()._framebackExit) {

				// That was fun!
				FC.navigateBack();
				setTimeout(() => {

					// Need to do this in a new time slice
					// to get order of events right in
					// external subscribers.
					this.context.navigator.finishRoute();
				});

			} else {

				// We're going to let the navigator unlock navigation (via
				// back button) as soon as our frame starts loading.  This is
				// nice from an interactivity perspective.  But we still want
				// to know how long it actually took to load the content in
				// the frame.  For that we'll listen to the frameback
				// controller.
				navigationTimingAuthority = FC;

				// Here we go...
				FC.navigate(request).then(() => {
					this.context.navigator.finishRoute();
				});
			}

		} else if (this._previouslyRendered) {

			// If we're supposed to exit a frame, and we don't
			// have one open, then we need to do a full browser
			// navigation.  There's no provision for client
			// transitions between the outer page and the frame.
			if (request.getOpts()._framebackExit) {

				// This is just so the navigator doesn't try
				// to proceed with an ordinary navigation.
				// This whole window is toast.
				this.context.navigator.ignoreCurrentNavigation();

				// Start from scratch with current URL (we've
				// just popped).
				document.location.reload();

				// That's all, folks.
				return;
			}

			// If this is a secondary request (client transition)
			// within a session, then we'll get a fresh
			// RequestLocalStorage container.
			RequestLocalStorage.startRequest();

			// If we're not going to reuse the DOM, let's
			// clean up right away to blank the screen.
			if (!this._reuseDom) {
				this._cleanupPreviousRender();
			}

			// we need to re-register the request context
			// as a RequestLocal.
			this.context.registerRequestLocal();
		}

		// If this is a History.events.PUSHSTATE navigation,
		// and we have control of the navigation bar (we're
		// not in a frameback frame) we should change the URL
		// in the location bar before rendering.
		//
		// Note that for browsers that do not have pushState,
		// this will result in a window.location change and
		// full browser load.
		//
		if (this._history && this._history.hasControl()) {

			if (isPush) {

				// Sorry folks.  If we need to do a client
				// transition, then we're going to clobber
				// your state.  You must be able to render
				// from URL, anyway, so if you're set up right
				// it won't affect user experience.  It means,
				// though, that there exists a navigation path
				// to an extraneous full-page rebuild.
				// Such is life.
				if (
					// Don't replace state unless we've
					// got a real history API.
					this._history.canClientNavigate() &&
					!(history.state||{}).reactServerFrame
				){
					this._history.replaceState(
						getHistoryStateFrame(),
						null,
						getHistoryPathname()
					);
				}

				this._setHistoryRequestOpts({

					// If we're entering a frame, then
					// when we get back here we need to
					// exit.
					_framebackExit: request.getFrameback(),

					// If we're reusing the DOM on the way
					// forward, then we can also reuse on
					// the way back.
					reuseDom: request.getReuseDom(),

					// The same reasoning as for
					// `reuseDom` also applies here.
					reuseFrame: request.getReuseFrame(),
				});

				this._history.pushState(
					getHistoryStateFrame(request),
					null,
					url
				);
			} else if (type === History.events.PAGELOAD) {

				// This _seems_ redundant with the
				// `replaceState` above, but keep in mind that
				// an initial `pushState` might not be a
				// client transition.  It could be a
				// non-`react-server` use of the history API.
				//
				// This also _replaces_ state with the request
				// URL, which handles client-side redirects.
				this._history.replaceState(
					getHistoryStateFrame(request),
					null,
					url
				)

				this._setHistoryRequestOpts({

					// If we wind up back here without
					// first client-transitioning away
					// then presumably we're still on the
					// same page that just had some
					// history maniptulation outside of
					// `react-server`.  In that case we're
					// ourselves and we should be able to
					// re-use the DOM.  Maybe
					// presumptuous, but a nicer
					// experience than clobbering.
					reuseDom: true,
				});
			}
		} else if (this._history) {

			// We're in a frameback frame, but we want to make sure that the
			// frame's `document.location` stays up to date.
			window.history.replaceState(null, null, url);
		}

		// If we've got control of the URL bar we'll also take responsibility
		// for logging how long the request took in a variety of ways:
		// - Request type (pageload, pushstate, popstate)
		// - Request options (reuseDom, bundleData, etc)
		if (!window.__reactServerIsFrame) {
			navigationTimingAuthority.once('loadComplete', () => {
				const bas = `handleRequest`;
				const typ = `type.${type||'PAGELOAD'}`;
				logTimingData(`${bas}.all`, t0);
				logTimingData(`${bas}.${typ}.all`, t0);
				_.forEach(request.getOpts(), (val, key) => {
					if (val) {
						const opt = `opt.${key}`;
						logTimingData(`${bas}.${opt}`, t0);
						logTimingData(`${bas}.${typ}.${opt}`, t0);
					}
				});
			});
		}



		this._lastState = history.state;
	}

	// Update the request options for the _current_ history navigation
	// state frame prior to pushing a new frame.
	_setHistoryRequestOpts(opts) {

		// If we don't have a real history API then we don't want to
		// mess with state since it results in full navigation.
		if (!this._history.canClientNavigate()) return;

		const state = _.assign({}, history.state);
		state.reactServerFrame = _.assign(state.reactServerFrame||{}, opts);
		this._history.replaceState(state, null, getHistoryPathname());
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
		context.onNavigate( (err, page) => {
			logger.debug('Executing navigate action');

			this._handleDebugParams(page);

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

			cssHelper.ensureCss(routeName, page)
				.then(() =>
					page.getBodyClasses().then((classes) => {
						classes.push(`route-${routeName}`);
						document.body.className = classes.join(' ');
					}))
				.then(() => this._render(page)).catch((err) => {
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

	_handleDebugParams(page) {
		const params = page.getRequest().getQuery();

		// Allow adjustment of log levels.
		_.forEach({
			_react_server_log_level       : 'main',
			_react_server_log_level_main  : 'main',
			_react_server_log_level_time  : 'time',
			_react_server_log_level_gauge : 'gauge',
		}, (type, param) => {
			if (params[param]) {
				logging.setLevel(type,  params[param]);
			}
		});
	}

	_renderTitle(page) {
		page.getTitle().then(newTitle => {
			if (newTitle && newTitle !== document.title) {
				document.title = newTitle;
			}

			// This is the earliest we have everything we need for
			// an analytics pageview event.
			this.emit("pageview", {
				page  : getHistoryPathname(),
				title : newTitle,
			});
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
				if (base.href) currentBaseTag.href = base.href;
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

		// These are only used if we're going to try to re-use the
		// existing DOM structure.
		var oldRootElement, oldRootContainer;

		// Once we've got an element and a root DOM node to mount it
		// in we can finally render.
		var renderElement = (element, root, index) => {

			// During client transitions we create our root
			// elements as we go.
			if (!root && this._previouslyRendered) {

				// If the _previous_ render had elements that
				// we can re-use we'll render into them.
				//
				// DOM re-use is currently opt-in.
				//
				if (this._reuseDom) {
					oldRootElement = document.querySelector(
						`div[${REACT_SERVER_DATA_ATTRIBUTE}="${index}"]`
					);
					oldRootContainer = document.querySelector(
						`div[${PAGE_CONTAINER_NODE_ID}="${index}"]`
					);
				}

				// The current strategy for re-use is: So long
				// as the _shape_ of the root structure is the
				// same, we'll re-use.  Once the new page's
				// shape diverges, we'll blow away the
				// remaining elements left over from the
				// previous page and create everything for the
				// new page as we go.
				//
				if (this._reuseDom && element.containerOpen && oldRootContainer) {
					mountNode = oldRootContainer;
					this._updateContainerNodeAttributes(
						mountNode,
						element.containerOpen
					);
				} else if (this._reuseDom && element.containerClose && !oldRootContainer && !oldRootElement) {
					mountNode = mountNode.parentNode;
				} else if (this._reuseDom && oldRootElement) {
					root = oldRootElement;
				} else {
					this._cleanupPreviousRender(index);
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
					} else if (!element.isTheFold) {

						// Need a new root element in our
						// current mountNode.
						root = this._createReactServerRootNode(mountNode, index)
					}
				}

			}

			if (element.containerOpen || element.containerClose){
				return; // Nothing left to do.
			} else if (element.isTheFold) {
				if (!this._previouslyRendered){
					logTimingData(`renderAboveTheFold.fromStart`, tStart);
					logTimingData(`renderAboveTheFold.individual`, 0, totalRenderTime);
					logTimingData(`renderAboveTheFold.elementCount`, 0, index + 1);
				}
				return; // Again, this isn't a real root element.
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
				logTimingData(`displayElement.fromStart.${name}`, 0, +tDisplay);
				logTimingData(`renderElement.fromStart.${name}`, tStart);
			}
		};

		// As elements become ready, prime them to render as soon as
		// their mount point is available.
		//
		// Always render in order to proritize content higher in the
		// page.
		//
		elementPromises.reduce((chain, promise, index) => chain
			.then(() => promise
				.then(element => rootNodePromises[index]
					.then(root => renderElement(element, root, index))
					.catch(e => {
						// The only case where this should evaluate to false is
						// when `element` is a containerClose/containerOpen object
						const componentType = typeof element.type === 'function'
							? element.props.children.type.name
							: 'element';
						logger.error(`Error with element ${componentType}'s lifecycle methods at index ${index}`, e);
					})
				).catch(e => logger.error(`Error with element promise ${index}`, e))
			),
		Q()).then(retval.resolve);

		// Look out for a failsafe timeout from the server on our
		// first render.
		if (!this._previouslyRendered){
			this._failDfd.promise.then(retval.resolve);
		}

		return retval.promise.then(() => {

			if (this._reuseDom) {

				// Clean up any dangling nodes if the previous page had more
				// than we do.
				this._cleanupPreviousRender(elementPromises.length);
			}

			// This first one is just for historical continuity.
			logTimingData('render', t0);

			// These are more interesting.
			logTimingData('renderCPUTime', 0, totalRenderTime);

			// Don't track this on client transitions.
			if (!this._previouslyRendered){
				logTimingData('renderFromStart', tStart);
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
	_cleanupPreviousRender(index) {

		index = index || 0; // Default to everything.

		if (this._previouslyRendered && !RLS().haveCleanedPreviousRender) {

			// Only need to do this once per request.
			RLS().haveCleanedPreviousRender = true;

			logger.debug("Removing previous page's React components");

			[].slice.call(
				document.querySelectorAll(`div[${REACT_SERVER_DATA_ATTRIBUTE}]`)
			).forEach((root, i) => {
				if (i >= index) {
					// Since this node has a "data-react-server-root-id"
					// attribute, we can assume that we created it
					// and should destroy it. Destruction means
					// first unmounting from React and then
					// destroying the DOM node.
					ReactDOM.unmountComponentAtNode(root);
					root.parentNode.removeChild(root);
				}
			});

			[].slice.call(
				document.querySelectorAll(`div[${PAGE_CONTAINER_NODE_ID}]`)
			).forEach((root, i) => {
				if (i >= index) {
					// Gotta get rid of our containers,
					// too.  Need to do this _after_
					// killing the elements, since they
					// might live within these containers.
					root.parentNode.removeChild(root);
				}
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

	_updateContainerNodeAttributes(node, attrs) {
		_.forEach(attrs, (v, k) => node.setAttribute(k, v));
	}

	init () {

		var unloadHandler = () => {this.terminate(); };

		if (window && window.addEventListener) {
			window.addEventListener("unload", unloadHandler);
		}
		else if (window && window.attachEvent) {
			window.attachEvent("onunload", unloadHandler);
		}

		this._initializeHistoryListener(this.context);

		// If this is a _refresh_ there may be some request options
		// stashed in the history navigation stack frame we're sitting
		// on.
		const state = this._history.canClientNavigate() && history.state;

		this._navigateWithHistoryState({
			state,
			path: getHistoryPathname(),
			type: History.events.PAGELOAD,
		});
	}

	_navigateWithHistoryState({path, state, type, check}) {
		const opts = (state||{}).reactServerFrame;

		if (check && !opts) return; // Not our frame.

		this.context.navigate(new ClientRequest(path, opts||{}), type);
	}

	/**
	 * Initializes us to listen to back button events. When the user presses the back button, the history
	 * listener will be called and cause a navigate() event.
	 */
	_initializeHistoryListener() {

		this._historyListener = ({state}) => {
			this._navigateWithHistoryState({
				state,
				path  : this._history.getPath(),
				type  : History.events.POPSTATE, // Forward/back.
				check : true, // Only navigate if frame is ours.
			});
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
		window.__reactServerClientController = this;
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

	nodeArrival (startIndex, endIndex) {

		// The server has just let us know that a pre-rendered root
		// element has arrived.  We'll grab a reference to its DOM
		// node and un-block client-side rendering of the element that
		// we're going to mount into it.
		for (var i = startIndex; i <= endIndex; i++) {
			this._ensureRootNodeDfd(i).resolve(
				this.mountNode.querySelector(
					`div[${REACT_SERVER_DATA_ATTRIBUTE}="${i}"]`
				)
			);
		}
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

	context.setFramebackController(new FramebackController());

	return context;
}

function logTimingData(bucket, start, end = new Date) {
	if (start === undefined) {
		//don't send timing data if start timing is undefined
		return;
	}

	logger.time(bucket, end - start);
}

module.exports = ClientController;
