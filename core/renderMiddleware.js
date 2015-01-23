
var logger = require('./logging').getLogger(__LOGGER__({gauge:{hi:1}})),
	React = require('react/addons'),
	RequestContext = require('./context/RequestContext'),
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

class Renderer {

	constructor (context) {
		this.context = context;
		this.router = context.router;
		this._userDataPromise = context.loadUserData();
	}

	render (handlerResult) {
		logger.debug("Triggering userData load");
		beginRender(req, res, start, context, this._userDataPromise, handlerResult);
	}

}


/**
 * renderMiddleware entrypoint. Called by express for every request.
 */
module.exports = function(routes) {

	return function (req, res, next) {

		var start = new Date();

		logger.debug('request: ' + req.path);

		// TODO? pull this context building into its own middleware
		var context = new RequestContext.Builder()
				.setRoutes(routes)
				.setLoaderOpts({}) // TODO FIXME
				.setDefaultXhrHeadersFromRequest(req)
				.create({
					// TODO: context opts?
				});

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
			
			var userDataPromise = context.loadUserData();
			beginRender(req, res, start, context, userDataPromise, page);

		});

		context.navigate(new ExpressServerRequest(req));

	}
}

function beginRender(req, res, start, context, userDataDfd, page) {

	var routeName = context.navigator.getCurrentRoute().name;

	logger.debug("Route Name: " + routeName);

	// regardless of what happens, write out the header part
	// TODO: should this include the common.js file? seems like it
	// would give it a chance to download and parse while we're loading
	// data
	writeHeader(req, res, routeName, page);

	// user data should never be the long pole here.
	userDataDfd.done(function () {
		writeBody(req, res, context, start, page).then(() => {
			writeData(req, res, context, start)
			setupLateArrivals(req, res, context, start);
		});
	});

	// TODO: we probably want a "we're not waiting any longer for this"
	// timeout as well, and cancel the waiting deferreds
}

function writeHeader(req, res, routeName, pageObject) {
	logger.debug('Sending header');
	res.type('html');

	var pageHeader = "<!DOCTYPE html><html><head>"
		// TODO: we should allow title to be a deferred
		+ renderTitle(pageObject) + "\n"
		+ renderStylesheets(pageObject) + "\n"
		+ renderScripts(pageObject) + "\n"
		+ renderMetaTags(pageObject) + "\n"
		+ "</head><body class='route-" + routeName + "'><div id='content'>";
	res.write(pageHeader);
}

function renderTitle (pageObject) {
	if (!pageObject.getTitle) return "";

	return "<title>" + (pageObject.getTitle() || "") + "</title>";
}

function renderMetaTags (pageObject) {
	var metaTags = [ {charset: 'utf-8'} ];


	if (pageObject.getMetaTags) {
		var pageMetaTags = pageObject.getMetaTags();
		if (pageMetaTags.length > 0) {
			metaTags = metaTags.concat(pageMetaTags);
		}
	}

	return metaTags.map( tagData => {
		// TODO: escaping
		var tag = '<meta ';
		tag += Object.keys(tagData).map( metaAttrName => {
			return metaAttrName + '="' + tagData[metaAttrName] + '"';
		}).join(' ');
		tag += '>';
		return tag;
	}).join("\n");
}

function renderScripts(pageObject) {
	if (!pageObject.getHeadScriptFiles) return "";

	// default script
	var scripts = pageObject.getHeadScriptFiles();
	if (scripts && !Array.isArray(scripts)) {
		scripts = [scripts];
	}

	return scripts.map( (scriptPath) => {
		// make sure there's a leading '/'
		return '<script src="' + scriptPath +'"></script>'
	}).join("\n");


}

function renderStylesheets (pageObject) {
	if (!pageObject.getHeadStylesheet) return "";

	var stylesheet = pageObject.getHeadStylesheet();
	if (!stylesheet) {
		return "";
	}
	return '<link rel="stylesheet" type="text/css" href="' + stylesheet + '" id="'+ ClientCssHelper.PAGE_CSS_NODE_ID + '">' 
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
	var noTimeoutRenderPromise =  elementPromises.reduce((chain, next, index) => {
		return chain.then((element) => {
	 		if (!rendered[index-1]) renderElement(res, element, context, index - 1);
	 		rendered[index - 1] = true;
			return next;
		})
	}).then((element) => {
		// reduce is called length - 1 times. we need to call one final time here to make sure we 
		// chain the final promise.
 		if (!rendered[elementPromises.length - 1]) renderElement(res, element, context, elementPromises.length - 1);
 		rendered[elementPromises.length - 1] = true;
	}).catch((err) => {
		logger.debug("Error while rendering", err);
	});

	// set up a maximum wait time for data loading. if this timeout fires, we render with whatever we have,
	// as best as possible. note that once the timeout fires, we render everything that's left
	// synchronously.
	var timeoutRenderPromise = Q.delay(DATA_LOAD_WAIT).then(() => {
		// if we rendered everything up to the last element already, just return.
		if (rendered[elementPromises.length - 1]) return;

		debug("Timeout Exceeeded. Rendering...");
		elementPromises.forEach((promise, index) => {
			if (!rendered[index]) {
				renderElement(res, promise.getValue(), context, index);
				rendered[index] = true;
			}
		});
	});

	// return a promise that resolves when either the async render OR the timeout sync
	// render happens. 
	return PromiseUtil.race(noTimeoutRenderPromise, timeoutRenderPromise);
}

function renderElement(res, element, context, index) {
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

	var pageFooter = ""
		+ "<script> " + res.locals.state + "; window.rfBootstrap();</script>";

	res.write(pageFooter);


	var routeName = context.navigator.getCurrentRoute().name;

	logger.time(`content_written.${routeName}`, new Date - start);
}

function setupLateArrivals(req, res, context, start) {
	var loader = context.loader;
	var notLoaded = loader.getPendingRequests();
	var routeName = context.navigator.getCurrentRoute().name;


	notLoaded.forEach( pendingRequest => {
		pendingRequest.entry.dfd.promise.then( data => {
			logger.debug("Late arrival: " + pendingRequest.url)
			logger.time(`late_arrival.${routeName}`, new Date - start);
			res.write("<script>__lateArrival(\"" + pendingRequest.url + "\", " + JSON.stringify(data) + ");</script>");
		})
	});

	// TODO: maximum-wait-time-exceeded-so-cancel-pending-requests code
	var promises = notLoaded.map( result => result.entry.dfd.promise );
	Q.allSettled(promises).then(function () {
		res.end("</body></html>");
		logger.gauge(`count_late_arrivals.${routeName}`, notLoaded.length);
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
