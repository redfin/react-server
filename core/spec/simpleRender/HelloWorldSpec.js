var helper = require("../tritonHelper");

describe("A basic page", function() {

	helper.startTritonBeforeEach({
		"/hello": "./simpleRender/HelloWorldPage", 
		"/goodbye": "./simpleRender/GoodbyeWorldPage",
		"/multi": "./simpleRender/MultiElementPage"
	});

	helper.teardownTritonAfterEach();

	describe("can say 'Hello, world!'", function() {
		helper.testWithDocument("/hello", (document) =>{
			expect(document.querySelector("div#foo").innerHTML).toMatch("Hello, world!");
		});
	});

	describe("can say 'Goodbye, world!'", function() {
		helper.testWithDocument("/goodbye", (document) => {
			expect(document.querySelector("div#foo").innerHTML).toMatch(/Goodbye/);
		});
	});

	describe("has React on client-side", function() {
		helper.testWithWindow("/goodbye", (window) => {
			expect(window.React).toBeDefined();
		});
	});

	describe("can have multiple elements", function(done) {
		helper.testWithDocument("/multi", function(document, done) {
			expect(document.querySelector("div#foo1").innerHTML).toMatch("Div1");
			expect(document.querySelector("div#foo2").innerHTML).toMatch("Div2");
			done();
		});
	});
});