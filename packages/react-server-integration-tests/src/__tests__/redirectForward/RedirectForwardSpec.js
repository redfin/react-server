var helper = require("../../specRuntime/testHelper"),
	Browser = require("zombie");

describe("A redirect page", () => {

	helper.startServerBeforeAll(__filename, [
		"./TemporaryRedirectPage",
		"./TemporaryRedirectWithDocumentPage",
		"./PermanentRedirectPage",
		"./PermanentRedirectWithDocumentPage",
		"./FinalPage",
	]);

	helper.stopServerAfterAll();

	describe("redirects temporarily to the right page", () => {
		helper.testWithDocument("/temporaryRedirect", (document) => {
			expect(document.location.pathname).toMatch("/final");
		});
	});

	describe("contains the correct HTML after temp redirect", () => {
		helper.testWithDocument("/temporaryRedirect", (document) => {
			expect(document.querySelector("#main").innerHTML).toMatch("FinalPage");
			expect(document.querySelector("body").innerHTML).not.toMatch(/TemporaryRedirectPage/);
		});
	});

	it("gets the right status code for a temp redirect", (done) => {
		var browser = new Browser();
		browser.silent = true;
		browser.on("redirect", (request, response, redirectRequest) => { //eslint-disable-line no-unused-vars
			expect(response.status).toBe(302);
			done();
		});
		browser.visit(`http://localhost:${helper.getPort()}/temporaryRedirect`);
	});

	it("gets the right body for a temp redirect", done => {
		(new Browser).on("redirect", (req, res) => {
			res.text().then(text => {
				expect(text).toMatch('<p>Found. Redirecting to <a href="/final">/final</a></p>');
				expect(text).not.toMatch('TemporaryRedirectPage');
				done();
			});
		})
		.visit(`http://localhost:${helper.getPort()}/temporaryRedirect`);
	});

	it("gets the right body for a temp redirect with document", done => {
		(new Browser).on("redirect", (req, res) => {
			res.text().then(text => {
				expect(text).not.toMatch('<p>Found. Redirecting to <a href="/final">/final</a></p>');
				expect(text).toMatch('TemporaryRedirectWithDocumentPage');
				done();
			});
		})
		.visit(`http://localhost:${helper.getPort()}/temporaryRedirectWithDocument`);
	});

	describe("redirects temporarily to the right page with document", () => {
		helper.testWithDocument("/temporaryRedirectWithDocument", (document) => {
			expect(document.location.pathname).toMatch("/final");
		});
	});

	describe("redirects permanently to the right page", () => {
		helper.testWithDocument("/permanentRedirect", (document) => {
			expect(document.location.pathname).toMatch("/final");
		});
	});

	describe("contains the correct HTML after permanent redirect", () => {
		helper.testWithDocument("/permanentRedirect", (document) => {
			expect(document.querySelector("#main").innerHTML).toMatch("FinalPage");
			expect(document.querySelector("body").innerHTML).not.toMatch(/PermanentRedirectPage/);
		});
	});

	it("gets the right status code for a permanent redirect", (done) => {
		var browser = new Browser();
		browser.silent = true;
		browser.on("redirect", (request, response, redirectRequest) => { //eslint-disable-line no-unused-vars
			expect(response.status).toBe(301);
			done();
		});
		browser.visit(`http://localhost:${helper.getPort()}/permanentRedirect`);
	});

	it("gets the right body for a permanent redirect", done => {
		(new Browser).on("redirect", (req, res) => {
			res.text().then(text => {
				expect(text).toMatch('<p>Moved Permanently. Redirecting to <a href="/final">/final</a></p>');
				expect(text).not.toMatch('PermanentRedirectPage');
				done();
			});
		})
		.visit(`http://localhost:${helper.getPort()}/permanentRedirect`);
	});

	it("gets the right body for a permanent redirect with document", done => {
		(new Browser).on("redirect", (req, res) => {
			res.text().then(text => {
				expect(text).not.toMatch('<p>Moved Permanently. Redirecting to <a href="/final">/final</a></p>');
				expect(text).toMatch('PermanentRedirectWithDocumentPage');
				done();
			});
		})
		.visit(`http://localhost:${helper.getPort()}/permanentRedirectWithDocument`);
	});

	describe("redirects permanently to the right page with document", () => {
		helper.testWithDocument("/permanentRedirectWithDocument", (document) => {
			expect(document.location.pathname).toMatch("/final");
		});
	});


});

describe("A forward page", () => {

	helper.startServerBeforeAll(__filename, [
		"./FinalPage",
		"./ForwardPage",
	]);

	helper.stopServerAfterAll();

	describe("does NOT change its URL", () => {
		helper.testWithDocument("/forward", (document) => {
			expect(document.location.pathname).toMatch("/forward");
		});
	});

	describe("contains the correct HTML after forward", () => {
		helper.testWithDocument("/forward", (document) => {
			expect(document.querySelector("#main").innerHTML).toMatch("FinalPage");
			expect(document.querySelector("body").innerHTML).not.toMatch(/ForwardPage/);
		});
	});

	it ("gets a 200 status code and doesn't redirect", (done) => {
		var browser = new Browser();

		browser.silent = true;
		browser.on("redirect", (request, response, redirectRequest) => { //eslint-disable-line no-unused-vars
			fail("Forward page redirected when it shouldn't have.");
			done();
		});
		browser.visit(`http://localhost:${helper.getPort()}/forward`).then(() => {
			expect(browser.resources[0].response.status).toBe(200);
			done();
		});
	});
});
