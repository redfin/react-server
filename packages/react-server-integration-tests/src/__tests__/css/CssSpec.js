var helper = require("../../specRuntime/testHelper");

describe("A CSS page", () => {

	helper.startServerBeforeAll(__filename, [
		"./CssPage",
	]);

	helper.stopServerAfterAll();

	describe("can apply a css class", () => {
		helper.testWithDocument("/css", (document) => {
			// The way Webpack is chunking the CSS files, the client transition might look for 0.css while
			// the server side looks for route0.css
			expect(document.querySelector("head link[rel=stylesheet]").href).toMatch(/(?:route)?0\.css/);
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
			// The way Webpack is chunking the CSS files, the client transition might look for 0.css while
			// the server side looks for route0.css
			expect(document.querySelector("head link[rel=stylesheet]").href).toMatch(/(?:route)?0\.css/);
		});
	});

});
