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

	itOnAllRenders("redirects temporarily to the right page", (client, done) => {
		client.url("/temporaryRedirect")
			.getUrl()
			.then(currentUrl => expect(url.parse(currentUrl).pathname).toMatch("/final"))
			.then(done);
	});

	itOnAllRenders("contains the correct HTML after temp redirect", (client, done) => {
		client.url("/temporaryRedirect")
			.getText("#main")
			.then(text => expect(text).toMatch("FinalPage"))
			.getHTML("body", false)
			.then(html => expect(html).not.toMatch(/TemporaryRedirectPage/))
			.then(done);
	});

	it("gets the right status code for a temp redirect", (done) => {
		expectStatus("/temporaryRedirect", 302, done);
	});

	it("gets the right body for a temp redirect", done => {
		getHttpText("/temporaryRedirect")
			.then(text => {
				expect(text).toMatch('Found. Redirecting to /final');
				expect(text).not.toMatch('TemporaryRedirectPage');
				done();
			});
	});

	it("gets the right body for a temp redirect with document", done => {
		getHttpText("/temporaryRedirectWithDocument")
			.then(text => {
				expect(text).not.toMatch('Found. Redirecting to /final');
				expect(text).toMatch('TemporaryRedirectWithDocumentPage');
				done();
			});
	});

	itOnAllRenders("redirects temporarily to the right page with document", (client, done) => {
		client.url("/temporaryRedirectWithDocument")
			.getUrl()
			.then(currentUrl => expect(url.parse(currentUrl).pathname).toMatch("/final"))
			.then(done)
			.catch(done.fail);
	});

	itOnAllRenders("redirects permanently to the right page", (client, done) => {
		client.url("/permanentRedirect")
			.getUrl()
			.then(currentUrl => expect(url.parse(currentUrl).pathname).toMatch("/final"))
			.then(done);
	});

	itOnAllRenders("contains the correct HTML after permanent redirect", (client, done) => {
		client.url("/permanentRedirect")
			.getText("#main")
			.then(text => expect(text).toMatch("FinalPage"))
			.getHTML("body", false)
			.then(html => expect(html).not.toMatch(/PermanentRedirectPage/))
			.then(done);
	});

	it("gets the right status code for a permanent redirect", (done) => {
		expectStatus("/permanentRedirect", 301, done);
	});

	it("gets the right body for a permanent redirect", done => {
		getHttpText("/permanentRedirect")
			.then(text => {
				expect(text).toMatch('Moved Permanently. Redirecting to /final');
				expect(text).not.toMatch('PermanentRedirectPage');
				done();
			});
	});

	it("gets the right body for a permanent redirect with document", done => {
		getHttpText("/permanentRedirectWithDocument")
			.then(text => {
				expect(text).not.toMatch('Moved Permanently. Redirecting to /final');
				expect(text).toMatch('PermanentRedirectWithDocumentPage');
				done();
			});
	});

	itOnAllRenders("redirects permanently to the right page with document", (client, done) => {
		client.url("/permanentRedirectWithDocument")
			.getUrl()
			.then(currentUrl => expect(url.parse(currentUrl).pathname).toMatch("/final"))
			.then(done);
	});


});

describe("A forward page", () => {

	startServerBeforeAll(__filename, [
		"./FinalPage",
		"./ForwardPage",
	]);

	stopServerAfterAll();

	startClientBeforeEach();

	itOnAllRenders("does NOT change its URL", (client, done) => {
		client.url("/forward")
			.getUrl()
			.then(currentUrl => expect(url.parse(currentUrl).pathname).toMatch("/forward"))
			.then(done);
	});

	itOnAllRenders("contains the correct HTML after forward", (client, done) => {
		client.url("/forward")
			.getText("#main")
			.then(text => expect(text).toMatch("FinalPage"))
			.getHTML("body", false)
			.then(html => expect(html).not.toMatch(/ForwardPage/))
			.then(done)
			.catch(e => console.log(e));
	});

	it ("gets a 200 status code and doesn't redirect", (done) => {
		expectStatus("/forward", 200, done);
	});
});
