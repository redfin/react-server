var renderMiddleware = require("../renderMiddleware"),
	express = require("express"),
	expressState = require('express-state'),
	http = require("http"),
	Browser = require('zombie');

var servers = []; 

// starts a simple, one page triton server.
// routes is of the form {url: page}
var startTritonServer = (routes, port, cb) => {
	// first let's make a simple routes file with just one page
	var routesForTriton = {routes:{}};
	Object.keys(routes).forEach((url, index) => {
		routesForTriton.routes["route" + index] = {
			path: [url],
			method: 'get',
			page: () => {
				return {
					done: (cb) => {cb(routes[url]);}
				}
			}
		};
	});

	var server = express();
	process.env.R3S_CONFIGS = process.cwd() + "/target/config/dev"


	renderMiddleware(server, routesForTriton);
	var httpServer = http.createServer(server);
	httpServer.listen(port, () => cb(httpServer));
};

var stopTritonServer = (server, done) => {
	server.close(done);
};

var getDocumentFor = (url, port, cb) => {
	var browser = new Browser({runScripts:false});

	browser.visit(`http://localhost:${port}${url}`).then(() => cb(browser.window.document));
};

var startTritonBeforeEach = (routes, port) => {
	beforeEach((done) => {
		startTritonServer(routes, port, s => {
			servers.push(s); 
			done();
		});
	});
}

var teardownTritonAfterEach = () => {
	afterEach((done) => {
		stopTritonServer(servers.pop(), done);
	});
}




module.exports = {
	startTritonServer, 
	stopTritonServer, 
	getDocumentFor,
	startTritonBeforeEach,
	teardownTritonAfterEach
};
