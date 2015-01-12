
var debug = require('debug')('rf:renderMiddleware'),
	React = require('react'),
	AppRoot = React.createFactory(require('./components/AppRoot')),
	RequestContext = require('./context/RequestContext'),
	ClientCssHelper = require('./util/ClientCssHelper'),
	Q = require('q'),
	config = require('./config'),
	ExpressServerRequest = require("./ExpressServerRequest");


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
		debug("Triggering userData load");
		beginRender(req, res, start, context, this._userDataPromise, handlerResult);
	}

}


/**
 * renderMiddleware entrypoint. Called by express for every request.
 */
module.exports = function(routes) {

	return function (req, res, next) {

		var start = new Date();

		debug('request: ', req.path);

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
				debug("There was an error:", err);
				if (err.status && err.status === 404) {
					next();
				} else if (err.status === 301 || err.status === 302) {
					res.redirect(err.status, err.redirectUrl);
				} else {
					next(err);
				}
				return;
			}

			debug('Executing navigate action');
			
			var userDataPromise = context.loadUserData();
			beginRender(req, res, start, context, userDataPromise, page);

		});

		context.navigate(new ExpressServerRequest(req));

	}
}

function beginRender(req, res, start, context, userDataDfd, page) {

	var routeName = context.navigator.getCurrentRoute().name;

	debug("Route Name", routeName);

	// regardless of what happens, write out the header part
	// TODO: should this include the common.js file? seems like it
	// would give it a chance to download and parse while we're loading
	// data
	writeHeader(req, res, routeName, page);

	var doRenderCallback = function () {
		// user data should never be the long pole here.
		userDataDfd.done(function () {
			writeBodyAndData(req, res, context, start, page);
			setupLateArrivals(req, res, context, start);
		});
	}

	// TODO: we probably want a "we're not waiting any longer for this"
	// timeout as well, and cancel the waiting deferreds

	var timeoutExceeded = false;

	// set up a maximum wait time for data loading.
	// if this timeout fires, we render with whatever we have,
	// as best as possible
	var loadWaitHdl = setTimeout(function () {
		debug("Timeout Exceeeded. Rendering...");
		timeoutExceeded = true;
		doRenderCallback();
	}, DATA_LOAD_WAIT);

	// if we happen to load all data before the timeout is exceeded,
	// we clear the timeout, and just render. If this fires after the
	// timeout is exceeded, it's a no-op
	// use .done(...) to propagate caught exceptions properly
	var loader = context.loader;
	loader.whenAllPendingResolve().done(function () {
		if (!timeoutExceeded) {
			debug("Data loaded. Rendering...");
			clearTimeout(loadWaitHdl);
			doRenderCallback();
		}
	});

}

function writeHeader(req, res, routeName, pageObject) {
	debug('Sending header');
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


function writeBodyAndData(req, res, context, start, page) {

	debug("Rendering AppRoot.");
	var html = React.renderToString(AppRoot({
		childComponent: page.getElements(), // TODO: deal with promises and arrays of elements -sra.
		context: context
	}));

	res.write(html);

	debug('Exposing context state');
	res.expose(context.dehydrate(), 'InitialContext');
	res.expose(getNonInternalConfigs(), "Config");


	res.write("</div>"); // <div id="content">

	var pageFooter = ""
		+ "<script> " + res.locals.state + "; window.rfBootstrap();</script>";

	res.write(pageFooter);

	debug("Content Written: " + (new Date().getTime() - start.getTime()) + "ms");
}

function setupLateArrivals(req, res, context, start) {
	var loader = context.loader;
	var notLoaded = loader.getPendingRequests();

	notLoaded.forEach( pendingRequest => {
		pendingRequest.entry.dfd.promise.then( data => {
			debug("Late arrival: " + pendingRequest.url + ". Arrived " + (new Date().getTime() - start.getTime()) + "ms after page start.");
			res.write("<script>__lateArrival(\"" + pendingRequest.url + "\", " + JSON.stringify(data) + ");</script>");
		})
	});

	// TODO: maximum-wait-time-exceeded-so-cancel-pending-requests code
	var promises = notLoaded.map( result => result.entry.dfd.promise );
	Q.allSettled(promises).then(function () {
		res.end("</body></html>");
		debug("All Done: " + (new Date().getTime() - start.getTime()) + "ms");
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
