
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
	expressState = require('express-state'),
	cookieParser = require('cookie-parser'),
	PageUtil = require("./util/PageUtil"),
	PromiseUtil = require("./util/PromiseUtil"),
	TritonAgent = require('./util/TritonAgent');


// TODO FIXME ?? 
// It *might* be worthwhile to get rid of all the closure-y things in render()
// https://developers.google.com/speed/articles/optimizing-javascript

var DATA_LOAD_WAIT = 250;

// We'll use this for keeping track of request concurrency per worker.
var ACTIVE_REQUESTS = 0;

/**
 * renderMiddleware entrypoint. Called by express for every request.
 */
module.exports = function(server, routes) {

	expressState.extend(server);

	// parse cookies into req.cookies property
	server.use(cookieParser());

	// sets the namespace that data will be exposed into client-side
	// TODO: express-state doesn't do much for us until we're using a templating library
	server.set('state namespace', '__tritonState');

	server.use((req, res, next) => { RequestLocalStorage.startRequest(() => {
		ACTIVE_REQUESTS++;

		var start = new Date();
		var startHR = process.hrtime();

		logger.debug(`Incoming request for ${req.path}`);

		// Just to keep an eye out for leaks.
		logger.gauge("requestLocalStorageNamespaces", RequestLocalStorage.getCountNamespaces());

		// TODO? pull this context building into its own middleware
		var context = new RequestContext.Builder()
				.setRoutes(routes)
				.setDefaultXhrHeadersFromRequest(req)
				.create({
					// TODO: context opts?
				});

		// This is the default.
		// Can be overridden by the page or middleware.
		context.setDataLoadWait(DATA_LOAD_WAIT)

		// Need this stuff in corvair for logging.
		context.setServerStash({ req, res, start, startHR });

		// setup navigation handler (TODO: should we have a 'once' version?)
		context.onNavigate( (err, page, path, type) => {

			if (err) {
				logger.log("onNavigate received a non-2xx HTTP code", err);
				if (err.status && err.status === 404) {
					next();
				} else if (err.status === 301 || err.status === 302) {
					res.redirect(err.status, err.redirectUrl);
				} else {
					next(err);
				}
				handleResponseComplete(req, res, context, start, page);
				return;
			}

			renderPage(req, res, context, start, page);

		});

		context.navigate(new ExpressServerRequest(req));

	})});
}

module.exports.getActiveRequests = () => ACTIVE_REQUESTS;

function handleResponseComplete(req, res, context, start, page) {

	// All intentional response completion should funnel through this
	// function.  If this value starts climbing gradually that's an
	// indication that we have some _unintentional_ response completion
	// going on that we should deal with.
	ACTIVE_REQUESTS--;

	// If this was an error response other server middleware might change
	// the response code or send more data (e.g. a nice 404 page), so
	// we'll defer our calls to `logRequestStats()` and `handleComplete()`
	// until that's done.
	//
	// If error handling middleware is not synchronous we should use
	// something like `on-finished` to hook into the real response end.
	//
	setTimeout(() => logRequestStats(req, res, context, start, page), 0)

	// Note that if the navigator couldn't even map the request to a page,
	// we won't be able to call middleware `handleComplete()` here.
	//
	if (page) {
		setTimeout(page.handleComplete, 0);
	}
}

function renderPage(req, res, context, start, page) {

	var routeName = context.navigator.getCurrentRoute().name;

	logger.debug("Route Name: " + routeName);

	var renderTimer = logger.timer("renderFunction");

	// Each of these functions has the same signature and returns a
	// promise, so we can chain them up with a promise reduction.
	var lifecycleMethods = context.getIsFragment()
			? fragmentLifecycle()
			: pageLifecycle();

	lifecycleMethods.reduce((chain, func) => chain
		.then(() => func(req, res, context, start, page))
		.then(() => renderTimer.tick(func.name))
	).catch(err => {
		logger.error("Error in renderPage chain", err.stack)

		// Bummer.
		res.status(500).end();

		handleResponseComplete(req, res, context, start, page);
	});

	// TODO: we probably want a "we're not waiting any longer for this"
	// timeout as well, and cancel the waiting deferreds
}

function fragmentLifecycle () {
	return [
		Q(), // NOOP lead-in to prime the reduction
		writeBody,
		endResponse,
		handleResponseComplete
	];
}

function pageLifecycle() {
	return [
		Q(), // This is just a NOOP lead-in to prime the reduction.
		writeHeader,
		startBody,
		writeBody,
		writeData,
		setupLateArrivals,
		closeBody,
		endResponse,
		handleResponseComplete,
	];
}

function writeHeader(req, res, context, start, pageObject) {
	res.type('html');
	res.set('Transfer-Encoding', 'chunked');

	res.write("<!DOCTYPE html><html><head>");
	
	// note: these responses can currently come back out-of-order, as many are returning
	// promises. scripts and stylesheets are guaranteed
	return Q.all([
		renderTitle(pageObject, res),
		renderStylesheets(pageObject, res),
		renderScripts(pageObject, res),
		renderMetaTags(pageObject, res),
		renderLinkTags(pageObject, res),
		renderBaseTag(pageObject, res)
	]).then(() => {
		// once we have finished rendering all of the pieces of the head element, we 
		// can close the head and start the body element.
		res.write(`</head>`);
	});

	// Get headers out right away so secondary resource download can start.
	flushRes(res);
}

function flushRes(res){

	// This method is only defined on the response object if the compress
	// middleware is installed, so we need to guard our calls.
	if (res.flush) {
		res.flush()
	}
}

function renderTitle (pageObject, res) {
	return pageObject.getTitle().then((title) => {
		res.write(`<title>${title}</title>`);
	});
}

function renderMetaTags (pageObject, res) {
	var metaTags = pageObject.getMetaTags();

	var metaTagsRendered = metaTags.map(metaTagPromise => {
		return metaTagPromise.then(PageUtil.makeArray).then(metaTags => metaTags.forEach(metaTag => {
			// TODO: escaping
			if ((metaTag.name && metaTag.httpEquiv) || (metaTag.name && metaTag.charset) || (metaTag.charset && metaTag.httpEquiv)) {
				throw new Error("Meta tag cannot have more than one of name, httpEquiv, and charset", metaTag);
			}

			if ((metaTag.name && !metaTag.content) || (metaTag.httpEquiv && !metaTag.content)) {
				throw new Error("Meta tag has name or httpEquiv but does not have content", metaTag);
			}

			if (metaTag.noscript) res.write(`<noscript>`);
			res.write(`<meta`);

			if (metaTag.name)      res.write(` name="${metaTag.name}"`);
			if (metaTag.httpEquiv) res.write(` http-equiv="${metaTag.httpEquiv}"`);
			if (metaTag.charset)   res.write(` charset="${metaTag.charset}"`);
			if (metaTag.property)  res.write(` property="${metaTag.property}"`);
			if (metaTag.content)   res.write(` content="${metaTag.content}"`);

			res.write(`>`)
			if (metaTag.noscript) res.write(`</noscript>`);
		}));
	});

	return Q.all(metaTagsRendered);
}

function validateMetaTag(metaTag) {
	// count the number of non-"content" attrs in use. If it's more than one, throw an error
	// TODO: it's probably better to not exclude things here? if people were writing meta tags
	// themselves, they could put whatever they wanted in there...
	var possibleAttrs = ['name', 'httpEquiv', 'charset', 'property'];
	var count = possibleAttrs.reduce( (count, attrName) => {
		return metaTag[attrName] ? (count + 1) : count;
	});

	if (count > 1) {
		throw new Error(`<meta> tag cannot have more than one of: {possibleAttrs.join(",")}`);
	}

	if ( (metaTag.name || metaTag.httpEquiv || metaTag.property) && !metaTag.content ) {
		throw new Error(`<meta> tag has attribute requiring a content attr, but no content attr is specified`);
	}
}

function renderLinkTags (pageObject, res) {
	var linkTags = pageObject.getLinkTags();

	var linkTagsRendered = linkTags.map(linkTagPromise => {
		return linkTagPromise.then(PageUtil.makeArray).then(linkTags => linkTags.forEach(linkTag => {

			if (!linkTag.rel) {
				throw new Error(`<link> tag specified without 'rel' attr`);
			}

			var text = "<link";
			Object.keys(linkTag).forEach( attr => {
				text += ` ${attr}="${linkTag[attr]}"`;
			});
			text += ">";
			res.write(text);
		}));
	});

	return Q.all(linkTagsRendered);
}

function renderBaseTag(pageObject, res) {
	return pageObject.getBase().then((base) => {
		if (base !== null) {
			if (!base.href && !base.target) {
				throw new Error("<base> needs at least one of 'href' or 'target'");
			}
			var tag = "<base";
			if (base.href) {
				tag += ` href="${base.href}"`;
			}
			if (base.target) {
				tag += ` target="${base.target}"`;
			}
			tag += ">";
			res.write(tag);
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
		if (!script.type) script.type = "text/javascript";

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

	// Don't need "type" in <script> tags anymore.
	//
	// http://www.w3.org/TR/html/scripting-1.html#the-script-element
	//
	// > The default, which is used if the attribute is absent, is "text/javascript".
	//
	res.write("<script>");

	// Lazily load LAB the first time we spit out async scripts.
	if (!RLS().didLoadLAB){

		// This is the full implementation of LABjs.
		res.write(LABString);

		// We always want scripts to be executed in order.
		res.write("$LAB.setGlobalDefaults({AlwaysPreserveOrder:true});");

		// We'll use this to store state between calls (see below).
		res.write("window._tLAB=$LAB")

		// Only need to do this part once.
		RLS().didLoadLAB = true;
	} else {

		// The assignment to `_tLAB` here is so we maintain a single
		// LAB chain through all of our calls to `renderScriptsAsync`.
		//
		// Each call to this function emits output that looks
		// something like:
		//
		//   _tLAB=_tLAB.script(...).wait(...) ...
		//
		// The result is that `window._tLAB` winds up holding the
		// final state of the LAB chain after each call, so that same
		// LAB chain can be appended to in the _next_ call (if there
		// is one).
		//
		// You can think of a LAB chain as being similar to a promise
		// chain.  The output of `$LAB.script()` or `$LAB.wait()` is
		// an object that itself has `script()` and `wait()` methods.
		// So long as the output of each call is used as the input for
		// the next call our code (both async loaded scripts and
		// inline JS) will be executed _in order_.
		//
		// If we start a _new_ chain directly from `$LAB` (the root
		// chain), we can wind up with _out of order_ execution.
		//
		// We want everything to be executed in order, so we maintain
		// one master chain for the page.  This chain is
		// `window._tLAB`.
		//
		res.write("_tLAB=_tLAB");
	}

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
		classes.push(`route-${routeName}`)
		res.write(`<body class='${classes.join(' ')}'><div id='content'>`);
	})
}

/**
 * Writes out the ReactElements to the response. Returns a promise that fulfills when
 * all the ReactElements have been written out.
 */
function writeBody(req, res, context, start, page) {

	var bodyComplete = Q.defer();

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
		bodyComplete.reject(err);
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

		// The noTimeoutRenderPromise may have rejected our completion
		// deferred due to an exception.
		if (!bodyComplete.isPending()) return;

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
	PromiseUtil.race(noTimeoutRenderPromise, timeoutRenderPromise)
		.then(() => bodyComplete.resolve());

	return bodyComplete.promise;
}

function renderElement(res, element, context, index) {
	res.write(`<div data-triton-root-id=${index}>`);
	if (element !== null) {
		element = React.addons.cloneWithProps(element, { context: context });
		res.write(React.renderToString(element));
	}
	res.write("</div>");

	// It may be a while before we render the next element, so let's send
	// this one down right away.
	flushRes(res);
}

function writeData(req, res, context, start) {
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
}

function setupLateArrivals(req, res, context, start, page) {
	var notLoaded = TritonAgent.cache().getPendingRequests();

	// This is for reporting purposes.  We're going to log how many late
	// requests there were, but we won't actually emit the log line until
	// all of the requests have resolved.
	TritonAgent.cache().markLateRequests();

	notLoaded.forEach( pendingRequest => {
		pendingRequest.entry.whenDataReadyInternal().then( data => {
			logger.time("lateArrival", new Date - start);
			renderScriptsAsync([{
				text: `__lateArrival(${
					JSON.stringify(pendingRequest.url)
				}, "${
					/* note the double-quotes wrapping this string */
					encodeURIComponent(JSON.stringify(data))
				}");`
			}], res);

		})
	});

	// TODO: maximum-wait-time-exceeded-so-cancel-pending-requests code
	var promises = notLoaded.map( result => result.entry.dfd.promise );
	return Q.allSettled(promises)
}

function closeBody(req, res, context, start, page) {
	res.write("</body></html>");
	return Q();
}

function endResponse(req, res, context, start, page) {
	res.end();
	return Q();
}

function logRequestStats(req, res, context, start){
	var allRequests = TritonAgent.cache().getAllRequests()
	,   notLoaded   = TritonAgent.cache().getLateRequests()

	logger.gauge("countDataRequests", allRequests.length);
	logger.gauge("countLateArrivals", notLoaded.length, {hi: 1});
	logger.gauge("bytesRead", req.socket.bytesRead, {hi: 1<<12});
	logger.gauge("bytesWritten", req.socket.bytesWritten, {hi: 1<<18});

	var time = new Date - start;

	logger.time(`responseCode.${res.statusCode}`, time);
	logger.time("totalRequestTime", time);

	if (notLoaded.length) {
		logger.time("totalRequestTimeWithLateArrivals", time);
	}

	return Q();
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
