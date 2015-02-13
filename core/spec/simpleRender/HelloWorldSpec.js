var helper = require("../tritonHelper");

describe("A basic page", () => {

	helper.startTritonBeforeAll({
		"/hello": "./simpleRender/HelloWorldPage", 
		"/goodbye": "./simpleRender/GoodbyeWorldPage",
		"/multi": "./simpleRender/MultiElementPage"
	});

	helper.stopTritonAfterAll();

	describe("can say 'Hello, world!'", () => {
		helper.testWithDocument("/hello", (document) =>{
			expect(document.querySelector("div#foo").innerHTML).toMatch("Hello, world!");
		});
	});

	describe("can say 'Goodbye, world!'", () => {
		helper.testWithDocument("/goodbye", (document) => {
			expect(document.querySelector("div#foo").innerHTML).toMatch(/Goodbye/);
		});
	});

	describe("has React on client-side", () => {
		helper.testWithWindow("/goodbye", (window) => {
			expect(window.React).toBeDefined();
		});
	});

	describe("can have multiple elements", (done) => {
		helper.testWithDocument("/multi", (document, done) => {
			expect(document.querySelector("div#foo1").innerHTML).toMatch("Div1");
			expect(document.querySelector("div#foo2").innerHTML).toMatch("Div2");
			done();
		});
	});
});