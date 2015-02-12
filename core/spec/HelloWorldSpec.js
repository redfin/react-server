var helper = require("./tritonHelper");


var port = process.env.PORT || 8769;


describe("A basic page", function() {

	helper.startTritonBeforeEach({
		"/hello": "./HelloWorldPage", 
		"/goodbye": "./GoodbyeWorldPage",
		"/multi": "./MultiElementPage"
	}, port);

	helper.teardownTritonAfterEach();

	describe("can say 'Hello, world!'", function() {
		helper.testWithDocument("/hello", port, (document, done) =>{
				expect(document.querySelector("div#foo").innerHTML).toMatch("Hello, world!");
				done();
		});
	});

	describe("can say 'Goodbye, world!'", function() {
		helper.testWithDocument("/goodbye", port, (document, done) => {
			expect(document.querySelector("div#foo").innerHTML).toMatch(/Goodbye/);
			done();

		});
	});

	describe("has React on client-side", function() {
		helper.testWithWindow("/goodbye", port, (window, done) => {
			expect(window.React).toBeDefined();
			done();
		});
	});

	describe("can have multiple elements", function(done) {
		helper.testWithDocument("/multi", port, function(document, done) {
			expect(document.querySelector("div#foo1").innerHTML).toMatch("Div1");
			expect(document.querySelector("div#foo2").innerHTML).toMatch("Div2");
			done();
		});
	});
});