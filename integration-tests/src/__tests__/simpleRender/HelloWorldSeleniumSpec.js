import {
	startServerBeforeAll,
	stopServerAfterAll,
	startClientBeforeEach,
	itOnClient,
	itOnAllRenders,
} from "../../specRuntime/testHelper"

describe("A basic page", () => {

	startServerBeforeAll(__filename, [
		"./HelloWorldPage",
		"./GoodbyeWorldPage",
		"./MultiElementPage",
	]);

	stopServerAfterAll();

	startClientBeforeEach();

	itOnAllRenders("can say 'Hello, world!'", client => {
		return client.url('/helloWorld')
			.getText("div#foo")
			.then(text => expect(text).toMatch("Hello, world!"));
	});

	itOnAllRenders("can say 'Goodbye, world!'", client => {
		return client.url('/goodbyeWorld')
			.getText("div#foo")
			.then(text => expect(text).toMatch(/Goodbye/));
	});

	// this test is on client only; server render doesn't run client-side JavaScript.
	itOnClient("has React on client-side", client => {
		return client.url('/goodbyeWorld')
			.execute(function() {
				return !!window.React;
			})
			.then(value => expect(value.value).toBe(true));
	});

	itOnAllRenders("can have multiple elements", client => {
		return client.url('/multiElement')
			.getText("div#foo1")
			.then(text => expect(text).toMatch("Div1"))
			.getText("div#foo2")
			.then(text => expect(text).toMatch("Div2"));
	});
});
