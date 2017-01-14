import fs from "fs";
const MemoryStream = require('memory-stream');
import path from "path";

import { writeWebpackCompatibleRoutesFile } from "../../compileClient";

describe("compileClient", () => {
	let mockFs;

	describe("writes client routes file for Webpack", () => {
		const pathStringTests = [
			{
				title: "apostrophes",
				path: "PathWith'InIt.js",
			},
			{
				title: "double quotes",
				path: 'PathWith"InIt.js',
			},
			{
				title: "windows style",
				path: 'c:\\Path\\With\\InIt.js',
			},
			{
				title: "spaces",
				path: 'Path With Spaces.js',
			},
		];

		beforeEach(() => {
			mockFs = new MemoryStream();
		});

		afterEach(() => {
			mockFs = null;
		});

		pathStringTests.map((test) => {
			it("handles file paths with " + test.title, (finishTest) => {
				spyOn(fs, 'writeFileSync').and.callFake((path, data) => {
					mockFs.write(data);
				});

				const filePath = test.path;
				const routes = {
					"routes": {
						"Homepage": {
							"path": "/",
							"page": filePath,
						},
					},
				};

				writeWebpackCompatibleRoutesFile(routes, ".", path.normalize("."), null, true, null);

				const coreMiddlewareStringified = JSON.stringify(require.resolve("react-server-core-middleware"));
				const filePathStringified = JSON.stringify(filePath);
				const filePathRegexStrings = [
					"var coreJsMiddleware = require(" + coreMiddlewareStringified + ").coreJsMiddleware;",
					"var coreCssMiddleware = require(" + coreMiddlewareStringified + ").coreCssMiddleware;",
					"require.ensure(" + filePathStringified + ", function() {",
					"cb(unwrapEs6Module(require(" + filePathStringified + ")));",
				];

				const fileData = mockFs.toString();
				filePathRegexStrings.map((regex) => {
					expect(fileData).toMatch(regex.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
				});

				finishTest();
			});
		});
	});
});
