/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
 /*
  * Redfin: unchnaged (so far)
  */
/*global window */

var events = {
		POPSTATE: 'popstate',
		// the constant really should be "pushstate" but the router made it "click". added PUSHSTATE
		// constant to make naming consistent, CLICK for backwards compat
		CLICK: "click",
		PUSHSTATE: "click",
		PAGELOAD: "pageload",
	};

/**
 * This only supports pushState for the browsers with native pushState support.
 * For other browsers (mainly IE8 and IE9), it will refresh the page upon pushState()
 * and replaceState().
 * @class History
 * @constructor
 * @param {Object} [options]  The options object
 * @param {Window} [options.win=window]  The window object
 */
function History(options) {
	this.win = (options && options.win) || window;
	this._hasPushState = !!(this.win && this.win.history && this.win.history.pushState);
}

History.prototype = {
	/**
	 * Add the given listener for 'popstate' event (nothing happens for browsers that
	 * don't support popstate event).
	 * @method on
	 * @param {Function} listener
	 */
	on: function (listener) {
		if (this._hasPushState) {
			this.win.addEventListener(History.events.POPSTATE, listener);
		}
	},

	/**
	 * Remove the given listener for 'popstate' event (nothing happens for browsers that
	 * don't support popstate event).
	 * @method off
	 * @param {Function} listener
	 */
	off: function (listener) {
		if (this._hasPushState) {
			this.win.removeEventListener(History.events.POPSTATE, listener);
		}
	},

	/**
	 * Gets the path string, including the pathname and search query (if it exists).
	 * @method getPath
	 * @return {String} The path string that denotes current route path
	 */
	getPath: function () {
		var location = this.win.location;
		return location.pathname + location.search;
	},

	/**
	 * Same as HTML5 pushState API, but with old browser support
	 * @method pushState
	 * @param {Object} state The state object
	 * @param {String} title The title string
	 * @param {String} url The new url
	 */
	pushState: function (state, title, url) {
		var win = this.win;
		if (this._hasPushState) {
			win.history.pushState(state, title, url);
		} else {
			win.location.href = url;
		}
	},

	/**
	 * Same as HTML5 replaceState API, but with old browser support
	 * @method replaceState
	 * @param {Object} state The state object
	 * @param {String} title The title string
	 * @param {String} url The new url
	 */
	replaceState: function (state, title, url) {
		var win = this.win;
		if (this._hasPushState) {
			win.history.replaceState(state, title, url);
		} else {
			win.location.replace(url);
		}
	},
};

History.events = events;

module.exports = History;
