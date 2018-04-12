var helper = require("../../specRuntime/testHelper");

describe("A CSS page", () => {

	helper.startServerBeforeAll(__filename, [
		"./CssPage",
	]);

	helper.stopServerAfterAll();

	describe("can apply a css class", () => {
		helper.testWithDocument("/css", (document) => {
			expect(document.querySelector("head link[rel=stylesheet]").href).toMatch(/route0\.css/);
		});
	});

});

describe("A CSS page with assets", () => {

	helper.startServerBeforeAll(__filename, [
		"./CssWithAssetsPage",
	]);

	helper.stopServerAfterAll();

	describe("can apply a css class", () => {
		helper.testWithDocument("/cssWithAssets", (document) => {
			// this test is really just to make sure that react-server-cli doesn't explode
			// when compiling CSS that includes images and fonts.
			expect(document.querySelector("head link[rel=stylesheet]").href).toMatch(/route0\.css/);
		});
	});

});
