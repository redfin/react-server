import helper from "../../specRuntime/testHelper";

describe("isBrowser setting", () => {
	helper.startServerBeforeAll(__filename, [
		"./IsBrowserSettingPage",
	]);

	helper.stopServerAfterAll();

	describe("is accurate", () => {
		it ("on server", (done) => {
			helper.getServerDocument("/isBrowserSetting", (document) => {
				expect(document.querySelector("span#answer").innerHTML).toBe("false");
				done();
			});
		});
		it ("on client", (done) => {
			helper.getClientDocument("/isBrowserSetting", (document) => {
				expect(document.querySelector("span#answer").innerHTML).toBe("true");
				done();
			});
		});
		it ("on client transition", (done) => {
			helper.getTransitionDocument("/isBrowserSetting", (document) => {
				expect(document.querySelector("span#answer").innerHTML).toBe("true");
				done();
			});
		});
	});
});
