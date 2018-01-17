
/* eslint-disable no-process-env */
var	fs = require("fs"),
	mkdirp = require("mkdirp"),
	path = require("path"),
	Browser = require('zombie'),
	CLI = require('react-server-cli'),
	crypto = require('crypto');

// This needs to be different from the port used by the tests that still live
// in the main `react-server` package, since those tests run concurrently with
// these during a top-level `npm test`.
var PORT = process.env.PORT;
let HTTPS = false;

if (!PORT) throw new Error("Need a port");

process.env.NODE_ENV = "test";

var stopFns = [];

function getBrowser(opts) {
	var browser = new Browser(opts);
	browser.silent = (!process.env.DEBUG);
	browser.on('error', function (e) {
		console.error("An error occurred running zombie tests", e);
	})
	return browser;
}

var getPort = function () { return PORT };

var writeRoutesFile = function (specFile, routes, tempDir) {
	let specDir = path.dirname(specFile);
	let relativeRoutePathRoot = specDir;

	let specRuntimePath = path.join(tempDir, `../target/specRuntime`);
	let transitionPageAbsPath = `${specRuntimePath}/TransitionPage`;

	// first we convert our simple routes format to a react-server routes file.
	var routesForReactServer = `module.exports = {
			routes: {`;

	Object.keys(routes).forEach((url, index) => {

		let routeAbsPath = path.isAbsolute(routes[url])
			? routes[url]
			: path.normalize(path.join(relativeRoutePathRoot, `${routes[url]}`));

		routesForReactServer += `
			route${index}: {
				path: ["${url}"],
				page: "${routeAbsPath}",
			},`;
	});

	// make sure we add a route for a page that will let us do client-side
	// transitions.
	routesForReactServer += `
		transitionPage: {
			path: ["/__transition"],
			page: "${transitionPageAbsPath}",
		}}};`;
	mkdirp.sync(tempDir);
	// make a unique file name so that when it is required, there are no collisions
	// in the module loader between different tests.
	const routesHash = crypto.createHash('md5').update(routesForReactServer).digest("hex");
	var routesFilePath = path.join(tempDir, `routes_${routesHash}.js`);
	fs.writeFileSync(routesFilePath, routesForReactServer);
	return routesFilePath;
}

// this is a helper function that takes in an array of files to make routes for.
// it will emit a routes map suitable for handing to startReactServer where
// all the page classes will be automatically assigned a URL. the URL will be
// the file name (stripped of directories), first letter lower-cased, assigned
// "Page" removed from the end if it is there. Examples (in the format class name
// to URL:
//
// "./SomeTestPage" ==> "/someTest"
// "./someDir/SomeTestInDirPage" ==> "/someTestInDir"
// "./foo/BarPagelet" ==> "/barPagelet"  <-- note does not *end* with "Page"
var routesArrayToMap = function (routesArray) {
	var result = {};
	routesArray.forEach((file) => {
		var fileName = path.basename(file);
		if (path.extname(fileName)) {
			// strip extension from filename, if given
			fileName = fileName.substr(0, fileName.length - path.extname(fileName).length);
		}
		if (fileName.length >=4 && fileName.substr(-4) === "Page") fileName = fileName.substr(0, fileName.length - 4);
		if (fileName.length > 0) fileName = fileName.substr(0, 1).toLowerCase() + fileName.substr(1);
		result["/" + fileName] = file;
	});
	return result;
}

const startServer = function (specFile, routes, httpsOptions) {
  // if we got an array, normalize it to a map of URLs to file paths.
	if (Array.isArray(routes)) routes = routesArrayToMap(routes);

	const testTempDir = path.join(__dirname, "../../test-temp");

	const routesFile = writeRoutesFile(specFile, routes, testTempDir);

	const options = {
		command: "start",
		routesFile: routesFile,
		hot: false,
		port: PORT,
		jsPort: +PORT+1,
		logLevel: "emergency",
		timingLogLevel: "none",
		gaugeLogLevel: "no",
	};

	if (httpsOptions) {
		HTTPS = true;
		options.httpsOptions = httpsOptions;

		// Necessary to handle self-signed certificates.  This setting is fine for testing, but shouldn't be used in production
		// https://github.com/assaf/zombie/issues/1021
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
	} else {
		HTTPS = false;
	}

	return CLI.run(options);
};

const getServerBrowser = function (url, cb) {
	const browser = getBrowser({runScripts:false}),
		scheme = HTTPS ? 'https' : 'http';

	browser.visit(`${scheme}://localhost:${PORT}${url}`).then(() => cb(browser), (e) => {
		console.error(e);
		console.error(arguments)
	})
};

const getClientBrowser = function (url, cb) {
	const browser = getBrowser(),
		scheme = HTTPS ? 'https' : 'http';
	browser.visit(`${scheme}://localhost:${PORT}${url}`).then(() => cb(browser), (e) => {
		console.error(e);
		console.error(arguments);
	})
};

const getTransitionBrowser = function (url, cb) {
	const browser = getBrowser(),
		scheme = HTTPS ? 'https' : 'http';
	// go to the transition page and click the link.
	browser.visit(`${scheme}://localhost:${PORT}/__transition?url=${url}`).then(() => {
		browser.clickLink("Click me", () => {
			cb(browser);
		});
	});

};

// vists the url `url` and calls `cb` with the browser's window
// object after the page has completely downloaded from the server but before any client
// JavaScript has run. note that this is useful for examining the structure of the
// server-generated HTML via `window.document`, but it is not generally useful to do
// much else with the window object, as no JavaScript has run on the client (i.e.
// React will not be present, and nothing will be interactive.).
var getServerWindow = function (url, cb) { getServerBrowser(url, (browser) => cb(browser.window)); }

// vists the url `url` and calls `cb` with the browser's window
// object after the page has completely downloaded from the server and all client
// JavaScript has run. at this point, the page will have re-rendered, and
// it will be interactive.
var getClientWindow = function (url, cb) { getClientBrowser(url, (browser) => cb(browser.window)); };

// vists the url `url` via a client-side transition, and calls `cb`
// with the browser's window object after the page has completely run all client
// JavaScript. at this point, the page will have transitioned and rendered, and
// it will be interactive.
var getTransitionWindow = function (url, cb) { getTransitionBrowser(url, (browser) => cb(browser.window)); };

// vists the url `url` and calls `cb` with the browser's document
// object after the page has completely downloaded from the server but before any client
// JavaScript has run. this is the right method to use to run assertions on the server-
// generated HTML.
var getServerDocument = function (url, cb) { getServerWindow(url, (window) => cb(window.document)); };

// vists the url `url` and calls `cb` with the browser's document
// object after the page has completely downloaded from the server and all client
// JavaScript has run. this is the right method to use to run assertions on the HTML
// after client-side rendering has completed.
var getClientDocument = function (url, cb) { getClientWindow(url, (window) => cb(window.document)); };


// vists the url `url` via a client-side transition, and calls `cb`
// with the browser's document object after the page has completely run all client
// JavaScript. this is the right method to use to run assertions on the HTML
// after a client-side transition has completed.
var getTransitionDocument = function (url, cb) { getTransitionWindow(url, (window) => cb(window.document)); };

// used to test the JS internals of a page both on client load and on page-to-page
// transition. this does NOT test server load, since JS doesn't run on that. if you just
// want to test document structure, including server generated documents, use testWithDocument.
// testFn's first argument will be the window object. if it takes a second argument, it will be
// a done callback for async tests.
var testWithWindow = function (url, testFn) {
	var callback = (document, done) => {
		if (testFn.length >= 2) {
			testFn(document, done);
		} else {
			// the client doesn't want the done function, so we should call it.
			testFn(document);
			done();
		}
	}
	it ("on client", function(done) {
		getClientWindow(url, (window) => {
			callback(window, done);
		});
	});
	it ("on transition", function(done) {
		getTransitionWindow(url, (window) => {
			callback(window, done);
		});
	});

}

// used to test document structure on server, on client, and on page-to-page transition.
// this method creates three Jasmine tests. this method should not test anything that is
// dependent on the page JS running. if you want to test the internal state of the JS, use
// testWithWindow.
// testFn's first argument will be the document object. if it takes a second argument, it will be
// a done callback for async tests.
var testWithDocument = function (url, testFn) {
	var callback = (document, done) => {
		if (testFn.length >= 2) {
			testFn(document, done);
		} else {
			// the client doesn't want the done function, so we should call it.
			testFn(document);
			done();
		}
	}
	it ("on server", function(done) {
		getServerDocument(url, (document) => {
			callback(document, done);
		});
	});
	it ("on client", function(done) {
		getClientDocument(url, (document) => {
			callback(document, done);
		});
	});
	it ("on client transition", function(done) {
		getTransitionDocument(url, (document) => {
			callback(document, done);
		});
	});
}

// Used to test test browser state on server, client and on page-to-page transitions
var testWithBrowser = function (url, testFn) {
	var callback = (browser, done, isTransition=false) => {
		if (testFn.length >= 3) {
			testFn(browser, isTransition, done);
		} else {
			// the client doesn't want the done function, so we should call it.
			testFn(browser, isTransition);
			done();
		}
	}
	it ("on server", function(done) {
		getServerBrowser(url, (browser) => {
			callback(browser, done);
		});
	});
	it ("on client", function(done) {
		getClientBrowser(url, (browser) => {
			callback(browser, done);
		});
	});
	it ("on client transition", function(done) {
		getTransitionBrowser(url, (browser) => {
			callback(browser, done, true);
		});
	});
}

// Factor out some boilerplate if when just looking for an element.
var testWithElement = (url, query, testFn) => testWithDocument(
	url, document => testFn(document.querySelector(query))
);

var testSetupFn = function (specFile, routes, httpsOptions) {
	return (done) => {
		try {
			// Since we're not using hot-reloading, we need to explicitly delete all of the require.cache to ensure
			// that the latest Webpack compiled server code is being used.
			Object.keys(require.cache)
				.filter((key) => /(__clientTemp|test-temp|TransitionPage)/.test(key))
				.forEach((key) => delete require.cache[key]);

			const {stop, started} = startServer(specFile, routes, httpsOptions);
			started.then(done, (e) => {
				console.error("There was an error while starting the server.");
				// No point in continuing.
				setTimeout(() => {throw e});
			});
			stopFns.push(stop);
		} catch (e) {
			console.error("Failed to start server", e.stack);
			stopFns.forEach(stop => stop());
			process.exit(1); //eslint-disable-line no-process-exit
		}
	}
}

var testTeardownFn = function (done) {
	const stopFn = stopFns.pop();
	stopFn().then(done, (e) => {
		console.log("Error shutting down server:");
		console.error(e);
	});
};

// convenience function to start a react-server server before each test. make sure to
// call stopServerAfterEach so that the server is stopped.
var startServerBeforeEach = function (specFile, routes) {

	// Give ourselves a while to start up (increase the timeout).
	beforeEach(testSetupFn(specFile, routes), 60000);
}

// convenience function to start a react-server server before all the tests. make sure to
// call stopServerAfterEach so that the server is stopped.
var startServerBeforeAll = function (specFile, routes, httpsOptions) {

	// Give ourselves a while to start up (increase the timeout).
	beforeAll(testSetupFn(specFile, routes, httpsOptions), 60000);
}

// convenience function to stop a react-server server after each test. to be paired
// with startServerBeforeEach.
var stopServerAfterEach = function () {
	afterEach(testTeardownFn);
}

// convenience function to stop a react-server server after all the tests. to be paired
// with startServerBeforeAll.
var stopServerAfterAll = function () {
	afterAll(testTeardownFn);
}

module.exports = {
	getPort,
	getServerDocument,
	getClientDocument,
	getTransitionDocument,
	testWithDocument,
	testWithElement,
	testWithBrowser,
	getServerBrowser,
	getClientBrowser,
	getTransitionBrowser,
	// getServerWindow,  <-- not exposed because it's generally not useful to get window when client JS hasn't run.
	getClientWindow,
	getTransitionWindow,
	testWithWindow,
	startServerBeforeEach,
	stopServerAfterEach,
	startServerBeforeAll,
	stopServerAfterAll,
};
