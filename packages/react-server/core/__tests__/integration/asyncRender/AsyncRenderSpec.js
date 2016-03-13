var helper = require("../../../test/specRuntime/testHelper");

describe("A page with async elements", () => {

	helper.startServerBeforeAll(__filename, [
		"./AsyncElementPage",
		"./ServerTimeoutElementPage"]);

	helper.stopServerAfterAll();

	describe("can render", () => {
		helper.testWithDocument("/asyncElement", (document) => {
			expect(document.querySelector("#main").innerHTML).toMatch("rendered!");
		});
	});

	it("can timeout on server", (done) => {
		helper.getServerDocument("/serverTimeoutElement?_debug_render_timeout=200", (document) => {
			expect(document.querySelector("#main")).toBeNull();
			done();
		});
	});

	describe("can timeout on server but render dynamically", () => {
		helper.testWithWindow("/serverTimeoutElement", (window) => {
			expect(window.document.querySelector("#main").innerHTML).toMatch("rendered!");
		});
	});
});
