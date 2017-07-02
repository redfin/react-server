var helper = require("../../specRuntime/testHelper");
var Browser = require("zombie");

describe("A 404 not found page", () => {

	a404("can result from no route", '/notFoundDoesNotExist', txt => {
		expect(txt).toContain("<b>Code:</b> 404");
		expect(txt).toContain("Error: Route not found /notFoundDoesNotExist");
	});

	a404("has no body by default", '/notFoundNoDocument', txt => {
		expect(txt).toContain("<b>Code:</b> 404");
		expect(txt).toContain("Error: Page returned code 404");
	});

	a404("has a body with `hasDocument: true`", "/notFoundWithDocument", txt => {
		expect(txt).not.toContain("Error: Route not found /notFoundNoDocument");
		expect(txt).toMatch("foo</title>");
		expect(txt).toMatch("foo</div>");
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
