import cp from 'child_process';
import fs from 'fs';
import path from 'path';
import test from 'ava';
import helpers from 'yeoman-test';

test('generator-react-server:app creates files', async t => {
	let testDir;
	await helpers.run(path.join(__dirname, '../generators/app'))
		.inTmpDir(dir => {
			testDir = dir;
		})
		.withPrompts({name: 'foo'})
		.toPromise();
	t.true(await exists('.babelrc', testDir));
	t.true(await exists('.gitignore', testDir));
	t.true(await exists('hello-world-page.js', testDir));
	t.true(await exists('hello-world.js', testDir));
	t.true(await exists('package.json', testDir));
	t.true(await exists('README.md', testDir));
	t.true(await exists('routes.js', testDir));
});

test('generator-react-server:app passes the test target', async t => {
	let testDir;
	await helpers.run(path.join(__dirname, '../generators/app'))
		.inTmpDir(dir => {
			testDir = dir;
		})
		.withPrompts({name: 'foo'})
		.toPromise();
	await installDeps();
	t.true(await runsSuccessfully('npm test'));
});

async function exists(filename, dir) {
	filename = path.join(dir, filename);
	return new Promise((resolve) => {
		fs.access(filename, fs.F_OK, (err) => {
			resolve(!err);
		});
	});
}

async function runsSuccessfully(command) {
	return new Promise((resolve) => {
		cp.exec(command, (error) => {
			resolve(!error);
		})
	});
}

async function installDeps() {
	return new Promise((resolve) => {
		cp.exec('npm install', (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		})
	});
}
