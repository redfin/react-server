import {
	startServerBeforeAll,
	stopServerAfterAll,
	startClientBeforeEach,
	itOnClient,
	itOnAllRenders,
} from "../../specRuntime/testHelper"

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe("A basic page", () => {

	startServerBeforeAll(__filename, [
		"./HelloWorldPage",
		"./GoodbyeWorldPage",
		"./MultiElementPage",
	]);

	stopServerAfterAll();

	startClientBeforeEach();

	itOnAllRenders("can say 'Hello, world!'", (client, done) => {
		client.url('/helloWorld')
			.getText("div#foo")
			.then(text => expect(text).toMatch("Hello, world!"))
			.then(done);
	});

	itOnAllRenders("can say 'Goodbye, world!'", (client, done) => {
		client.url('/goodbyeWorld')
			.getText("div#foo")
			.then(text => expect(text).toMatch(/Goodbye/))
			.then(done);
	});

	// this test is on client only; server render doesn't run client-side JavaScript.
	itOnClient("has React on client-side", (client, done) => {
		client.url('/goodbyeWorld')
			.execute(function() {
				return !!window.React;
			})
			.then(value => expect(value.value).toBe(true))
			.then(done);
	});

	itOnAllRenders("can have multiple elements", (client, done) => {
		client.url('/multiElement')
			.getText("div#foo1")
			.then(text => expect(text).toMatch("Div1"))
			.getText("div#foo2")
			.then(text => expect(text).toMatch("Div2"))
			.then(done);
	});
});
