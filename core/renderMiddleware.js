
var logger = require('./logging').getLogger(__LOGGER__),
	React = require('react/addons'),
	RequestContext = require('./context/RequestContext'),
	RequestLocalStorage = require('./util/RequestLocalStorage'),
	RLS = RequestLocalStorage.getNamespace(),
	LABString = require('./util/LABString'),
	ClientCssHelper = require('./util/ClientCssHelper'),
	Q = require('q'),
	config = require('./config'),
	ExpressServerRequest = require("./ExpressServerRequest"),
	PageUtil = require("./util/PageUtil"),
	PromiseUtil = require("./util/PromiseUtil");


// TODO FIXME ?? 
// It *might* be worthwhile to get rid of all the closure-y things in render()
// https://developers.google.com/speed/articles/optimizing-javascript

var DATA_LOAD_WAIT = 250;

/**
 * renderMiddleware entrypoint. Called by express for every request.
 */
module.exports = function(routes) {

	return function (req, res, next) { RequestLocalStorage.startRequest(() => {

		var start = new Date();

		logger.debug(`Incoming request for ${req.path}`);

		// Just to keep an eye out for leaks.
		logger.gauge("requestLocalStorageNamespaces", RequestLocalStorage.getCountNamespaces());

		// TODO? pull this context building into its own middleware
		var context = new RequestContext.Builder()
				.setRoutes(routes)
				.setLoaderOpts({}) // TODO FIXME
				.setDefaultXhrHeadersFromRequest(req)
				.create({
					// TODO: context opts?
				});

		// This is the default.
		// Can be overridden by the page or middleware.
		context.setDataLoadWait(DATA_LOAD_WAIT)

		// setup navigation handler (TODO: should we have a 'once' version?)
		context.onNavigate( (err, page) => {

			if (err) {
				logger.error("onNavigate error", err);
				if (err.status && err.status === 404) {
					next();
				} else if (err.status === 301 || err.status === 302) {
					res.redirect(err.status, err.redirectUrl);
				} else {
					next(err);
				}
				return;
			}

			logger.debug('Executing navigate action');
			
			beginRender(req, res, start, context, page);

		});

		context.navigate(new ExpressServerRequest(req));

	})}
}

function beginRender(req, res, start, context, page) {
	logger.debug(`Starting server render of ${req.path}`);

	var routeName = context.navigator.getCurrentRoute().name;

	logger.debug("Route Name: " + routeName);

	var renderTimer = logger.timer("renderFunction");

	// regardless of what happens, write out the header part
	// TODO: should this include the common.js file? seems like it
	// would give it a chance to download and parse while we're loading
	// data
	//
	// Each of these functions has the same signature and returns a
	// promise, so we can chain them up with a promise reduction.
	[
		Q(), // This is just a NOOP lead-in to prime the reduction.
		writeHeader,
		startBody,
		writeBody,
		writeData,
		setupLateArrivals,
	].reduce((chain, func) => chain
		.then(() => func(req, res, context, start, page))
		.then(() => renderTimer.tick(func.name))
	).catch(err => logger.error("Error in beginRender chain", err.stack));

	// TODO: we probably want a "we're not waiting any longer for this"
	// timeout as well, and cancel the waiting deferreds
}

function writeHeader(req, res, context, start, pageObject) {
	logger.debug('Starting document header');
	res.type('html');

	res.write("<!DOCTYPE html><html><head>");
	
	return Q.all([
		renderTitle(pageObject, res),
		renderStylesheets(pageObject, res),
		renderScripts(pageObject, res),
		renderMetaTags(pageObject, res),
		renderBaseTag(pageObject, res)
	]).then(() => {
		// once we have finished rendering all of the pieces of the head element, we 
		// can close the head and start the body element.
		res.write(`</head>`);
	});
}

function renderTitle (pageObject, res) {
	return pageObject.getTitle().then((title) => {
		logger.debug("Rendering title");
		res.write(`<title>${title}</title>`);
	});
}

function renderMetaTags (pageObject, res) {
	var metaTags = pageObject.getMetaTags();

	var metaTagsRendered = metaTags.map(metaTagPromise => {
		return metaTagPromise.then(metaTag => {
			// TODO: escaping
			if ((metaTag.name && metaTag.httpEquiv) || (metaTag.name && metaTag.charset) || (metaTag.charset && metaTag.httpEquiv)) {
				throw new Error("Meta tag cannot have more than one of name, httpEquiv, and charset", metaTag);
			}

			if ((metaTag.name && !metaTag.content) || (metaTag.httpEquiv && !metaTag.content)) {
				throw new Error("Meta tag has name or httpEquiv but does not have content", metaTag);
			}

			if (metaTag.noscript) res.write(`<noscript>`);
			res.write(`<meta`);

			if (metaTag.name) res.write(` name="${metaTag.name}"`);
			if (metaTag.httpEquiv) res.write(` http-equiv="${metaTag.httpEquiv}"`);
			if (metaTag.charset) res.write(` charset="${metaTag.charset}"`);
			if (metaTag.content) res.write(` content="${metaTag.content}"`);

			res.write(`>`)
			if (metaTag.noscript) res.write(`</noscript>`);
		});
	});

	return Q.all(metaTagsRendered);
}

function renderBaseTag(pageObject, res) {
	return pageObject.getBase().then((base) => {
		if (base !== null) {
			res.write(`<base href=${base.href}`);
			if (base.target) {
				res.write(` target=${base.target}`);
			}
			res.write(`>`);
		}
	});
}

function renderScriptsSync(scripts, res) {

	// We should only need to render scripts synchronously if we have a
	// non-JS script somewhere in the mix.
	logger.warn("Loading scripts synchronously.  Check `type` attributes.");

	// right now, the getXXXScriptFiles methods return synchronously, no promises, so we can render
	// immediately.
	scripts.forEach( (script) => {
		// make sure there's a leading '/'
		if (script.href) {
			res.write(`<script src="${script.href}" type="${script.type}"></script>`);
		} else if (script.text) {
			res.write(`<script type="${script.type}">${script.text}</script>`);
		} else {
			throw new Error("Script cannot be rendered because it has neither an href nor a text attribute: " + script);
		}
	});
}

function renderScriptsAsync(scripts, res) {

	// Nothing to do if there are no scripts.
	if (!scripts.length) return;

	// Lazily load LAB the first time we spit out async scripts.
	if (!RLS().didLoadLAB){

		// Don't need "type" in <script> tags anymore.
		//
		// http://www.w3.org/TR/html/scripting-1.html#the-script-element
		//
		// > The default, which is used if the attribute is absent, is "text/javascript".
		//
		res.write(`<script>${LABString}</script>`);

		// We always want scripts to be executed in order.
		res.write("<script>$LAB.setOptions({AlwaysPreserveOrder:true});</script>");

		// Only need to do this part once.
		RLS().didLoadLAB = true;
	}

	// The assignment to `window._tLAB` here is so we maintain a single
	// LAB chain through all of our calls to `renderScriptsAsync`.
	//
	// You can think of a LAB chain as being similar to a promise chain.
	// The output of `$LAB.script()` or `$LAB.wait()` is an object that
	// itself has `script()` and `wait()` methods.  So long as the output
	// of each call is used as the input for the next call our code (both
	// async loaded scripts and inline JS) will be executed _in order_.
	//
	// If we start a _new_ chain directly from `$LAB` (the root chain), we
	// can wind up with _out of order_ execution.
	//
	// We want everything to be executed in order, so we maintain one
	// master chain for the page.  This chain is `window._tLAB`.
	//
	res.write("<script>window._tLAB=(window._tLAB||$LAB)");

	scripts.forEach(script => {

		if (script.href) {

			res.write(`.script("${script.href}")`);

		} else if (script.text) {

			// The try/catch dance here is so exceptions get their
			// own time slice and can't mess with execution of the
			// LAB chain.
			//
			// The binding to `this` is so enclosed references to
			// `this` correctly get the `window` object (despite
			// being in a strict context).
			//
			res.write(`.wait(function(){"use strict";try{${
				script.text
			}}catch(e){setTimeout(function(){throw(e)},1)}}.bind(this))`);

		} else {

			throw new Error("Script needs either `href` or `text`: " + script);
		}
	});

	res.write(";</script>");
}

function renderScripts(pageObject, res) {

	// Want to gather these into one list of scripts, because we care if
	// there are any non-JS scripts in the whole bunch.
	var scripts = pageObject.getSystemScripts().concat(pageObject.getScripts());

	var thereIsAtLeastOneNonJSScript = scripts.filter(
		script => script.type && script.type != "text/javascript"
	).length;

	if (thereIsAtLeastOneNonJSScript){

		// If there are non-JS scripts we can't use LAB for async
		// loading.  We still want to preserve script execution order,
		// so we'll cut over to all-synchronous loading.
		renderScriptsSync(scripts, res);
	} else {

		// Otherwise, we can do async script loading.
		renderScriptsAsync(scripts, res);
	}

	// resolve immediately.
	return Q("");
}

function renderStylesheets (pageObject, res) {
	pageObject.getHeadStylesheets().forEach((styleSheet) => {
		if (styleSheet.href) {
			res.write(`<link rel="stylesheet" type="${styleSheet.type}" media="${styleSheet.media}" href="${styleSheet.href}" ${ClientCssHelper.PAGE_CSS_NODE_ID}>`);
		} else if (styleSheet.text) {
			res.write(`<style type="${styleSheet.type}" media="${styleSheet.media}" ${ClientCssHelper.PAGE_CSS_NODE_ID}>${styleSheet.text}</style>`);
		} else {
			throw new Error("Style cannot be rendered because it has neither an href nor a text attribute: " + styleSheet);
		}
	});

	// resolve immediately.
	return Q("");

	// implementation for async included below for if/when we switch over.
	// var styleSheetsRendered = [];
	// pageObject.getHeadStylesheets().forEach((styleSheetPromise) => {
	// 	styleSheetsRendered.push(
	// 		styleSheetPromise.then((stylesheet) => {
	// 			res.write(`<link rel="stylesheet" type="text/css" href="${stylesheet}" id="${ClientCssHelper.PAGE_CSS_NODE_ID}">`);
	// 		});
	// 	);
	// });
	// return Q.all(styleSheetsRendered);
}

function startBody(req, res, context, start, page) {

	var routeName = context.navigator.getCurrentRoute().name

	return page.getBodyClasses().then((classes) => {
		logger.debug("Starting body");
		classes.push(`route-${routeName}`)
		res.write(`<body class='${classes.join(' ')}'><div id='content'>`);
	})
}

/**
 * Writes out the ReactElements to the response. Returns a promise that fulfills when
 * all the ReactElements have been written out.
 */
function writeBody(req, res, context, start, page) {

	logger.debug("React Rendering");
	// standardize to an array of EarlyPromises of ReactElements
	var elementPromises = PageUtil.standardizeElements(page.getElements());

	// a boolean array to keep track of which elements have already been rendered. this is useful
	// bookkeeping when the timeout happens so we don't double-render anything.
	var rendered = [];

	// render the elements in sequence when they resolve (i.e. tell us they are ready).
	// I learned how to chain an array of promises from http://bahmutov.calepin.co/chaining-promises.html
	var noTimeoutRenderPromise =  elementPromises.concat(Q()).reduce((chain, next, index) => {
		return chain.then((element) => {
	 		if (!rendered[index-1]) renderElement(res, element, context, index - 1);
	 		rendered[index - 1] = true;
			return next;
		})
	}).catch((err) => {
		logger.error("Error while rendering without timeout", err.stack);
	});

	// Some time has already elapsed since the request started.
	// Note that you can override `DATA_LOAD_WAIT` with a
	// `?_debug_data_load_wait={ms}` query string parameter.
	var totalWait     = req.query._debug_data_load_wait || context.getDataLoadWait()
	,   timeRemaining = totalWait - (new Date - start)

	logger.debug(`totalWait: ${totalWait}ms, timeRemaining: ${timeRemaining}ms`);

	// set up a maximum wait time for data loading. if this timeout fires, we render with whatever we have,
	// as best as possible. note that once the timeout fires, we render everything that's left
	// synchronously.
	var timeoutRenderPromise = Q.delay(timeRemaining).then(() => {
		// if we rendered everything up to the last element already, just return.
		if (rendered[elementPromises.length - 1]) return;

		logger.debug("Timeout Exceeeded. Rendering...");
		elementPromises.forEach((promise, index) => {
			if (!rendered[index]) {
				renderElement(res, promise.getValue(), context, index);
				rendered[index] = true;
			}
		});
	});

	// return a promise that resolves when either the async render OR the timeout sync
	// render happens. 
	return PromiseUtil.race(noTimeoutRenderPromise, timeoutRenderPromise).then(()=> logger.debug("Finished rendering body."));
}

function renderElement(res, element, context, index) {
	logger.debug(`Rendering root element #${index}`);
	res.write(`<div data-triton-root-id=${index}>`);
	if (element !== null) {
		element = React.addons.cloneWithProps(element, { context: context });
		res.write(React.renderToString(element));
	}
	res.write("</div>");
}

function writeData(req, res, context, start) {
	logger.debug('Exposing context state');
	res.expose(context.dehydrate(), 'InitialContext');
	res.expose(getNonInternalConfigs(), "Config");


	res.write("</div>"); // <div id="content">

	// Using naked `rfBootstrap()` instead of `window.rfBootstrap()`
	// because the browser's error message if it isn't defined is more
	// helpful this way.  With `window.rfBootstrap()` the error is just
	// "undefined is not a function".
	renderScriptsAsync([{
		text: `${res.locals.state};rfBootstrap();`
	}], res);

	var routeName = context.navigator.getCurrentRoute().name;

	logger.time(`content_written.${routeName}`, new Date - start);
}

function setupLateArrivals(req, res, context, start) {
	var loader = context.loader;
	var allRequests = loader.getAllRequests();
	var notLoaded = loader.getPendingRequests();
	var routeName = context.navigator.getCurrentRoute().name;


	notLoaded.forEach( pendingRequest => {
		pendingRequest.entry.dfd.promise.then( data => {
			logger.debug("Late arrival: " + pendingRequest.url)
			logger.time(`late_arrival.${routeName}`, new Date - start);
			renderScriptsAsync([{
				text: `__lateArrival(${
					JSON.stringify(pendingRequest.url)
				}, ${
					JSON.stringify(data)
				});`
			}], res);
		})
	});

	// TODO: maximum-wait-time-exceeded-so-cancel-pending-requests code
	var promises = notLoaded.map( result => result.entry.dfd.promise );
	Q.allSettled(promises).then(function () {
		res.end("</body></html>");
		logger.gauge(`countTotalRequests.${routeName}`, allRequests.length);
		logger.gauge(`countLateArrivals.${routeName}`, notLoaded.length, {hi: 1});
		logger.time(`all_done.${routeName}`, new Date - start);
	});
}

function getNonInternalConfigs() {
	var nonInternal = {};
	var fullConfig = config();
	Object.keys(fullConfig).forEach( configKey => {
		if (configKey !== 'internal') {
			nonInternal[configKey] = fullConfig[configKey];
		}
	});
	return nonInternal;
}
