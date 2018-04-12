var helper = require('../../specRuntime/testHelper');

describe('A raw response page', () => {

	helper.startServerBeforeAll(__filename, [
		'./RawResponsePage',
	]);

	helper.stopServerAfterAll();

	describe('sends correct content types', () => {
		helper.testWithBrowser('/rawResponse', (browser, isTransition) => {
			expectSecurityPolicyHeaderExists(browser, isTransition);
		});
	});

	const expectSecurityPolicyHeaderExists = (browser, isTransition) => {
		// Client transition renders execute on the client. That means we don't have an opportunity to send over
		// headers
		if (isTransition) return;

		const headers = browser.resources['0'].response.headers._headers;
		const contentType = headers.find(header => header[0] === 'content-type');

		expect(contentType[1]).toBe("application/example");
	}
});
