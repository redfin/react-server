var ReactServerAgent = require("react-server").ReactServerAgent
,	RLS = require("react-server").RequestLocalStorage
;

var PORT = 4221
,	SIMPLE_SUCCESS = "SUCCESS"
;

module.exports = {
	withRlsContext,
	makeServer,
	addJsonParserForContentType,
	removeJsonParserForContentType,
	SIMPLE_SUCCESS,
}

function withRlsContext (runTest) {
	return function (done) {
		RLS.startRequest( () => {
			ReactServerAgent.plugRequest( (request) => {
				request.urlPrefix(`http://localhost:${PORT}`);
			});

			runTest(function () {
				// can do stuff here if we want
				done();
			})
		});
	};
}

function makeServer (cb, { port = PORT } = {}) {
	var http = require("http");
	var express = require("express");
	var bodyParser = require("body-parser");

	var server = express();

	server.use(bodyParser.json());
	server.use(bodyParser.urlencoded({extended: true}));

	server.get('/simple', function (req, res) {
		res.type('text/plain').end(SIMPLE_SUCCESS);
	});

	server.get('/query-params', function (req, res) {
		res.type('application/json').end(JSON.stringify({ query: req.query }))
	});

	server.use('/describe', function (req, res) {
		var reqObject = {};
		["method", "query", "body"].forEach( key => {
			reqObject[key] = req[key];
		});
		reqObject.headers = req.headers;

		var type = req.query.type ? req.query.type : 'application/json';
		setTimeout( () => {
			res.status(200).type(type).end(JSON.stringify({req: reqObject}));
		}, req.query.delay || 0);
	});

	server.use('/error', function (req, res) {
		setTimeout( () => {
			res.status(req.query.status || 503).type('application/json').end(JSON.stringify({error: "An Error Occurred"}));
		}, req.query.delay || 0);
	});

	server.use('/timeout', function (req, res) {
		setTimeout( () => {
			// wait 1s
			res.status(200).type('application/json').end(JSON.stringify({Hello: "World"}));
		}, req.query.delay).unref();
	});

	var httpServer = http.createServer(server);
	httpServer.listen(port, () => cb(httpServer));

}

function addJsonParserForContentType(superagent, contentType) {
	superagent.parse[contentType] = superagent.parse['application/json'];
}
function removeJsonParserForContentType(superagent, contentType) {
	delete superagent.parse[contentType];
}
