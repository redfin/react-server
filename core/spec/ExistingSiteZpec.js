var React = require("react"),
	helper = require("./tritonHelper"),
	Browser = require('zombie');

describe("The current site", function() {

	xit("shows up.", function(done) {
		var browser = getBrowser();

		browser.visit("http://sashaaickin.redfintest.com/r3s/").then(() => {
			expect(browser.window.document.querySelector("div").innerHTML).toMatch(/Some Home/);
			expect(browser.window.React).toBeDefined();
			done();
		});
	});

	xit("waits for the browser to be done with scripts on.", function(done) {
		var browser = getBrowser();

		browser.visit("https://sashaaickin.redfintest.com/r3s/CA/San-Francisco/690-Market-St-94104/unit-1105/home/21967224").then(() => {
			expect(browser.window.document.querySelector("div.SingleSimilarHome").innerHTML).toMatch(/490 Post St #1700/);
			expect(browser.window.React).toBeDefined();
			done();
		});

	});

	xit("doesn't wait for the browser to be done with scripts off.", function(done) {
		var browser = getBrowser({runScripts:false});

		browser.visit("https://sashaaickin.redfintest.com/r3s/CA/San-Francisco/690-Market-St-94104/unit-1105/home/21967224").then(() => {
			expect(browser.window.document.querySelector("div.SingleSimilarHome")).toBeNull();
			expect(browser.window.React).not.toBeDefined();
			done();
		});

	});

	xit("works with page-to-page transitions.", function(done) {
		var browser = getBrowser();

		browser.visit("http://sashaaickin.redfintest.com/r3s/").then(() => {
			expect(browser.window.document.querySelector("div").innerHTML).toMatch(/Some Home/);
			expect(browser.window.React).toBeDefined();
			browser.clickLink("Some Home", () => {
				expect(browser.window.document.querySelector("div.SingleSimilarHome").innerHTML).toMatch(/490 Post St #1700/);
				expect(browser.window.React).toBeDefined();
				done();
			});
		});

	});
});