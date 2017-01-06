const MemoryStream = require('memory-stream');

import { _testFunctions } from "../renderMiddleware";
import PageUtil from "../util/PageUtil";

import NullValuesPage from "./NullValuesPage";
import NullValuePromisesPage from "./NullValuePromisesPage";

describe("renderMiddleware", () => {
	let mockSocket,
		page;

	describe("null values", () => {
		beforeAll(() => {
			page = PageUtil.createPageChain([new NullValuesPage()]);
		});

		beforeEach(() => {
			mockSocket = new MemoryStream();
		});

		afterEach(() => {
			mockSocket = null;
		});

		it("don't render meta tags", (finishTest) => {
			_testFunctions.renderMetaTags(page, mockSocket)
				.then(() => {
					expect(mockSocket.toString()).toMatch('');
				}, finishTest.fail)
				.done(finishTest);
		});

		it("don't render link tags", (finishTest) => {
			_testFunctions.renderLinkTags(page, mockSocket)
				.then(() => {
					expect(mockSocket.toString()).toMatch('');
				}, finishTest.fail)
				.done(finishTest);
		});

		it("doesn't render base tag", (finishTest) => {
			_testFunctions.renderBaseTag(page, mockSocket)
				.then(() => {
					expect(mockSocket.toString()).toMatch('');
				}, finishTest.fail)
				.done(finishTest);
		});
	});


	describe("promises with null values", () => {
		beforeAll(() => {
			page = PageUtil.createPageChain([new NullValuePromisesPage()]);
		});

		beforeEach(() => {
			mockSocket = new MemoryStream();
		});

		afterEach(() => {
			mockSocket = null;
		});

		it("don't render meta tags", (finishTest) => {
			_testFunctions.renderMetaTags(page, mockSocket)
				.then(() => {
					expect(mockSocket.toString()).toMatch('');
				}, finishTest.fail)
				.done(finishTest);
		});

		it("don't render link tags", (finishTest) => {
			_testFunctions.renderLinkTags(page, mockSocket)
				.then(() => {
					expect(mockSocket.toString()).toMatch('');
				}, finishTest.fail)
				.done(finishTest);
		});

		it("doesn't render base tag", (finishTest) => {
			_testFunctions.renderBaseTag(page, mockSocket)
				.then(() => {
					expect(mockSocket.toString()).toMatch('');
				}, finishTest.fail)
				.done(finishTest);
		});
	});
});
