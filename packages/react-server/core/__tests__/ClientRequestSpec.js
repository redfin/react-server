import ClientRequest from '../ClientRequest';

describe('ClientRequest', () => {
	let clientRequest;

	beforeEach(() => {
		clientRequest = new ClientRequest('/');
	});

	it('removes fragment identifiers from the url', (done) => {
		clientRequest = new ClientRequest('/');
		expect(clientRequest.getUrl()).toEqual('/');
		clientRequest = new ClientRequest('/react-server/foo#bar');
		expect(clientRequest.getUrl()).toEqual('/react-server/foo');
		clientRequest = new ClientRequest('/react-server/foo/#bar#bazz');
		expect(clientRequest.getUrl()).toEqual('/react-server/foo/');
		clientRequest = new ClientRequest('/react-server/foo/?#bar');
		expect(clientRequest.getUrl()).toEqual('/react-server/foo/?');
		clientRequest = new ClientRequest('/react-server/foo/?foo=bar&baz=123');
		expect(clientRequest.getUrl()).toEqual('/react-server/foo/?foo=bar&baz=123');
		clientRequest = new ClientRequest('/react-server/foo/?foo=bar&baz=123#');
		expect(clientRequest.getUrl()).toEqual('/react-server/foo/?foo=bar&baz=123');
		clientRequest = new ClientRequest('/react-server/foo/?foo=bar&baz=123&zed=abc?#some-fragment?#');
		expect(clientRequest.getUrl()).toEqual('/react-server/foo/?foo=bar&baz=123&zed=abc?');
		clientRequest = new ClientRequest('/react-server/foo#?bar=3&foo=7');
		expect(clientRequest.getUrl()).toEqual('/react-server/foo');
		done();
	});

	it('parses query params correctly', (done) => {
		clientRequest = new ClientRequest('/');
		expect(clientRequest.getQuery()).toEqual({});
		clientRequest = new ClientRequest('/react-server/foo');
		expect(clientRequest.getQuery()).toEqual({});
		clientRequest = new ClientRequest('/react-server/foo/');
		expect(clientRequest.getQuery()).toEqual({});
		clientRequest = new ClientRequest('/react-server/foo/?');
		expect(clientRequest.getQuery()).toEqual({});
		clientRequest = new ClientRequest('/react-server/foo/?foo=bar');
		expect(clientRequest.getQuery()).toEqual({ foo: 'bar' });
		clientRequest = new ClientRequest('/react-server/foo/?foo=bar&baz=123');
		expect(clientRequest.getQuery()).toEqual({ foo: 'bar', baz: '123' });
		clientRequest = new ClientRequest('/react-server/foo/?foo=bar&baz=123#');
		expect(clientRequest.getQuery()).toEqual({ foo: 'bar', baz: '123' });
		clientRequest = new ClientRequest('/react-server/foo/?foo=bar&baz=123&zed=abc?#some-fragment?#');
		expect(clientRequest.getQuery()).toEqual({ foo: 'bar', baz: '123', zed: 'abc?' });
		clientRequest = new ClientRequest('/react-server/foo#?bar=3&foo=7');
		expect(clientRequest.getQuery()).toEqual({});
		done();
	});

});
