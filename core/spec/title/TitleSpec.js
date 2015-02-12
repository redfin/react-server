var helper = require("../tritonHelper");

describe("A page with a title", function() {

	helper.startTritonBeforeEach({
		"/simpleTitle": "./title/SimpleTitlePage",
		"/unicodeTitle": "./title/UnicodeTitlePage",
		"/nullTitle": "./title/NullTitlePage",
		"/asyncTitle": "./title/AsyncTitlePage",
		"/asyncServerTimeoutTitle": "./title/AsyncServerTimeoutTitlePage",
	});

	helper.teardownTritonAfterEach();

	describe("has a title", () => {
		helper.testWithDocument("/simpleTitle", (document) =>{
			expect(document.title).toMatch("This Is My Simple Title");
		});
	});

	describe("can deal correctly with other scripts in Unicode", () => {
		helper.testWithDocument("/unicodeTitle", (document) =>{
			expect(document.title).toMatch("我叫艾肯 Chișinău مرحبا 🐧");
		});
	});

	describe("will set its title to '' if the return value from getTitle is null", () => {
		it("on transition", (done) => {
			helper.getClientBrowser("/simpleTitle", (browser) => {
				browser.clickLink("Click me").then(() => {
					expect(browser.window.document.title).toMatch("");
					done();
				})
			});
		});
	});

	describe("can render a title asynchronously", () => {
		helper.testWithDocument("/asyncTitle", (document) => {
			expect(document.title).toMatch("An asynchonous title");
		});
	});

	describe("can render a title that times out on the server", () => {
		helper.testWithWindow("/asyncServerTimeoutTitle", (window) => {
			expect(window.document.title).toMatch("An asynchonous timeout title");
		});
	});
});
