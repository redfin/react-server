import ClientRequest from '../ClientRequest';

describe("ClientRequest", () => {
	let clientRequest;

	beforeEach(() => {
		clientRequest = new ClientRequest("/");
	});

	it("parses query params correctly", (done) => {
		clientRequest = new ClientRequest("/");
		expect(clientRequest.getQuery()).toEqual({});
		clientRequest = new ClientRequest("/react-server/foo");
		expect(clientRequest.getQuery()).toEqual({});
		clientRequest = new ClientRequest("/react-server/foo/");
		expect(clientRequest.getQuery()).toEqual({});
		clientRequest = new ClientRequest("/react-server/foo/?");
		expect(clientRequest.getQuery()).toEqual({});
		clientRequest = new ClientRequest("/react-server/foo/?foo=bar");
		expect(clientRequest.getQuery()).toEqual({foo: "bar"});
		clientRequest = new ClientRequest("/react-server/foo/?foo=bar&baz=123");
		expect(clientRequest.getQuery()).toEqual({foo: "bar", baz: "123"});
		clientRequest = new ClientRequest("/react-server/foo/?foo=bar&baz=123#");
		expect(clientRequest.getQuery()).toEqual({foo: "bar", baz: "123"});
		clientRequest = new ClientRequest("/react-server/foo/?foo=bar&baz=123&zed=abc?#some-fragment?#");
		expect(clientRequest.getQuery()).toEqual({foo: "bar", baz: "123", zed: "abc?"});
		done();
	});

});
