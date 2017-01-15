
var ReactServerAgent = require("../../ReactServerAgent")
,   cheerio = require("cheerio")
,   React = require("react")
,   ReactDOMServer = require("react-dom/server")
,   FragmentDataCache = require("../FragmentDataCache")
;

var {
	makeServer,
	withRlsContext,
} = require("../../test/util/reactServerAgentSupport"); // dbw this doesn't seem to exist anymore?

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
		it("serializes to data-react-server-data-cache as JSON", withRlsContext(done => {

			var URL = "/describe";

			ReactServerAgent.get(URL)
				.then(res => {
					var $ = cheerio.load(ReactDOMServer.renderToStaticMarkup(<FragmentDataCache />));

					var dataStr = $("#react-server-fragment-data-cache").attr("data-react-server-data-cache");
					var parsedData = JSON.parse(dataStr);

					expect(parsedData).toBeDefined();
					expect(parsedData.dataCache).toBeDefined();
					expect(getSingleEntry(parsedData, URL)).toBeDefined();
					expect(getSingleEntry(parsedData, URL).res.body).toBeDefined();
					// it should include the res.body prop only
					expect(Object.keys(getSingleEntry(parsedData, URL).res).length).toBe(1);

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

			ReactServerAgent.get(URL)
				.then(res => {
					var htmlStr = ReactDOMServer.renderToStaticMarkup(<FragmentDataCache cacheNodeId="fooBarBaz" />);
					var $ = cheerio.load(htmlStr);

					var node
					,	dataStr
					,	parsedData;

					node = $("#react-server-fragment-data-cache");
					expect(node.length).toBe(0);

					node = $('#fooBarBaz');
					expect(node.length).toBe(1);

					dataStr = node.attr("data-react-server-data-cache");
					parsedData = JSON.parse(dataStr);

					expect(parsedData).toBeDefined();
					expect(parsedData.dataCache).toBeDefined();
					expect(parsedData.dataCache[URL]).toBeDefined();
					expect(getSingleEntry(parsedData, URL).res.body).toBeDefined();
					// it should include the res.body prop only
					expect(Object.keys(getSingleEntry(parsedData, URL).res).length).toBe(1);

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

		it("resolves with a FragmentDataCache when ReactServerAgent resolves", withRlsContext(done => {
			var URL = "/describe";

			ReactServerAgent.get(URL)
				.then(res => {
					// do nothing here
				});

			FragmentDataCache.createWhenReady().then(fragmentComponent => {
				expect(fragmentComponent).toBeDefined();

				var htmlStr = ReactDOMServer.renderToStaticMarkup(fragmentComponent);
				var $ = cheerio.load(htmlStr);

				var node
				,	dataStr
				,	parsedData;

				node = $("#react-server-fragment-data-cache");
				expect(node.length).toBe(1);

				dataStr = node.attr("data-react-server-data-cache");
				parsedData = JSON.parse(dataStr);

				expect(parsedData).toBeDefined();
				expect(parsedData.dataCache).toBeDefined();
				expect(parsedData.dataCache[URL]).toBeDefined();
				expect(getSingleEntry(parsedData, URL).res.body).toBeDefined();
				// it should include the res.body prop only
				expect(Object.keys(getSingleEntry(parsedData, URL).res).length).toBe(1);

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

			ReactServerAgent.get(URL)
				.then(res => {
					// do nothing here
				});

			FragmentDataCache.createWhenReady({cacheNodeId: 'fooBarBaz'}).then(fragmentComponent => {
				expect(fragmentComponent).toBeDefined();

				var htmlStr = ReactDOMServer.renderToStaticMarkup(fragmentComponent);
				var $ = cheerio.load(htmlStr);

				var node
				,	dataStr
				,	parsedData;

				node = $("#react-server-fragment-data-cache");
				expect(node.length).toBe(0);

				node = $('#fooBarBaz');
				expect(node.length).toBe(1);

				dataStr = node.attr("data-react-server-data-cache");
				parsedData = JSON.parse(dataStr);

				expect(parsedData).toBeDefined();
				expect(parsedData.dataCache).toBeDefined();
				expect(parsedData.dataCache[URL]).toBeDefined();
				expect(getSingleEntry(parsedData, URL).res.body).toBeDefined();
				// it should include the res.body prop only
				expect(Object.keys(getSingleEntry(parsedData, URL).res).length).toBe(1);

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

			ReactServerAgent.get("/describe").then(res => {});
			ReactServerAgent.get("/error").then(res => {});

			FragmentDataCache.createWhenReady().then(fragmentComponent => {

				expect(fragmentComponent).toBeDefined();

				var htmlStr = ReactDOMServer.renderToStaticMarkup(fragmentComponent);
				var $ = cheerio.load(htmlStr);

				var node
				,	dataStr
				,	parsedData;

				node = $("#react-server-fragment-data-cache");
				expect(node.length).toBe(1);

				dataStr = node.attr("data-react-server-data-cache");
				parsedData = JSON.parse(dataStr);

				expect(parsedData).toBeDefined();
				expect(parsedData.dataCache).toBeDefined();
				expect(parsedData.dataCache["/describe"]).toBeDefined();
				expect(getSingleEntry(parsedData, "/describe").res.body).toBeDefined();

				expect(parsedData.dataCache["/error"]).toBeDefined();
				expect(getSingleEntry(parsedData, "/error").res).toBeUndefined();
				expect(getSingleEntry(parsedData, "/error").err).toBeDefined();
				expect(getSingleEntry(parsedData, "/error").err.response).toBeDefined();
				expect(getSingleEntry(parsedData, "/error").err.response.body).toBeDefined();

				// it should include the res.body prop only
				expect(Object.keys(getSingleEntry(parsedData, "/describe").res).length).toBe(1);
				expect(Object.keys(getSingleEntry(parsedData, "/error").err.response).length).toBe(1);

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

			ReactServerAgent.get("/describe").then(res => {});
			ReactServerAgent.get("/timeout")
				.query({ delay: 1000 })
				.timeout(100)
				.then(res => {});

			FragmentDataCache.createWhenReady().then(fragmentComponent => {

				expect(fragmentComponent).toBeDefined();

				var htmlStr = ReactDOMServer.renderToStaticMarkup(fragmentComponent);
				var $ = cheerio.load(htmlStr);

				var node
				,	dataStr
				,	parsedData;

				node = $("#react-server-fragment-data-cache");
				expect(node.length).toBe(1);

				dataStr = node.attr("data-react-server-data-cache");
				parsedData = JSON.parse(dataStr);

				expect(parsedData).toBeDefined();
				expect(parsedData.dataCache).toBeDefined();
				expect(parsedData.dataCache["/describe"]).toBeDefined();
				expect(getSingleEntry(parsedData, "/describe").res.body).toBeDefined();

				expect(parsedData.dataCache["/timeout"]).toBeDefined();
				expect(getSingleEntry(parsedData, "/timeout").res).toBeUndefined();
				expect(getSingleEntry(parsedData, "/timeout").err).toBeDefined();
				expect(getSingleEntry(parsedData, "/timeout").err.response).toBeUndefined();
				expect(getSingleEntry(parsedData, "/timeout").err.timeout).toBeDefined();

				done();

			}).catch(err => {
				console.log(err.stack);
				// this will cause the test to fail
				expect(err).toBeUndefined();
				done();
			}).done();

		}));

		it("dehydrates an array of entries when two requests are made to the same URL", withRlsContext(done => {

			ReactServerAgent.get("/describe").query({"foo": "bar"}).then(res => res);
			ReactServerAgent.get("/describe").query({"foo": "baz"}).then(res => res);

			FragmentDataCache.createWhenReady().then(fragmentComponent => {

				expect(fragmentComponent).toBeDefined();

				var htmlStr = ReactDOMServer.renderToStaticMarkup(fragmentComponent);
				var $ = cheerio.load(htmlStr);

				var node
				,	dataStr
				,	parsedData;

				node = $("#react-server-fragment-data-cache");
				expect(node.length).toBe(1);

				dataStr = node.attr("data-react-server-data-cache");
				parsedData = JSON.parse(dataStr);

				expect(parsedData).toBeDefined();
				expect(parsedData.dataCache).toBeDefined();
				expect(parsedData.dataCache["/describe"]).toBeDefined();
				expect(parsedData.dataCache["/describe"].length).toBe(2);

				done();

			}).catch(err => {
				console.log(err.stack);
				// this will cause the test to fail
				expect(err).toBeUndefined();
				done();
			}).done();
		}));
	});

	function getSingleEntry(parsedData, url) {
		var entryOrArray = parsedData.dataCache[url];
		// we expect a _single_ entry
		expect(Array.isArray(entryOrArray)).toBeFalsy();
		return entryOrArray;
	}

});
