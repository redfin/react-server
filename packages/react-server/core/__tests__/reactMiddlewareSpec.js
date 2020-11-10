const MemoryStream = require('memory-stream');

import { _testFunctions } from "../renderMiddleware";
import PageUtil from "../util/PageUtil";

import NullValuesPage from "./NullValuesPage";
import NullValuePromisesPage from "./NullValuePromisesPage";
import NormalValuesPage from "./NormalValuesPage";

describe("renderMiddleware", () => {
	let mockSocket,
		page;

	describe("null values", () => {
		beforeAll(() => {
			page = PageUtil.createPageChain(NullValuesPage);
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
					expect(mockSocket.toString()).toBe('');
				}, finishTest.fail)
				.done(finishTest);
		});

		it("don't render link tags", (finishTest) => {
			_testFunctions.renderLinkTags(page, mockSocket)
				.then(() => {
					expect(mockSocket.toString()).toBe('');
				}, finishTest.fail)
				.done(finishTest);
		});

		it("doesn't render base tag", (finishTest) => {
			_testFunctions.renderBaseTag(page, mockSocket)
				.then(() => {
					expect(mockSocket.toString()).toBe('');
				}, finishTest.fail)
				.done(finishTest);
		});
	});

	describe("promises with null values", () => {
		beforeAll(() => {
			page = PageUtil.createPageChain(NullValuePromisesPage);
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
					expect(mockSocket.toString()).toBe('');
				}, finishTest.fail)
				.done(finishTest);
		});

		it("don't render link tags", (finishTest) => {
			_testFunctions.renderLinkTags(page, mockSocket)
				.then(() => {
					expect(mockSocket.toString()).toBe('');
				}, finishTest.fail)
				.done(finishTest);
		});

		it("doesn't render base tag", (finishTest) => {
			_testFunctions.renderBaseTag(page, mockSocket)
				.then(() => {
					expect(mockSocket.toString()).toBe('');
				}, finishTest.fail)
				.done(finishTest);
		});
	});

	describe("good values", () => {
		beforeAll(() => {
			page = PageUtil.createPageChain(NormalValuesPage);
		});

		beforeEach(() => {
			mockSocket = new MemoryStream();
		});

		afterEach(() => {
			mockSocket = null;
		});

		it("render a single meta tag", (finishTest) => {
			_testFunctions.renderMetaTags(page, mockSocket)
				.then(() => {
					expect(mockSocket.toString()).toBe('<meta charset="utf8">');
				}, finishTest.fail)
				.done(finishTest);
		});

		it("render a single link tags", (finishTest) => {
			_testFunctions.renderLinkTags(page, mockSocket)
				.then(() => {
					expect(mockSocket.toString()).toBe('<link data-react-server-link rel="prefetch" href="//www.google-analytics.com">');
				}, finishTest.fail)
				.done(finishTest);
		});

		it("render a base tag", (finishTest) => {
			_testFunctions.renderBaseTag(page, mockSocket)
				.then(() => {
					expect(mockSocket.toString()).toBe('<base href="//www.google.com">');
				}, finishTest.fail)
				.done(finishTest);
		});
	});
});
