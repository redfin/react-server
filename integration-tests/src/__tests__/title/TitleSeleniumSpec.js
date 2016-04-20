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

	itOnAllRenders("has a title", (client, done) => {
		client.url('http://localhost:3000/simpleTitle')
			.getTitle()
			.then(title => expect(title).toMatch("This Is My Simple Title"))
			.then(done);
	});

	itOnAllRenders("can deal correctly with other scripts in Unicode", (client, done) => {
		client.url('http://localhost:3000/unicodeTitle')
			.getTitle()
			.then(title => expect(title).toMatch("我叫艾肯 Chișinău مرحبا 🐧"))
			.then(done);
	});

	itOnClientRender("will set its title to '' if the return value from getTitle is null", (client, done) => {
		client.url("/simpleTitle")
			.click("=Click me")
			.then(() => waitForClientTransition(client, "/nullTitle"))
			.getTitle()
			.then(title => expect(title).toMatch(""))
			.then(done);
	});

	itOnAllRenders("can render a title asynchronously", (client, done) => {
		client.url('http://localhost:3000/asyncTitle')
			.getTitle()
			.then(title => expect(title).toMatch("An asynchonous title"))
			.then(done);
	});

	itOnClient("can render a title that times out on the server", (client, done) => {
		client.url("/asyncServerTimeoutTitle")
			// wait for the title to resolve; takes 500ms for it to come back.
			.then(() => new Promise(resolve => setTimeout(resolve, 1000)))
			.getTitle()
			.then(title => expect(title).toMatch("An asynchonous timeout title"))
			.then(done);
	});
});
