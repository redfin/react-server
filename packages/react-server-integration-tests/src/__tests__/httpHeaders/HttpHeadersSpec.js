var helper = require('../../specRuntime/testHelper');

describe('A page with custom http headers', () => {

	helper.startServerBeforeAll(__filename, [
		'./HttpHeadersPage',
		'./AsyncHttpHeadersPage',
	]);

	helper.stopServerAfterAll();

	fdescribe('has sync rendered headers', () => {
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
		// Client transition execute their renders on the client. That means we don't have an opportunity to send over
		// headers
		if(isTransition) return;

		const numCspHeaders = browser.resources[isTransition ? '4' : '0'].response.headers
			._headers
			.filter(header => header[0] === 'content-security-policy')
			.length;
		expect(numCspHeaders).toBe(1);
	}
});
