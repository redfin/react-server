var helper = require("../specRuntime/testHelper"), 
	Browser = require("zombie");

// FIXME: All of the `xdescribe` tests here are skipped because client
//        transitions are disabled in 61 per RED-63301.
describe("A redirect page", () => {

	helper.startServerBeforeAll([
		"./redirectForward/TemporaryRedirectPage", 
		"./redirectForward/PermanentRedirectPage",
		"./redirectForward/FinalPage", 
	]);

	helper.stopServerAfterAll();

	xdescribe("redirects temporarily to the right page", () => {
		helper.testWithDocument("/temporaryRedirect", (document) => {
			expect(document.location.pathname).toMatch("/final");
		});
	});

	xdescribe("contains the correct HTML after temp redirect", () => {
		helper.testWithDocument("/temporaryRedirect", (document) => {
			expect(document.querySelector("#main").innerHTML).toMatch("FinalPage");
			expect(document.querySelector("body").innerHTML).not.toMatch(/TemporaryRedirectPage/);
		});
	});

	it("gets the right status code for a temp redirect", (done) => {
		var browser = new Browser();
		browser.silent = true;
		browser.on("redirect", (request, response, redirectRequest) => {
			expect(response.statusCode).toBe(302);
			done();
		});
		browser.visit(`http://localhost:${helper.getPort()}/temporaryRedirect`);
	});

	xdescribe("redirects permanently to the right page", () => {
		helper.testWithDocument("/permanentRedirect", (document) => {
			expect(document.location.pathname).toMatch("/final");
		});
	});

	xdescribe("contains the correct HTML after permanent redirect", () => {
		helper.testWithDocument("/permanentRedirect", (document) => {
			expect(document.querySelector("#main").innerHTML).toMatch("FinalPage");
			expect(document.querySelector("body").innerHTML).not.toMatch(/PermanentRedirectPage/);
		});
	});

	it("gets the right status code for a permanent redirect", (done) => {
		var browser = new Browser();
		browser.silent = true;
		browser.on("redirect", (request, response, redirectRequest) => {
			expect(response.statusCode).toBe(301);
			done();
		});
		browser.visit(`http://localhost:${helper.getPort()}/permanentRedirect`);
	});
});

describe("A forward page", () => {

	helper.startServerBeforeAll([
		"./redirectForward/FinalPage", 
		"./redirectForward/ForwardPage", 
	]);

	helper.stopServerAfterAll();

	xdescribe("does NOT change its URL", () => {
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
		browser.on("redirect", (request, response, redirectRequest) => {
			fail("Forward page redirected when it shouldn't have.");
			done();
		});
		browser.visit(`http://localhost:${helper.getPort()}/forward`).then(() => {
			expect(browser.resources[0].response.statusCode).toBe(200);
			done();
		});
	});
});