import {
	itOnAllRenders,
	startClientBeforeEach,
	getPort,
	startServerBeforeAll,
	stopServerAfterAll,
} from "../../specRuntime/testHelper"
import url from "url"
import request from "request"

const expectStatus = (url, expectedStatus, done) => {
	request({
		url: `http://localhost:${getPort()}${url}`,
		followRedirect:false,
	}, (error, res) => {
		if (error) {
			done.fail();
		} else {
			expect(res.statusCode).toBe(expectedStatus);
			done();
		}
	});
}

const getHttpText = (url) => {
	return new Promise((resolve, reject) => {
		request({
			url: `http://localhost:${getPort()}${url}`,
			followRedirect:false,
		}, (error, res, body) => {
			if (error) {
				reject(error);
			} else {
				resolve(body);
			}
		});
	});
};

describe("A redirect page", () => {

	startServerBeforeAll(__filename, [
		"./TemporaryRedirectPage",
		"./TemporaryRedirectWithDocumentPage",
		"./PermanentRedirectPage",
		"./PermanentRedirectWithDocumentPage",
		"./FinalPage",
	]);

	stopServerAfterAll();

	startClientBeforeEach();

	itOnAllRenders("redirects temporarily to the right page", client => {
		return client.url("/temporaryRedirect")
			.getUrl()
			.then(currentUrl => expect(url.parse(currentUrl).pathname).toMatch("/final"));
	});

	itOnAllRenders("contains the correct HTML after temp redirect", client => {
		return client.url("/temporaryRedirect")
			.getText("#main")
			.then(text => expect(text).toMatch("FinalPage"))
			.getHTML("body", false)
			.then(html => expect(html).not.toMatch(/TemporaryRedirectPage/));
	});

	it("gets the right status code for a temp redirect", (done) => {
		expectStatus("/temporaryRedirect", 302, done);
	});

	it("gets the right body for a temp redirect", () => {
		return getHttpText("/temporaryRedirect")
			.then(text => {
				expect(text).toMatch('Found. Redirecting to /final');
				expect(text).not.toMatch('TemporaryRedirectPage');
			});
	});

	it("gets the right body for a temp redirect with document", () => {
		return getHttpText("/temporaryRedirectWithDocument")
			.then(text => {
				expect(text).not.toMatch('Found. Redirecting to /final');
				expect(text).toMatch('TemporaryRedirectWithDocumentPage');
			});
	});

	itOnAllRenders("redirects temporarily to the right page with document", client => {
		return client.url("/temporaryRedirectWithDocument")
			.getUrl()
			.then(currentUrl => expect(url.parse(currentUrl).pathname).toMatch("/final"));
	});

	itOnAllRenders("redirects permanently to the right page", client => {
		return client.url("/permanentRedirect")
			.getUrl()
			.then(currentUrl => expect(url.parse(currentUrl).pathname).toMatch("/final"));
	});

	itOnAllRenders("contains the correct HTML after permanent redirect", client => {
		return client.url("/permanentRedirect")
			.getText("#main")
			.then(text => expect(text).toMatch("FinalPage"))
			.getHTML("body", false)
			.then(html => expect(html).not.toMatch(/PermanentRedirectPage/));
	});

	it("gets the right status code for a permanent redirect", done => {
		expectStatus("/permanentRedirect", 301, done);
	});

	it("gets the right body for a permanent redirect", () => {
		return getHttpText("/permanentRedirect")
			.then(text => {
				expect(text).toMatch('Moved Permanently. Redirecting to /final');
				expect(text).not.toMatch('PermanentRedirectPage');
			});
	});

	it("gets the right body for a permanent redirect with document", () => {
		return getHttpText("/permanentRedirectWithDocument")
			.then(text => {
				expect(text).not.toMatch('Moved Permanently. Redirecting to /final');
				expect(text).toMatch('PermanentRedirectWithDocumentPage');
			});
	});

	itOnAllRenders("redirects permanently to the right page with document", client => {
		return client.url("/permanentRedirectWithDocument")
			.getUrl()
			.then(currentUrl => expect(url.parse(currentUrl).pathname).toMatch("/final"));
	});
});

describe("A forward page", () => {

	startServerBeforeAll(__filename, [
		"./FinalPage",
		"./ForwardPage",
	]);

	stopServerAfterAll();

	startClientBeforeEach();

	itOnAllRenders("does NOT change its URL", client => {
		return client.url("/forward")
			.getUrl()
			.then(currentUrl => expect(url.parse(currentUrl).pathname).toMatch("/forward"));
	});

	itOnAllRenders("contains the correct HTML after forward", client => {
		return client.url("/forward")
			.getText("#main")
			.then(text => expect(text).toMatch("FinalPage"))
			.getHTML("body", false)
			.then(html => expect(html).not.toMatch(/ForwardPage/));
	});

	it ("gets a 200 status code and doesn't redirect", (done) => {
		expectStatus("/forward", 200, done);
	});
});
