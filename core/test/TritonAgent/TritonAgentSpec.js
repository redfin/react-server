var TritonAgent = require("../../util/TritonAgent");
var RLS = require("../../util/RequestLocalStorage");
var superagent = require("superagent");
var Q = require("q");


var PORT = 4221;

var SIMPLE_SUCCESS = "SUCCESS";


describe("TritonAgent", () => {

	var server;

	beforeAll( (done) => {
		makeServer( (createdServer) => {
			server = createdServer;
			done();
		});
	});

	afterAll( () => {
		// tear down server
		server && server.close();
	});

	describe("simple GET request", () => {

		function simpleGet() {
			return TritonAgent.get("/simple");
		} 

		it("loads successfully using .end()", withRlsContext( (done) => {
			simpleGet().end( (err, res) => {
				expect(err).toBeNull();
				expect(res).not.toBeUndefined();

				expect(res.status).toEqual(200);
				expect(res.text).toEqual(SIMPLE_SUCCESS);
				done();
			});
		}));

		it("loads successfully using .then()", withRlsContext( (done) => {
			simpleGet().then( (res, err) => {
				// .then() and .asPromise() return 'undefined' for error if there is no error
				expect(err).toBeUndefined();
				expect(res).not.toBeUndefined();

				expect(res.status).toEqual(200);
				expect(res.text).toEqual(SIMPLE_SUCCESS);
				done();
			})
		}));

		it("loads successfully using .asPromise()", withRlsContext( (done) => {
			simpleGet().asPromise().then( (res, err) => {
				// .then() and .asPromise() return 'undefined' for error if there is no error
				expect(err).toBeUndefined();
				expect(res).not.toBeUndefined();

				expect(res.status).toEqual(200);
				expect(res.text).toEqual(SIMPLE_SUCCESS);
				done();
			})	
		}));



	});

	describe("general GET requests", () => {

		it("pass query params", withRlsContext( (done) => {
			TritonAgent.get('/describe')
				.query({'foo': 'bar', 'baz': 'qux'})
				.then( (res, err) => {

					expect(res.ok).toBe(true);

					expect(res.body).toBeDefined();

					var req = res.body.req;

					expect(req.method).toBe("GET");
					expect(req.query.foo).toBe("bar");
					expect(req.query.baz).toBe("qux");

					done();
				});
		}));

		it("passes through headers", withRlsContext( (done) => {
			TritonAgent.get('/describe')
				.set({
					'x-foo-bar-baz': 'foo'
				})
				.then( res => {
					expect(res).toBeDefined();
					expect(res.body).toBeDefined();

					var req = res.body.req;

					expect(req.headers).toBeDefined();
					expect(req.headers['x-foo-bar-baz']).toBe("foo");
					done();
				})
				.catch (err => {
					// this should never get called
					expect(err).toBeUndefined();
					done();
				});
		}));

	});


	describe("general POST requests", () => {

		it("defaults to application/json", withRlsContext( (done) => {
			TritonAgent.post("/describe")
				.then( (res, err) => {
					expect(err).toBeUndefined();
					// lowercase
					expect(res.body.req.headers['content-type']).toBe("application/json");
					done();
				});
		}));

		it("can be set to form-encoded", withRlsContext( (done) => {
			TritonAgent.post("/describe")
				.type("form")
				.then( (res, err) => {
					expect(err).toBeUndefined();
					// lowercase
					expect(res.body.req.headers['content-type']).toBe("application/x-www-form-urlencoded");
					// TODO: check data somehow?
					done();
				});
		}));

		// TODO: need a body parser middleware set up for this to work
		// it("sends post params", withRlsContext( (done) => {
		// 	TritonAgent.post('/describe')
		// 		.send({ "hello": "world" })
		// 		.then( (res, err) => {

		// 			expect(true).toBe(false);

		// 			done();
		// 		});
		// }));

		it("times out as expected", withRlsContext( (done) => {
			TritonAgent.post('/timeout')
				.query({ delay: 1000 })
				.timeout(100)
				.then( (res) => {
					// this is a failure!
					expect(true).toBe(false);
					done();
				}).catch( (err) => {
					expect(err).toBeDefined();
					expect(err.timeout).toBeDefined();
					done();
				});
		}));

	});

	describe("cache behavior", () => {

		it("includes both .text and .body when content-type is not well-known", withRlsContext( (done) => {

			var URL = "/describe";
			var FAKE_CONTENT_TYPE = "application/foo-json";

			addJsonParserForContentType(superagent, FAKE_CONTENT_TYPE);

			// only GET requests are cached at the moment
			TritonAgent.get(URL)
				.query({ type: FAKE_CONTENT_TYPE })
				.then( (res) => {

					var cache = TritonAgent.cache();
					var dehydrated = cache.dehydrate();
					var entry = dehydrated.dataCache[URL];

					// verify that our cache looks as expected
					expect(entry.res.text).toBeDefined();
					expect(entry.res.body).toBeDefined();

					// make sure that the cache is empty
					TritonAgent.cache()._clear();

					// verify that cache can be rehydrated
					TritonAgent.cache().rehydrate(dehydrated);

					var entry = dehydrated.dataCache[URL];
					expect(entry).toBeDefined();
					expect(entry.res.text).toBeDefined();
					expect(entry.res.body).toBeDefined();

					removeJsonParserForContentType(superagent, FAKE_CONTENT_TYPE);

				}).catch( (err) => {
					console.log(err.stack);
					// this will fail the test
					expect(err).toBeUndefined();
				}).fin( () => {
					removeJsonParserForContentType(superagent, FAKE_CONTENT_TYPE);
					done();
				});

			// verify that things got written to the cache 
			var cache = TritonAgent.cache();
			expect(cache.getPendingRequests().length).toBe(1);
			var dehydrated = cache.dehydrate();
			expect(dehydrated.dataCache[URL]).toBeDefined();
		}));

		it("excludes body property when content-type is application/json", withRlsContext( (done) => {

			var URL = "/describe";

			// only GET requests are cached at the moment
			TritonAgent.get(URL)
				.then( (res) => {

					var cache = TritonAgent.cache();
					var dehydrated = cache.dehydrate();
					var entry = dehydrated.dataCache[URL];

					// verify that our cache looks as expected
					expect(entry.res.text).toBeDefined();
					expect(entry.res.body).toBeUndefined();

					// make sure that the cache is empty
					TritonAgent.cache()._clear();

					// verify that cache can be rehydrated
					TritonAgent.cache().rehydrate(dehydrated);

					// after hydration, .body should be available again
					var entry = dehydrated.dataCache[URL];
					expect(entry).toBeDefined();
					expect(entry.res.text).toBeDefined();
					expect(entry.res.body).toBeDefined();

					done();
				}).catch( (err) => {
					console.log(err.stack);

					// this will fail the test
					expect(err).toBeUndefined();
					done();
				});

			// verify that things got written to the cache 
			var cache = TritonAgent.cache();
			expect(cache.getPendingRequests().length).toBe(1);
			var dehydrated = cache.dehydrate();
			expect(dehydrated.dataCache[URL]).toBeDefined();

		}));

	})

});

function withRlsContext (runTest) {
	return function (done) {
		RLS.startRequest( () => {
			TritonAgent.plugRequest( (request) => {
				request.urlPrefix(`http://localhost:${PORT}`);
			});

			runTest(function () {
				// can do stuff here if we want
				done();
			})
		});
	};
}


function makeServer (cb) {
	var http = require("http");
	var express = require("express");

	var server = express();

	server.get('/simple', function (req, res) {
		res.type('text/plain').end(SIMPLE_SUCCESS);
	});

	server.get('/query-params', function (req, res) {
		res.type('application/json').end(JSON.stringify({ query: req.query }))
	});

	server.use('/describe', function (req, res) {
		var reqObject = {};
		["method", "query"].forEach( key => {
			reqObject[key] = req[key];
		});
		reqObject.headers = req.headers;

		var type = req.query.type ? req.query.type : 'application/json';
		setTimeout( () => {
			res.status(200).type(type).end(JSON.stringify({req: reqObject}));
		}, req.query.delay || 0);
	});

	server.use('/timeout', function (req, res) {
		setTimeout( () => {
			// wait 1s
			res.status(200).type('application/json').end(JSON.stringify({Hello: "World"}));
		}, req.query.delay).unref();
	});

	var httpServer = http.createServer(server);
	httpServer.listen(PORT, () => cb(httpServer));

}

function addJsonParserForContentType(superagent, contentType) {
	superagent.parse[contentType] = superagent.parse['application/json'];
}
function removeJsonParserForContentType(superagent, contentType) {
	delete superagent.parse[contentType];
}