import fs from 'fs';
import path from 'path';
import helper from '../../specRuntime/testHelper';

describe('A basic page', () => {
	const httpsOptions = {
		key: fs.readFileSync(path.join(__dirname, 'key.pem')),
		cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
	};

	describe('served using http', () => {
		helper.startServerBeforeAll(__filename, [
			'./HelloWorldPage',
		]);

		helper.stopServerAfterAll();

		helper.testWithDocument("/helloWorld", (document) => {
			expect(document.querySelector("div#foo").innerHTML).toMatch("Hello, world!");
		});
	});

	describe('served using https', () => {
		helper.startServerBeforeAll(__filename, [
			'./HelloWorldPage',
		], httpsOptions);

		helper.stopServerAfterAll();

		helper.testWithDocument("/helloWorld", (document) => {
			expect(document.querySelector("div#foo").innerHTML).toMatch("Hello, world!");
		});
	});
});
