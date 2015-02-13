var helper = require("../tritonHelper"), 
	Browser = require("zombie");

describe("A redirect page", () => {

	helper.startTritonBeforeAll([
		"./redirectForward/TemporaryRedirectPage", 
		"./redirectForward/PermanentRedirectPage",
		"./redirectForward/FinalPage", 
	]);

	helper.stopTritonAfterAll();

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
		browser.on("redirect", (request, response, redirectRequest) => {
			expect(response.statusCode).toBe(302);
			done();
		});
		browser.visit(`http://localhost:${helper.getPort()}/temporaryRedirect`);
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
		browser.on("redirect", (request, response, redirectRequest) => {
			expect(response.statusCode).toBe(301);
			done();
		});
		browser.visit(`http://localhost:${helper.getPort()}/permanentRedirect`);
	});
});

describe("A forward page", () => {

	helper.startTritonBeforeAll([
		"./redirectForward/FinalPage", 
		"./redirectForward/ForwardPage", 
	]);

	helper.stopTritonAfterAll();

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