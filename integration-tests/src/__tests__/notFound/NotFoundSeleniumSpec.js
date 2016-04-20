import {
	startServerBeforeAll,
	stopServerAfterAll,
	getPort,
} from "../../specRuntime/testHelper"
import request from "request"

describe("A 404 not found page", () => {

	a404("can result from no route", '/notFoundDoesNotExist', txt => {
		expect(txt).toBe('Cannot GET /notFoundDoesNotExist\n')
	});

	a404("has no body by default", '/notFoundNoDocument', txt => {
		expect(txt).toBe('Cannot GET /notFoundNoDocument\n')
	});

	a404("has a body with `hasDocument: true`", '/notFoundWithDocument', txt => {
		expect(txt).not.toMatch('Cannot GET /notFoundNoDocument')
		expect(txt).toMatch('foo</title>')
		expect(txt).toMatch('foo</div>')
	});

	function a404(spec, url, callback) {
		it(spec, done => {
			request(`http://localhost:${getPort()}${url}`, (error, res, body) => {
				expect(res.statusCode).toBe(404);
				callback(body);
				done();
			});
		});
	}

	startServerBeforeAll(__filename, [
		"./pages/NotFoundNoDocument",
		"./pages/NotFoundWithDocument",
	]);

	stopServerAfterAll();
});
