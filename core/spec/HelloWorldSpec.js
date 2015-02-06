var React = require("react"),
	helper = require("./tritonHelper");


var port = process.env.PORT || 8769;

class HelloWorldPage {
	getElements() {
		return <div id="foo">Hello, world!</div>;
	}
}

class GoodbyeWorldPage {
	getElements() {
		return <div id="foo">Goodbye, world!</div>;
	}
}

class MultiElementPage {
	getElements() { 
		return [
			<div id="foo1">Div1</div>, 
			<div id="foo2">Div2</div>
		];
	}
}


describe("A basic page", function() {

	helper.startTritonBeforeEach({
		"/hello": HelloWorldPage, 
		"/goodbye": GoodbyeWorldPage,
		"/multi": MultiElementPage
	}, port);

	helper.teardownTritonAfterEach();

	it("can say 'Hello, world!'", function(done) {

		helper.getDocumentFor("/hello", port, (document) => {
			expect(document.querySelector("div#foo").innerHTML).toMatch("Hello, world!");
			done();
		});
	});

	it("can say 'Goodbye, world!'", function(done) {
		helper.getDocumentFor("/goodbye", port, (document) => {
			expect(document.querySelector("div#foo").innerHTML).toMatch(/Goodbye/);
			done();
		});
	});

	it("can have multiple elements", function(done) {
		helper.getDocumentFor("/multi", port, (document) => {
			expect(document.querySelector("div#foo1").innerHTML).toMatch("Div1");
			expect(document.querySelector("div#foo2").innerHTML).toMatch("Div2");
			done();
		});
	});
});