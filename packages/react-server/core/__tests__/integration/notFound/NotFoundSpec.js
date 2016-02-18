var helper = require("../../../test/specRuntime/testHelper");
var Browser = require("zombie");

describe("A 404 not found page", () => {

	a404("can result from no route", '/notFoundDoesNotExist', txt => {
		expect(txt).toBe('Cannot GET /notFoundDoesNotExist\n')
	});

	a404("has no body by default", '/notFoundNoDocument', txt => {
		expect(txt).toBe('Cannot GET /notFoundNoDocument\n')
	});

	a404("has a body with `haveDocument(true)`", '/notFoundWithDocument', txt => {
		expect(txt).not.toMatch('Cannot GET /notFoundNoDocument')
		expect(txt).toMatch('foo</title>')
		expect(txt).toMatch('foo</div>')
	});

	function a404(spec, url, callback) {
		it(spec, done => new Browser()
			.fetch(`http://localhost:${helper.getPort()}${url}`)
			.then(res => (expect(res.status).toBe(404), res.text()))
			.then(callback)
			.then(done)
		);
	}

	helper.startServerBeforeAll(__filename, [
		"./pages/NotFoundNoDocument",
		"./pages/NotFoundWithDocument",
	]);

	helper.stopServerAfterAll();
});
