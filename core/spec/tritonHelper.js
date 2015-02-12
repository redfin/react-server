var renderMiddleware = require("../renderMiddleware"),
	express = require("express"),
	expressState = require('express-state'),
	http = require("http"),
	fs = require("fs"),
	mkdirp = require("mkdirp"),
	webpack = require("webpack"),
	Browser = require('zombie');

var servers = []; 

function getBrowser(opts) {
	var browser = new Browser(opts);
	browser.silent = true;
	return browser;
}

var createRoutesFile = (routes) => {
	// first we convert our simple routes format to a triton routes file.
	var routesForTriton = `module.exports = {
			middleware: [require("../client/spec/test-runtime/ScriptsMiddleware")],
			routes: {`;

	Object.keys(routes).forEach((url, index) => {
		routesForTriton += `
			route${index}: {
				path: ["${url}"],
				method: 'get',
				page: function () {
					return {
						done: function (cb) {
							cb(require("../client/spec/${routes[url]}"));
						}
					};
				}				
			},`;
	});

	// make sure we add a route for a page that will let us do client-side
	// transitions.
	routesForTriton += `
		transitionPage: {
			path: ["/__transition"],
			method: "get",
			page: function() {
				return {
					done: function(cb) {
						cb(require("../client/spec/test-runtime/TransitionPage"));
					}
				};
			}
		}}};`;
	mkdirp.sync("./target/test-temp");
	fs.writeFileSync("./target/test-temp/routes.js", routesForTriton);
}


var buildClientCode = function(cb) {
	mkdirp.sync('./target/test-temp');
	fs.writeFileSync("./target/test-temp/entrypoint.js", `
		var ClientController = require("triton").ClientController;

		window.rfBootstrap = function () {
			var controller = new ClientController({
				routes: require("./routes.js")
			});
			
			controller.init();
		};`
	);

	webpack({
		context: process.cwd() + "/target/test-temp",
		entry: "./entrypoint.js",
		output: {
			path: process.cwd() + "/target/test-temp/",
			filename: "rollup.js"
		},
		resolve: {
			alias: {
				"triton": process.cwd()  // this works because package.json points it at /target/client/client.js
			}
		}
	}, function(err, stats) {
	    if(err) throw new Error("Error during webpack build.", err);
	    cb();
	});
}

// starts a simple, one page triton server.
// routes is of the form {url: page}
var startTritonServer = (routes, port, cb) => {

	createRoutesFile(routes);
	buildClientCode(() => {
		var server = express();
		process.env.R3S_CONFIGS = process.cwd() + "/target/config/dev"

		server.use('/rollups', express.static(process.cwd() + "/target/test-temp"));

		renderMiddleware(server, require("../../test-temp/routes"));
		var httpServer = http.createServer(server);
		httpServer.listen(port, () => cb(httpServer));

	});
};

var stopTritonServer = (server, done) => {
	server.close(done);
};

var getServerWindow = (url, port, cb) => {
	var browser = getBrowser({runScripts:false});

	browser.visit(`http://localhost:${port}${url}`).then(() => cb(browser.window));
}

var getClientWindow = (url, port, cb) => {
	var browser = getBrowser();

	browser.visit(`http://localhost:${port}${url}`).then(() => cb(browser.window));
}

var getTransitionWindow = (url, port, cb) => {
	var browser = getBrowser();

	// go to the transition page and click the link.
	browser.visit(`http://localhost:${port}/__transition?url=${url}`).then(() => {
		browser.clickLink("Click me", () => {
			cb(browser.window);
		});
	});
}

var getServerDocument = (url, port, cb) => {
	getServerWindow(url, port, (window) => cb(window.document));
}

var getClientDocument = (url, port, cb) => {
	getClientWindow(url, port, (window) => cb(window.document));
}

var getTransitionDocument = (url, port, cb) => {
	getTransitionWindow(url, port, (window) => cb(window.document));
}

// used to test the JS internals of a page both on client load and on page-to-page
// transition. this does NOT test server load, since JS doesn't run on that. if you just
// want to test document structure, including server generated documents, use testWithDocument.
var testWithWindow = (url, port, testFn) => {
	it ("on client", function(done) {
		getClientWindow(url, port, (window) => {
			testFn(window, done);
		});
	});
	it ("on transition", function(done) {
		getTransitionWindow(url, port, (window) => {
			testFn(window, done);
		});
	});

}

// used to test document structure on server, on client, and on page-to-page transition.
// this method creates three Jasmine tests. this method should not test anything that is 
// dependent on the page JS running. if you want to test the internal state of the JS, use
// testWithWindow.
var testWithDocument = (url, port, testFn) => {
	it ("on server", function(done) {
		getServerDocument(url, port, (document) => {
			testFn(document, done);
		});
	});
	it ("on client", function(done) {
		getClientDocument(url, port, (document) => {
			testFn(document, done);
		});
	});
	it ("on transition", function(done) {
		getTransitionDocument(url, port, (document) => {
			testFn(document, done);
		});
	});

}

// convenience function to start a triton server before each test. make sure to 
// call teardownTritonAfterEach so that the server is stopped.
var startTritonBeforeEach = (routes, port) => {
	beforeEach((done) => {
		startTritonServer(routes, port, s => {
			servers.push(s); 
			done();
		});
	});
}

// convenience function to stop a triton server after each test. to be paired
// with startTritonBeforeEach.
var teardownTritonAfterEach = () => {
	afterEach((done) => {
		stopTritonServer(servers.pop(), done);
	});
}

module.exports = {
	startTritonServer, 
	stopTritonServer, 
	getServerDocument,
	getClientDocument,
	getTransitionDocument,
	testWithDocument,
	// getServerWindow,  <-- not exposed because it's generally not useful to get window when client JS hasn't run.
	getClientWindow,
	getTransitionWindow,
	testWithWindow,
	startTritonBeforeEach,
	teardownTritonAfterEach
};
