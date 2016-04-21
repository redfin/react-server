import {
	itOnClientRender,
	itOnClient,
	itOnAllRenders,
	waitForClientTransition,
	startServerBeforeAll,
	stopServerAfterAll,
	startClientBeforeEach,
} from "../../specRuntime/testHelper"

describe("A page with a title", () => {

	startServerBeforeAll(__filename, [
		"./SimpleTitlePage",
		"./UnicodeTitlePage",
		"./NullTitlePage",
		"./AsyncTitlePage",
		"./AsyncServerTimeoutTitlePage",
	]);

	stopServerAfterAll();

	startClientBeforeEach();

	itOnAllRenders("has a title", client => {
		return client.url('http://localhost:3000/simpleTitle')
			.getTitle()
			.then(title => expect(title).toMatch("This Is My Simple Title"));
	});

	itOnAllRenders("can deal correctly with other scripts in Unicode", client => {
		return client.url('http://localhost:3000/unicodeTitle')
			.getTitle()
			.then(title => expect(title).toMatch("我叫艾肯 Chișinău مرحبا 🐧"));
	});

	itOnClientRender("will set its title to '' if the return value from getTitle is null", client => {
		return client.url("/simpleTitle")
			.click("=Click me")
			.then(() => waitForClientTransition(client, "/nullTitle"))
			.getTitle()
			.then(title => expect(title).toMatch(""));
	});

	itOnAllRenders("can render a title asynchronously", client => {
		return client.url('http://localhost:3000/asyncTitle')
			.getTitle()
			.then(title => expect(title).toMatch("An asynchonous title"));
	});

	itOnClient("can render a title that times out on the server", client => {
		return client.url("/asyncServerTimeoutTitle")
			// wait for the title to resolve; takes 500ms for it to come back.
			.then(() => new Promise(resolve => setTimeout(resolve, 1000)))
			.getTitle()
			.then(title => expect(title).toMatch("An asynchonous timeout title"));
	});
});
