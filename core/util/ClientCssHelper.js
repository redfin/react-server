
var debug = require('debug')('rf:ClientCssHelper');

var pageCssLinkNode;
var loadedCss = {};

var ClientCssHelper = module.exports = {

	PAGE_CSS_NODE_ID: 'data-triton-css-url',

	registerPageLoad: function registerPageLoad(routeName) {
		if (SERVER_SIDE) {
			throw new Error("ClientCssHelper.registerPageLoad can't be called server-side");
		}
		// for each css node in the head that the Triton server wrote to the response, note it down in the cache, so that
		// we can remove it on a page to page transition.
		var serverWrittenLinkNodes = document.querySelectorAll(`link[${ClientCssHelper.PAGE_CSS_NODE_ID}]`, document.head);
		for (var i = 0; i < serverWrittenLinkNodes.length; i++) {
			var cssUrl = serverWrittenLinkNodes[i].getAttribute(ClientCssHelper.PAGE_CSS_NODE_ID);
			loadedCss[cssUrl] = serverWrittenLinkNodes[i];
		}
	},

	ensureCss: function ensureCss(routeName, pageObject) {
		if (SERVER_SIDE) {
			throw new Error("ClientCssHelper.registerPageLoad can't be called server-side");
		}

		var newCss = pageObject.getHeadStylesheets();

		// first, remove the unneeded CSS link elements.
		Object.keys(loadedCss).forEach(styleSheetUrl => {
			// TODO: indexOf is ES5 only; not sure if it's polyfilled.
			if (-1 === newCss.indexOf(styleSheetUrl)) {
				// remove the corresponding node from the DOM.
				debug("ensureCss removing stylesheet: " + styleSheetUrl);
				var node = loadedCss[styleSheetUrl];
				node.parentNode.removeChild(node);
				delete loadedCss[styleSheetUrl];
			}
		});

		// next add the style URLs that weren't already loaded.
		newCss.forEach((styleSheetUrl) => {
			if (!loadedCss[styleSheetUrl]) {
				// this means that the CSS is not currently present in the
				// document, so we need to add it.
				debug("ensureCss adding stylesheet: " + styleSheetUrl);
				var styleTag = document.createElement('link');
				styleTag.rel = 'stylesheet';
				styleTag.type = 'text/css';

				styleTag.href = styleSheetUrl;
				loadedCss[styleSheetUrl] = styleTag;
				document.head.appendChild(styleTag);
			} else {
				debug("ensureCss stylesheet already loaded (no-op): " + styleSheetUrl);
			}
		});
	}
}
