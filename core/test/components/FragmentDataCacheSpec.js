
var TritonAgent = require("../../util/TritonAgent")
,	superagent = require("superagent")
,	cheerio = require("cheerio")
,	React = require("react")
,	FragmentDataCache = require("../../components/FragmentDataCache")
;

var {
	makeServer,
	withRlsContext
} = require("../TritonAgent/setup");

describe("FragmentDataCache", () => {

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

	describe("component", () => {
		it("serializes to data-triton-data-cache as JSON", withRlsContext(done => {

			var URL = "/describe";

			TritonAgent.get(URL)
				.then(res => {
					var $ = cheerio.load(React.renderToStaticMarkup(<FragmentDataCache />));

					var dataStr = $("#triton-fragment-data-cache").attr("data-triton-data-cache");
					var parsedData = JSON.parse(dataStr);

					expect(parsedData).toBeDefined();
					expect(parsedData.dataCache).toBeDefined();
					expect(parsedData.dataCache[URL]).toBeDefined();
					expect(parsedData.dataCache[URL].res.body).toBeDefined();
					// it should include the res.body prop only
					expect(Object.keys(parsedData.dataCache[URL].res).length).toBe(1);

					done();
				}).catch(err => {
					console.log(err.stack);

					// this will fail the test
					expect(err).toBeUndefined();
					done();
				})
				.done();

		}));

		it("can be passed a cacheNodeId override", withRlsContext(done => {

			var URL = "/describe";

			TritonAgent.get(URL)
				.then(res => {
					var htmlStr = React.renderToStaticMarkup(<FragmentDataCache cacheNodeId="fooBarBaz" />);
					var $ = cheerio.load(htmlStr);

					var node
					,	dataStr
					,	parsedData;

					node = $("#triton-fragment-data-cache");
					expect(node.length).toBe(0);

					node = $('#fooBarBaz');
					expect(node.length).toBe(1);

					dataStr = node.attr("data-triton-data-cache");
					parsedData = JSON.parse(dataStr);

					expect(parsedData).toBeDefined();
					expect(parsedData.dataCache).toBeDefined();
					expect(parsedData.dataCache[URL]).toBeDefined();
					expect(parsedData.dataCache[URL].res.body).toBeDefined();
					// it should include the res.body prop only
					expect(Object.keys(parsedData.dataCache[URL].res).length).toBe(1);

					done();
				}).catch(err => {
					console.log(err.stack);

					// this will fail the test
					expect(err).toBeUndefined();
					done();
				})
				.done();

		}));
	});

	describe("FragmentDataCache.createWhenReady", () => {
		
		it("resolves with a FragmentDataCache when TritonAgent resolves", withRlsContext(done => {
			var URL = "/describe";

			TritonAgent.get(URL)
				.then(res => {
					// do nothing here	
				});

			FragmentDataCache.createWhenReady().then(fragmentComponent => {
				expect(fragmentComponent).toBeDefined();

				var htmlStr = React.renderToStaticMarkup(fragmentComponent);
				var $ = cheerio.load(htmlStr);

				var node
				,	dataStr
				,	parsedData;

				node = $("#triton-fragment-data-cache");
				expect(node.length).toBe(1);

				dataStr = node.attr("data-triton-data-cache");
				parsedData = JSON.parse(dataStr);

				expect(parsedData).toBeDefined();
				expect(parsedData.dataCache).toBeDefined();
				expect(parsedData.dataCache[URL]).toBeDefined();
				expect(parsedData.dataCache[URL].res.body).toBeDefined();
				// it should include the res.body prop only
				expect(Object.keys(parsedData.dataCache[URL].res).length).toBe(1);

				done();
			}).catch(err => {
				console.log(err.stack);
				// this will cause the test to fail
				expect(err).toBeUndefined();
				done();
			})
			.done();

		}));

		it("passes additional props to FragmentDataCache via options object", withRlsContext(done => {
			var URL = "/describe";

			TritonAgent.get(URL)
				.then(res => {
					// do nothing here	
				});

			FragmentDataCache.createWhenReady({cacheNodeId: 'fooBarBaz'}).then(fragmentComponent => {
				expect(fragmentComponent).toBeDefined();

				var htmlStr = React.renderToStaticMarkup(fragmentComponent);
				var $ = cheerio.load(htmlStr);

				var node
				,	dataStr
				,	parsedData;

				node = $("#triton-fragment-data-cache");
				expect(node.length).toBe(0);

				node = $('#fooBarBaz');
				expect(node.length).toBe(1);

				dataStr = node.attr("data-triton-data-cache");
				parsedData = JSON.parse(dataStr);

				expect(parsedData).toBeDefined();
				expect(parsedData.dataCache).toBeDefined();
				expect(parsedData.dataCache[URL]).toBeDefined();
				expect(parsedData.dataCache[URL].res.body).toBeDefined();
				// it should include the res.body prop only
				expect(Object.keys(parsedData.dataCache[URL].res).length).toBe(1);

				done();
			}).catch(err => {
				console.log(err.stack);
				// this will cause the test to fail
				expect(err).toBeUndefined();
				done();
			})
			.done();

		}));

		it("does something reasonable when a request errors", withRlsContext(done => {

			TritonAgent.get("/describe").then(res => {});
			TritonAgent.get("/error").then(res => {});

			FragmentDataCache.createWhenReady().then(fragmentComponent => {
				
				expect(fragmentComponent).toBeDefined();

				var htmlStr = React.renderToStaticMarkup(fragmentComponent);
				var $ = cheerio.load(htmlStr);

				var node
				,	dataStr
				,	parsedData;

				node = $("#triton-fragment-data-cache");
				expect(node.length).toBe(1);

				dataStr = node.attr("data-triton-data-cache");
				parsedData = JSON.parse(dataStr);

				expect(parsedData).toBeDefined();
				expect(parsedData.dataCache).toBeDefined();
				expect(parsedData.dataCache["/describe"]).toBeDefined();
				expect(parsedData.dataCache["/describe"].res.body).toBeDefined();

				expect(parsedData.dataCache["/error"]).toBeDefined();
				expect(parsedData.dataCache["/error"].res).toBeUndefined();
				expect(parsedData.dataCache["/error"].err).toBeDefined();
				expect(parsedData.dataCache["/error"].err.response).toBeDefined();
				expect(parsedData.dataCache["/error"].err.response.body).toBeDefined();
				
				// it should include the res.body prop only
				expect(Object.keys(parsedData.dataCache["/describe"].res).length).toBe(1);
				expect(Object.keys(parsedData.dataCache["/error"].err.response).length).toBe(1);

				done();
			}).catch(err => {
				console.log(err.stack);
				// this will cause the test to fail
				expect(err).toBeUndefined();
				done();
			})
			.done();

		}));

		it("does something reasonable when a request times out", withRlsContext(done => {

			TritonAgent.get("/describe").then(res => {});
			TritonAgent.get("/timeout")
				.query({ delay: 1000 })
				.timeout(100)
				.then(res => {});

			FragmentDataCache.createWhenReady().then(fragmentComponent => {

				expect(fragmentComponent).toBeDefined();

				var htmlStr = React.renderToStaticMarkup(fragmentComponent);
				var $ = cheerio.load(htmlStr);

				var node
				,	dataStr
				,	parsedData;

				node = $("#triton-fragment-data-cache");
				expect(node.length).toBe(1);

				dataStr = node.attr("data-triton-data-cache");
				parsedData = JSON.parse(dataStr);

				expect(parsedData).toBeDefined();
				expect(parsedData.dataCache).toBeDefined();
				expect(parsedData.dataCache["/describe"]).toBeDefined();
				expect(parsedData.dataCache["/describe"].res.body).toBeDefined();

				expect(parsedData.dataCache["/timeout"]).toBeDefined();
				expect(parsedData.dataCache["/timeout"].res).toBeUndefined();
				expect(parsedData.dataCache["/timeout"].err).toBeDefined();
				expect(parsedData.dataCache["/timeout"].err.response).toBeUndefined();
				expect(parsedData.dataCache["/timeout"].err.timeout).toBeDefined();

				done();

			}).catch(err => {
				console.log(err.stack);
				// this will cause the test to fail
				expect(err).toBeUndefined();
				done();
			}).done();

		}));
	});

});