var Q      = require('q')
,   logger = require('./logging').getLogger(__LOGGER__)

var {PAGE_CONTENT_NODE_ID} = require('./constants');

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

class FramebackController {

	constructor() {
		this.active = false;
		this.masterTitle = document.title; // Let's just stash this away.
	}

	isActive(){
		return this.active;
	}

	navigateTo(url){
		logger.debug(`Navigating to ${url}`);

		this.active = true;

		this.hideMaster();

		if (url !== this.url){
			// We, unfortunately, can't just point the existing
			// frame at a new page since that would be a
			// navigation.  So, we'll destroy it and create a
			// fresh replacement.
			if (this.frame){
				this.destroyFrame();
			}
			this.createFrame(url);
		}
		this.showFrame();

		// Should we wait for the details page to load?
		// I don't think so.  We want the back button to be snappy.
		// If the user clicks back before the page finishes loading
		// we'll just abandon the frame.  If that causes some issue
		// then we'll have to return a promise attached to a deferred
		// that gets resolved in `_handleFrameLoad()`.
		return Q();
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
	}

	createFrame(url){
		this.url = url;
		this.frame = document.createElement("iframe");

		Object.keys(FRAME_STYLE).forEach(k => {
			this.frame.style[k] = FRAME_STYLE[k]
		});

		this.frame.src = absoluteUrl(url);

		document.body.appendChild(this.frame);

		// Can't get the `contentWindow` until it's in the document.
		this.frame.contentWindow.addEventListener(
			'load', this._handleFrameLoad.bind(this, this.frame)
		);

		// Disable triton client navigation in the frame.
		this.frame.contentWindow.__tritonIsFrame = true;
	}


	showFrame(){
		this.frame.style.display = 'block';
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

		[].slice.call(frame.contentDocument.body.querySelectorAll('a')).forEach(link => {
			if (!link.target) link.target = '_top';
		});

		// We've got it now, so let's set it.
		this.setTitleFromFrame();

		logger.debug("Frame loaded");
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
