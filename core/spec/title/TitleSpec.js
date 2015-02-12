var helper = require("../tritonHelper");

describe("A page with a title", function() {

	helper.startTritonBeforeEach({
		"/simpleTitle": "./title/SimpleTitlePage"
	});

	helper.teardownTritonAfterEach();

	describe("has a title", function() {
		helper.testWithDocument("/simpleTitle", (document) =>{
			expect(document.title).toMatch("This Is My Simple Title");
		});
	});
});
