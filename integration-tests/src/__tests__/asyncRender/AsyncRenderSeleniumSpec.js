import {
	startServerBeforeAll,
	stopServerAfterAll,
	startClientBeforeEach,
	itOnClient,
	itOnServer,
	itOnAllRenders,
} from "../../specRuntime/testHelper"

describe("A page with async elements", function() {

	startServerBeforeAll(__filename, [
		"./AsyncElementPage",
		"./ServerTimeoutElementPage"]);

	stopServerAfterAll();

	startClientBeforeEach();

	itOnAllRenders("can render", client => {
		return client.url("/asyncElement")
			.getText("#main")
			.then(text => expect(text).toMatch("rendered!"));
	});

	itOnServer("can timeout on server", client => {
		return client.url("/serverTimeoutElement?_debug_render_timeout=200")
			.isExisting("#main")
			.then(exists => expect(exists).toBe(false));
	});

	itOnClient("can timeout on server but render dynamically", client => {
		return client.url("/serverTimeoutElement")
			.getText("#main")
			.then(text => expect(text).toMatch("rendered!"));
	});
});
