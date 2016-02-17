var helper = require("../../../test/specRuntime/testHelper");
var _ = require('lodash');

describe("A page's root elements", () => {
	var pages = [];
	var seen = {};

	// Single elements of various types.
	// All should resolve to a single `<div>foo</div>`.
	_.forEach({
		"/singleDivNoArray"         : "div with no array",
		"/singleDivInArray"         : "div in an array",
		"/singlePromiseNoArray"     : "promise with no array",
		"/singlePromiseInArray"     : "promise in an array",
		"/singleRootElementNoArray" : "RootElement with no array",
		"/singleRootElementInArray" : "RootElement in an array",
	}, makeSingleDesc(0));

	// Single elements in containers.
	_.forEach({
		"/singleRootContainerNoArray" : "RootContainer with no array",
		"/singleRootContainerInArray" : "RootContainer in an array",
	}, makeSingleDesc(0));

	// The first root element won't always be at index zero, since
	// containers might burn slots.
	function makeSingleDesc(idx) {
		return (txt, url) => desc(
			`can be a single ${txt}`,
			url,
			element => expect(element.innerHTML).toMatch('foo'),
			idx
		)
	}

	// Some machinery to factor out commonality.
	function desc(txt, url, fn, idx=0) {
		describe(txt, () => helper.testWithElement(url, `[data-triton-root-id="${idx}"]`, fn));
		var page = `./pages/${url[0]+url[1].toUpperCase()+url.slice(2)}`;
		if (!seen[page]){
			seen[page] = true;
			pages.push(page);
		}
	};

	helper.startServerBeforeAll(__filename, pages);
	helper.stopServerAfterAll();
})
