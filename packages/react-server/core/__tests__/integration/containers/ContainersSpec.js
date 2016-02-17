var helper = require("../../../test/specRuntime/testHelper");
var _ = require('lodash');

describe("A page's root elements", () => {
	var pages = [];
	var seen = {};

	// Verify that we get our attributes set where they need to go.
	_.forEach({
		'RootElement'   : "[data-triton-root-id]",
		'RootContainer' : "[data-triton-container]",
	}, (query, root) => {
		_.forEach({
			'id'    : 'foo',
			'class' : 'bar',
			'style' : 'baz',
		}, (value, attr) => desc(
			`can have "${attr}" attribute on ${root}`,
			'/attributesOn'+root,
			element => expect(element.getAttribute(attr)).toBe(value),
			query
		));
	});


	// Single elements of various types.
	// All should resolve to a single `<div>foo</div>`.
	_.forEach({
		"/singleDivNoArray"                 : "div with no array",
		"/singleDivInArray"                 : "div in an array",
		"/singlePromiseNoArray"             : "promise with no array",
		"/singlePromiseInArray"             : "promise in an array",
		"/singleRootElementNoArray"         : "RootElement with no array",
		"/singleRootElementInArray"         : "RootElement in an array",
		"/singleRootElementInArray"         : "RootElement in an array",
		"/singleRootContainerNoArray"       : "RootContainer with no array",
		"/singleRootContainerInArray"       : "RootContainer in an array",
		"/singleRootElementInRootContainer" : "RootElement in a RootContainer",
	}, makeSingleDesc('can be a single'));

	// Get props to root elements in various ways.
	_.forEach({
		"/propsFromEmitterRootElement"   : "RootElement listen",
		"/propsFromEmitterRootContainer" : "RootContainer listen",
	}, makeSingleDesc('can get props from'));

	// Some machinery to factor out commonality.
	//
	// Note that with the default query this just grabs the first root
	// element.  Won't always be index zero, since containers burn slots
	// (but they don't have `data-triton-root-id`).
	function desc(txt, url, fn, query="[data-triton-root-id]") {
		describe(txt, () => helper.testWithElement(url, query, fn));
		var page = `./pages/${url[0]+url[1].toUpperCase()+url.slice(2)}`;
		if (!seen[page]){
			seen[page] = true;
			pages.push(page);
		}
	};

	// Expect the contents of the first root element to be 'foo'.
	function makeSingleDesc(prefix) {
		return (txt, url) => desc(`${prefix} ${txt}`, url,
			element => expect(element.innerHTML).toMatch('foo')
		)
	}

	helper.startServerBeforeAll(__filename, pages);
	helper.stopServerAfterAll();
})
