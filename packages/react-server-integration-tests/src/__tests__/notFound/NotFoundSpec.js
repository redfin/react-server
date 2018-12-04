var helper = require("../../specRuntime/testHelper");
var Browser = require("zombie");

function getNotFoundPage(message) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>${message}</pre>
</body>
</html>\n`;
}

describe("A 404 not found page", () => {

	a404("can result from no route", '/notFoundDoesNotExist', txt => {
		expect(txt).toBe(getNotFoundPage('Cannot GET /notFoundDoesNotExist'))
	});

	a404("has no body by default", '/notFoundNoDocument', txt => {
		expect(txt).toBe(getNotFoundPage('Cannot GET /notFoundNoDocument'))
	});

	a404("has a body with `hasDocument: true`", '/notFoundWithDocument', txt => {
		expect(txt).not.toMatch(getNotFoundPage('Cannot GET /notFoundNoDocument'))
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
