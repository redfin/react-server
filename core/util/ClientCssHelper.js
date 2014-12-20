
var debug = require('debug')('rf:ClientCssHelper');

var pageCssLinkNode;
var loadedCss = {};

var ClientCssHelper = module.exports = {

	PAGE_CSS_NODE_ID: 'CssClientHelper-InitialCSS',

	registerPageLoad: function registerPageLoad(routeName) {
		if (SERVER_SIDE) {
			throw new Error("ClientCssHelper.registerPageLoad can't be called server-side");
		}
		pageCssLinkNode = loadedCss[routeName] = document.getElementById(ClientCssHelper.PAGE_CSS_NODE_ID);
	},

	ensureCss: function ensureCss(routeName, pageObject) {
		if (SERVER_SIDE) {
			throw new Error("ClientCssHelper.registerPageLoad can't be called server-side");
		}

		if (pageCssLinkNode === loadedCss[routeName]) {
			debug("No-op: CSS for " + routeName + " is already in use");
			return;
		}

		var newCss = pageObject.getHeadStylesheet();

		if (!loadedCss[routeName] && newCss) {
			var styleTag = document.createElement('link');
			styleTag.rel = 'stylesheet';
			styleTag.type = 'text/css';

			styleTag.href = newCss;
			loadedCss[routeName] = styleTag;
		}

		debug('Updating to CSS for: ' + routeName);
		if (pageCssLinkNode) {
			// remove loaded CSS from the DOM
			pageCssLinkNode.parentNode.removeChild(pageCssLinkNode);
		}

		if (newCss) {
			// if we have new CSS, then we've already created the node (or)
			// have one from a previous load, so add it to the dom
			pageCssLinkNode = loadedCss[routeName];
			document.head.appendChild(pageCssLinkNode);
		} else {
			pageCssLinkNode = null;
		}
	}
}
