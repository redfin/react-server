var helper = require('../../specRuntime/testHelper');

describe('A page with custom http headers', () => {

	helper.startServerBeforeAll(__filename, [
		'./HttpHeadersPage',
		'./AsyncHttpHeadersPage',
	]);

	helper.stopServerAfterAll();

	describe('has sync rendered headers', () => {
		helper.testWithBrowser('/httpHeaders', (browser, isTransition) => {
			expectSecurityPolicyHeaderExists(browser, isTransition);
		});
	});

	describe('has async rendered headers', () => {
		helper.testWithBrowser('/asyncHttpHeaders', (browser, isTransition) => {
			expectSecurityPolicyHeaderExists(browser, isTransition);
		});
	});

	const expectSecurityPolicyHeaderExists = (browser, isTransition) => {
		// Client transition renders execute on the client. That means we don't have an opportunity to send over
		// headers
		if(isTransition) return;

		const headers = browser.resources['0'].response.headers._headers;
		const csp = headers.find(header => header[0] === 'content-security-policy');

		expect(csp[1]).toBe("example.com");
	}
});
