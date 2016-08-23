/*

This module supports "frameback" functionality.

This is useful when there's a master/detail set of pages, and displaying the
master page is expensive.

For example, a Web based email client might have an URL like "/inbox" that
shows a list of emails, and URLs like "/email/1", "/email/2", etc., to show
the contents of a particular email.

Imagine a user is viewing "/inbox", and clicks through to "/email/32", and
then clicks the back button.  The browser will re-request "/inbox" (assuming
it's not cacheable, etc.)  If displaying "/inbox" is slow, the user will be
forced to wait.

One solution to this is to open details pages such as "/email/32" in a new tab
or window.  The back button no longer works, but the window showing "/inbox"
is still there showing the correct content!

This module offers an alternate way to speed up the back button.  Instead of
opening the details view in the same window (replacing the master view), or
opening in a new window, this library opens the details view in an iframe, and
hides the master view.  It uses HTML5 techniques to change the browser URL
without forcing a page reload.  When the user presses the back button, the
details view is hidden and the master view is displayed- instant back button!

In browsers that don't support HTML5 style history manipulation, the
experience is similar, but the back button isn't speeded up.  No iframe is
used and the library gets out of the way.  You can choose to either open in a
new tab or the same tab (by setting the 'target' attribute of anchors.)

You can use this functionality by simply adding a `frameback={true}` attribute
to your `<Link>` element.

The details page linked to need not itself be a react-server page.  If it _is_ a
react-server page it will have its client-navigation disabled.  Any navigation away
from the details page will result in a full navigation of the outer window
away from the master.  Thus only the master=>details=>back navigation is
speeded up.

*/

var EventEmitter = require('events').EventEmitter;

var Q      = require('q')
,   logger = require('./logging').getLogger(__LOGGER__)
,   RLS    = require('./util/RequestLocalStorage').getNamespace()

var ClientRequest = require('./ClientRequest');
var History = require('./components/History');

// This is an attribute that's added to the main content div that contains all
// react-server elements.
var {PAGE_CONTENT_NODE_ID} = require('./constants');

var _ = {
	assign: require('lodash/assign'),
	forEach: require('lodash/forEach'),
}

// Cover the whole viewport.
var FRAME_STYLE = {
	'border'   : '0px',
	'position' : 'absolute',
	'top'      : '0px',
	'left'     : '0px',
	'width'    : '100%',
	'height'   : '100%',
	'display'  : 'block',
	'zIndex'   : '10',
}

class FramebackController extends EventEmitter {

	// This is only works from the outer frame.
	// It's deprecated.  Access via the RequestContext.
	static getCurrent() {
		return RLS().instance;
	}

	constructor() {
		super();

		// We'll set this when we're showing the details page.
		this.active = false;

		// When we navigate back from a details page we'll restore the
		// outer page's title to that of the master page.
		this.masterTitle = document.title;

		// Stash ourselves in request local storage.
		RLS().instance = this;
	}

	// Are we currently showing a details page in an iframe?
	isActive(){
		return this.active;
	}

	navigate(request){
		const url = request.getUrl();

		logger.debug(`Navigating to ${url}`);

		this.loadTimer = logger.timer('loadTime');

		this.active = true;
		// update master title in case the title has changed since initialization
		this.masterTitle = document.title;

		this.hideMaster();

		if (url === this.url){

			// We're just going to show the frame.  It's already got our page.
			setTimeout(() => this.emit('loadComplete'));

		} else {

			if (this.frame && request.getReuseFrame()) {

				// If we have a frame and the request permits
				// us to reuse it by performing a client
				// transition we'll do that.
				this.navigateFrame(request);

			} else {

				// Otherwise we, unfortunately, can't just
				// point an existing frame at a new page since
				// that would be a navigation.  So, we'll
				// destroy it and create a fresh replacement.
				if (this.frame){
					this.destroyFrame();
				}

				this.createFrame(url);
			}
		}

		// One way or another we've got a frame pointed at this URL now.
		this.url = url;

		this.showFrame();

		// Should we wait for the details page to load?
		// I don't think so.  We want the back button to be snappy.
		// If the user clicks back before the page finishes loading
		// we'll just abandon the frame.  If that causes some issue
		// then we'll have to return a promise attached to a deferred
		// that gets resolved in `_handleFrameLoad()`.
		return Q();
	}

	willHandle(request, type) {

		// If we're not in a frame, then we've got nothing to do.
		if (!window.__reactServerIsFrame) return false;

		// If this is the initial page load request then the navigator
		// should handle it.
		if (!type || type === History.events.PAGELOAD) return false;

		// If the request is coming from the outer frame's frameback
		// controller, then the navigator should handle it.
		if (request.getOpts()._fromOuterFrame) return false;

		// Otherwise this is a client transition request from within
		// our frame, and we need to pass it through the outer frame's
		// navigator to get the history navigation stack taken care
		// of.

		// Can't reuse the frame if our request is for frameback
		// without frame reuse.
		const reuseFrame = request.getReuseFrame() || !request.getFrameback();

		request = new ClientRequest(
			request.getUrl(),
			_.assign({}, request.getOpts(), {
				frameback: false, // Navigation is _for_ frame.
				reuseFrame,
			})
		);
		window.parent.__reactServerClientController.context
			.navigate(request, type);

		return true;
	}

	navigateBack(){
		logger.debug(`Navigating back`);
		this.hideFrame();
		this.showMaster();
		this.active = false;
	}

	hideMaster(){
		contentDiv().style.display = 'none';
	}

	showMaster(){
		contentDiv().style.display = 'block';
		document.title = this.masterTitle;
		document.activeElement.blur();
		window.focus();
		this.emit('showMaster');
	}

	navigateFrame(request){

		// This is a request that we're going to send to the navigator
		// _in our frame_.
		const frameRequest = new ClientRequest(
			request.getUrl(),
			_.assign({}, request.getOpts(), {
				frameback       : false, // No frameback within frame.
				_fromOuterFrame : true,  // Actually navigate in frame.
			})
		)

		this.frame.contentWindow
			.__reactServerClientController
			.context
			.navigate(frameRequest,

				// The frame isn't actually managing the
				// history navigation stack.  We just tell it
				// that it's always navigating forward
				// regardless of what sort of navigation
				// _we're_ performing.
				History.events.PUSHSTATE
			);
	}

	createFrame(url){

		const frame = this.frame = document.createElement("iframe");

		frame.src = absoluteUrl(url);

		_.forEach(FRAME_STYLE, (v, k) => {frame.style[k] = v});

		frame.addEventListener('load', () => this._handleFrameLoad(frame));

		document.body.appendChild(frame);

		// Set this right away once we have a content window
		// (available as soon as we've appended to the DOM).
		frame.contentWindow.__reactServerIsFrame = true;
	}


	showFrame(){
		this.emit('showFrame');
		this.frame.style.display = 'block';
		// We want to put the focus on our child frame
		// Note that this will fire too soon when we're creating our
		// child frame for the first time but will cover the case
		// where we're navigating back to a child frame that's already
		// been created
		this.frame.contentWindow.focus();
		this.setTitleFromFrame();
	}

	setTitleFromFrame(){
		var doc = this.frame.contentDocument;
		if (doc.title && this.active){
			document.title = doc.title;
		}
	}

	hideFrame(){
		this.emit('hideFrame');
		this.frame.style.display = 'none';
	}

	destroyFrame(){
		document.body.removeChild(this.frame);
		this.frame = null;
	}

	_handleFrameLoad(frame){
		// Just in case the user navigated back and to a different
		// frame while we were waiting for the first frame to load.
		if (frame !== this.frame) return;

		const clientController = frame.contentWindow.__reactServerClientController;

		// If the frame has a client controller we'll listen to when
		// _it_ tells us it's done loading.
		//
		if (clientController && !clientController.__parentIsListening) {
			clientController.__parentIsListening = true;
			clientController.context.onLoadComplete(this._handleFrameLoad.bind(this, frame));
		}

		// It may have finished _before_ we get here, so we'll also check
		// whether it has already set its `_previouslyRendered` flag.
		//
		if (clientController && !clientController._previouslyRendered) {
			return;
		}

		[].slice.call(frame.contentDocument.body.querySelectorAll('a')).forEach(link => {
			if (!link.target) link.target = '_top';
		});

		// We've got it now, so let's set it.
		this.setTitleFromFrame();

		// When a frame is created for the first time, we need to wait
		// for it to load before giving it focus
		this.frame.contentWindow.focus();

		if (this.loadTimer) {

			this.loadTimer.stop();
			delete this.loadTimer;

			logger.debug("Frame loaded");
		} else {
			logger.debug("Frame navigated");
		}

		this.emit('loadComplete');
	}
}

function contentDiv(){
	return document.body.querySelector(`div[${PAGE_CONTENT_NODE_ID}]`);
}

function absoluteUrl(url){
	if (0 === url.indexOf('/')) {
		url = window.location.protocol + '//' + window.location.host + url;
	}
	return url;
}

module.exports = FramebackController;
