
var logger = require('./logging').getLogger(__LOGGER__),
	React = require('react'),
	RequestContext = require('./context/RequestContext'),
	RequestLocalStorage = require('./util/RequestLocalStorage'),
	RLS = RequestLocalStorage.getNamespace(),
	LABString = require('./util/LABString'),
	Q = require('q'),
	config = require('./config'),
	ExpressServerRequest = require("./ExpressServerRequest"),
	expressState = require('express-state'),
	cookieParser = require('cookie-parser'),
	PageUtil = require("./util/PageUtil"),
	TritonAgent = require('./TritonAgent'),
	StringEscapeUtil = require('./util/StringEscapeUtil'),
	{PAGE_CSS_NODE_ID, PAGE_LINK_NODE_ID, PAGE_CONTENT_NODE_ID} = require('./constants');


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

		var start = RLS().startTime = new Date();
		var startHR = process.hrtime();

		logger.debug(`Incoming request for ${req.path}`);

		// Just to keep an eye out for leaks.
		logger.gauge("requestLocalStorageNamespaces", RequestLocalStorage.getCountNamespaces());

		// monkey-patch `res.write` so that we don't try to write to the stream if it's
		// already closed
		var origWrite = res.write;
		res.write = function () {
			if (!res.finished) {
				origWrite.apply(res, arguments);
			} else {
				logger.error("Attempted write after response finished", { path: req && req.path || "unknown", stack: logger.stack() });
			}
		};

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
		context.onNavigate( (err, page) => {

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

	res.on('finish', RequestLocalStorage.bind(() => {

		// All intentional response completion should funnel through
		// this function.  If this value starts climbing gradually
		// that's an indication that we have some _unintentional_
		// response completion going on that we should deal with.
		ACTIVE_REQUESTS--;

		// Note that if the navigator couldn't even map the request to
		// a page, we won't be able to call middleware
		// `handleComplete()` here.
		//
		if (page) {
			page.handleComplete();

			logRequestStats(req, res, context, start, page);
		}
	}));
}

function renderPage(req, res, context, start, page) {

	var routeName = context.navigator.getCurrentRoute().name;

	logger.debug("Route Name: " + routeName);

	var renderTimer = logger.timer("renderFunction");

	res.status(page.getStatus()||200);

	// Each of these functions has the same signature and returns a
	// promise, so we can chain them up with a promise reduction.
	var lifecycleMethods;
	if (PageUtil.PageConfig.get('isFragment')){
		lifecycleMethods = fragmentLifecycle();
	} else if (PageUtil.PageConfig.get('isRawResponse')){
		lifecycleMethods = rawResponseLifecycle();
	} else {
		lifecycleMethods = pageLifecycle();
	}

	lifecycleMethods.reduce((chain, func) => chain
		.then(() => func(req, res, context, start, page))
		.then(() => renderTimer.tick(func.name))
	).catch(err => {
		logger.error("Error in renderPage chain", err)

		// Bummer.
		res.status(500).end();

		handleResponseComplete(req, res, context, start, page);
	});

	// TODO: we probably want a "we're not waiting any longer for this"
	// timeout as well, and cancel the waiting deferreds
}

function rawResponseLifecycle () {
	return [
		Q(), // NOOP lead-in to prime the reduction
		setContentType,
		writeResponseData,
		endResponse,
		handleResponseComplete,
	];
}

function fragmentLifecycle () {
	return [
		Q(), // NOOP lead-in to prime the reduction
		setContentType,
		writeDebugComments,
		writeBody,
		endResponse,
		handleResponseComplete,
	];
}

function pageLifecycle() {
	return [
		Q(), // This is just a NOOP lead-in to prime the reduction.
		setContentType,
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

function setContentType(req, res, context, start, pageObject) {
	res.set('Content-Type', pageObject.getContentType());
}

function writeHeader(req, res, context, start, pageObject) {
	res.type('html');
	res.set('Transfer-Encoding', 'chunked');

	res.write("<!DOCTYPE html><html><head>");

	// note: these responses can currently come back out-of-order, as many are returning
	// promises. scripts and stylesheets are guaranteed
	return Q.all([
		renderDebugComments(pageObject, res),
		renderTimingInit(pageObject, res),
		renderTitle(pageObject, res),
		renderStylesheets(pageObject, res),
		renderScripts(pageObject, res),
		renderMetaTags(pageObject, res),
		renderLinkTags(pageObject, res),
		renderBaseTag(pageObject, res),
	]).then(() => {
		// once we have finished rendering all of the pieces of the head element, we
		// can close the head and start the body element.
		res.write(`</head>`);

		// Get headers out right away so secondary resource download can start.
		flushRes(res);
	});
}

function flushRes(res){

	// This method is only defined on the response object if the compress
	// middleware is installed, so we need to guard our calls.
	if (res.flush) {
		res.flush()
		if (!RLS().didLogFirstFlush){
			RLS().didLogFirstFlush = true;
			logger.time('firstFlush', new Date - RLS().startTime);
		}
	}
}

function renderTimingInit(pageObject, res) {
	renderScriptsSync([{text:`__tritonTimingData={t0:+new Date,e:[]}`}], res)
}

function renderDebugComments (pageObject, res) {
	var debugComments = pageObject.getDebugComments();
	debugComments.map(debugComment => {
		if (!debugComment.label || !debugComment.value) {
			logger.warning("Debug comment is missing either a label or a value", debugComment);
		}

		res.write(`<!-- ${debugComment.label}: ${debugComment.value} -->`);
	});

	// resolve immediately.
	return Q("");
}

function writeDebugComments (req, res, context, start, pageObject) {
	return Q(renderDebugComments(pageObject, res));
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

function renderLinkTags (pageObject, res) {
	var linkTags = pageObject.getLinkTags();

	var linkTagsRendered = linkTags.map(linkTagPromise => {
		return linkTagPromise.then(PageUtil.makeArray).then(linkTags => linkTags.forEach(linkTag => {

			if (!linkTag.rel) {
				throw new Error(`<link> tag specified without 'rel' attr`);
			}

			res.write(`<link ${PAGE_LINK_NODE_ID} ${
				Object.keys(linkTag)
					.map(attr => `${attr}="${linkTag[attr]}"`)
					.join(' ')
			}>`);
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
			var LABScript = { src: script.href };

			if (script.crossOrigin){
				LABScript.crossOrigin = script.crossOrigin;
			}

			// If we don't have any other options we can shave a
			// few bytes by just passing the string.
			if (Object.keys(LABScript).length === 1){
				LABScript = LABScript.src;
			}

			if (script.condition) {
				res.write(`.script(function(){if(${script.condition}) return ${JSON.stringify(LABScript)}})`);
			} else {
				res.write(`.script(${JSON.stringify(LABScript)})`);
			}

		} else if (script.text) {
			if (script.condition) {
				throw new Error("Script using `text` cannot be loaded conditionally");
			}

			// The try/catch dance here is so exceptions get their
			// own time slice and can't mess with execution of the
			// LAB chain.
			//
			// The binding to `this` is so enclosed references to
			// `this` correctly get the `window` object (despite
			// being in a strict context).
			//
			res.write(`.wait(function(){${
				script.strict?'"use strict";':''
			}try{${
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
		script => script.type && script.type !== "text/javascript"
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
			res.write(`<link rel="stylesheet" type="${styleSheet.type}" media="${styleSheet.media}" href="${styleSheet.href}" ${PAGE_CSS_NODE_ID}>`);
		} else if (styleSheet.text) {
			res.write(`<style type="${styleSheet.type}" media="${styleSheet.media}" ${PAGE_CSS_NODE_ID}>${styleSheet.text}</style>`);
		} else {
			throw new Error("Style cannot be rendered because it has neither an href nor a text attribute: " + styleSheet);
		}
	});

	// resolve immediately.
	return Q("");
}

function startBody(req, res, context, start, page) {

	var routeName = context.navigator.getCurrentRoute().name

	return page.getBodyClasses().then((classes) => {
		classes.push(`route-${routeName}`)
		res.write(`<body class='${classes.join(' ')}'>`);
	}).then(() => page.getBodyStartContent()).then((texts) => texts.forEach((text) => {
		res.write(text);
	})).then(() => {
		res.write(`<div id='content' ${PAGE_CONTENT_NODE_ID}>`);
	});
}

/**
 * Writes out the ReactElements to the response. Returns a promise that fulfills when
 * all the ReactElements have been written out.
 */
function writeBody(req, res, context, start, page) {

	// standardize to an array of EarlyPromises of ReactElements
	var elementPromises = PageUtil.standardizeElements(page.getElements());

	// This is where we'll store our rendered HTML strings.  A value of
	// `undefined` means we haven't rendered that element yet.
	var rendered = elementPromises.map(() => undefined);

	// We need to return a promise that resolves when we're done, so we'll
	// maintain an array of deferreds that we punch out as we render
	// elements and we'll return a promise that resolves when they've all
	// been hit.
	var dfds = elementPromises.map(() => Q.defer());

	var doElement = (element, index) => {

		rendered[index] = renderElement(res, element, context);

		// If we've just rendered the next element to be written we'll
		// write it out.
		writeElements(res, rendered);

		dfds[index].resolve();
	};

	// Some time has already elapsed since the request started.
	// Note that you can override `DATA_LOAD_WAIT` with a
	// `?_debug_data_load_wait={ms}` query string parameter.
	var totalWait     = req.query._debug_data_load_wait || context.getDataLoadWait()
	,   timeRemaining = totalWait - (new Date - start)

	logger.debug(`totalWait: ${totalWait}ms, timeRemaining: ${timeRemaining}ms`);

	// Try to render everything when its data becomes available.
	elementPromises.forEach((promise, index) => promise.then(element => {

		// Bummer.  Already rendered synchronously.
		if (rendered[index] !== undefined) return;

		doElement(element, index);

	}).catch(e => logger.error("Error while rendering without timeout", e)));

	// If we run out of time, just render with what we've got.
	setTimeout(() => elementPromises.forEach((promise, index) => {

		// Awesome.  Already rendered normally.
		if (rendered[index] !== undefined) return;

		try {
			var element = promise.getValue();
		} catch (e) {
			logger.error("Error while rendering with timeout", e);
		}

		// Note that `element` may be undefined here if
		// `promise.getValue()` blew up.  That's okay, `renderElement`
		// wraps its call to `React.renderToString` in a try/catch.
		//
		// Importantly, we need to call `doElement` to resolve our
		// deferred for this element so we can proceed beyond
		// `writeBody`.  If there was an exception during the normal
		// render, above, it _won't_ have resolved our deferred, so
		// it's up to us.
		//
		doElement(element, index);

	}), timeRemaining);

	return Q.all(dfds.map(dfd => dfd.promise));
}

function writeResponseData(req, res, context, start, page) {
	page.setExpressRequest(req);
	page.setExpressResponse(res);
	return page.getResponseData().then(data => {
		if (typeof data !== 'undefined') {
			res.write(data);
		}
	});
}

function renderElement(res, element, context) {
	var name  = PageUtil.getElementDisplayName(element)
	,   start = RLS().startTime
	,   timer = logger.timer(`renderElement.individual.${name}`)
	,   html  = ''

	try {
		if (element !== null) {
			html = React.renderToString(
				React.cloneElement(element, { context: context })
			);
		}
	} catch (err) {
		// A component failing to render is not fatal.  We've already
		// started the page with a 200 response.  We've even opened
		// the `data-triton-root-id` div for this component.  We need
		// to close it out and move on.  This is a bummer, and we'll
		// log it, but it's too late to totally bail out.
		logger.error(`Error rendering element ${name}`, err);
	}

	// We time how long _this_ element's render took, and also how long
	// since the beginning of the request it took us to spit this element
	// out.
	var individualTime = timer.stop();
	logger.time(`renderElement.fromStart.${name}`, new Date - start);

	// We _also_ keep track of the _total_ time we spent rendering during
	// each request so we can keep track of that overhead.
	RLS().renderTime || (RLS().renderTime = 0);
	RLS().renderTime += individualTime;

	return html;
}

// Write as many elements out in a row as possible and then flush output.
// We render elements as their data becomes available, so they might fill in
// out-of-order.
function writeElements(res, elements) {

	// Pick up where we left off.
	var start = RLS().nextElement||(RLS().nextElement=0);

	for (var i = start; i < elements.length; RLS().nextElement = ++i){

		// If we haven't rendered the next element yet, we're done.
		if (elements[i] === undefined) break;

		// Got one!
		res.write(`<div data-triton-root-id=${i}>${elements[i]}</div>`);

		// Mark when it arrived.
		renderScriptsSync([{ text: `__tritonTimingData.e[${i}]=+new Date` }], res)

		// Free for GC.
		//
		// Note that `undefined` has special meaning here, so we're
		// using `null`, instead.
		elements[i] = null;
	}

	// It may be a while before we render the next element, so if we just
	// wrote anything let's send it down right away.
	if (i !== start) flushRes(res);
}

function writeData(req, res) {
	var initialContext = {
		'TritonAgent.cache': TritonAgent.cache().dehydrate(),
	};

	res.expose(initialContext, 'InitialContext');
	res.expose(getNonInternalConfigs(), "Config");


	res.write("</div>"); // <div id="content">

	// Using naked `rfBootstrap()` instead of `window.rfBootstrap()`
	// because the browser's error message if it isn't defined is more
	// helpful this way.  With `window.rfBootstrap()` the error is just
	// "undefined is not a function".
	renderScriptsAsync([{
		text: `${res.locals.state};rfBootstrap();`,
	}], res);
}

function setupLateArrivals(req, res, context, start) {
	var notLoaded = TritonAgent.cache().getPendingRequests();

	// This is for reporting purposes.  We're going to log how many late
	// requests there were, but we won't actually emit the log line until
	// all of the requests have resolved.
	TritonAgent.cache().markLateRequests();

	notLoaded.forEach( pendingRequest => {
		pendingRequest.entry.whenDataReadyInternal().then( () => {
			logger.time("lateArrival", new Date - start);
			renderScriptsAsync([{
				text: `__lateArrival(${
					JSON.stringify(pendingRequest.url)
				}, ${
					StringEscapeUtil.escapeForScriptTag(JSON.stringify(pendingRequest.entry.dehydrate()))
				});`,
			}], res);

		})
	});

	// TODO: maximum-wait-time-exceeded-so-cancel-pending-requests code
	var promises = notLoaded.map( result => result.entry.dfd.promise );
	return Q.allSettled(promises)
}

function closeBody(req, res) {
	res.write("</body></html>");
	return Q();
}

function endResponse(req, res) {
	res.end();
	return Q();
}

function logRequestStats(req, res, context, start){
	var allRequests = TritonAgent.cache().getAllRequests()
	,   notLoaded   = TritonAgent.cache().getLateRequests()
	,   sock        = req.socket
	,   stash       = context.getServerStash()

	// The socket can be re-used for multiple requests with keep-alive.
	// Fortunately, until HTTP/2 rolls around, the requests over a given
	// socket will happen serially.  So we can just keep track of the
	// previous values for each socket and log the delta for a given
	// request.
	stash.bytesR = sock.bytesRead    - (sock._preR||(sock._preR=0));
	stash.bytesW = sock.bytesWritten - (sock._preW||(sock._preW=0));

	sock._preR += stash.bytesR;
	sock._preW += stash.bytesW;

	logger.gauge("countDataRequests", allRequests.length);
	logger.gauge("countLateArrivals", notLoaded.length, {hi: 1});
	logger.gauge("bytesRead", stash.bytesR, {hi: 1<<12});
	logger.gauge("bytesWritten", stash.bytesW, {hi: 1<<18});

	var time = new Date - start;

	logger.time(`responseCode.${res.statusCode}`, time);
	logger.time("totalRequestTime", time);

	// Only populated for full pages and fragments.
	if (RLS().renderTime){
		logger.time("totalRenderTime", RLS().renderTime);
	}

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
