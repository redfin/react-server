import cp from 'child_process';
import fs from 'fs';
import path from 'path';
import test from 'ava';
import helpers from 'yeoman-test';

test('generator-react-server:app creates default files', async t => {
	let testDir;
	await helpers.run(path.join(__dirname, '../generators/app'))
		.inTmpDir(dir => {
			testDir = dir;
		})
		.withPrompts({name: 'foo', dockerCfg: false})
		.toPromise();
	t.true(await exists('.babelrc', testDir));
	t.true(await exists('.gitignore', testDir));
	t.true(await exists('.reactserverrc', testDir));
	t.true(await exists('components/hello-world.js', testDir));
	t.true(await exists('pages/hello-world.js', testDir));
	t.true(await exists('package.json', testDir));
	t.true(await exists('README.md', testDir));
	t.true(await exists('routes.js', testDir));
	t.false(await exists('Dockerfile', testDir));
	t.false(await exists('docker-compose.yml', testDir));
});

test('generator-react-server:app creates docker files', async t => {
	let testDir;
	await helpers.run(path.join(__dirname, '../generators/app'))
		.inTmpDir(dir => {
			testDir = dir;
		})
		.withPrompts({name: 'foo', dockerCfg: true})
		.toPromise();
	t.true(await exists('.babelrc', testDir));
	t.true(await exists('.gitignore', testDir));
	t.true(await exists('.reactserverrc', testDir));
	t.true(await exists('components/hello-world.js', testDir));
	t.true(await exists('pages/hello-world.js', testDir));
	t.true(await exists('package.json', testDir));
	t.true(await exists('README.md', testDir));
	t.true(await exists('routes.js', testDir));
	t.true(await exists('Dockerfile', testDir));
	t.true(await exists('docker-compose.yml', testDir));
});

test('generator-react-server:app passes the test target', async t => {
	let testDir;
	await helpers.run(path.join(__dirname, '../generators/app'))
		.inTmpDir(dir => {
			testDir = dir;
		})
		.withPrompts({name: 'foo', dockerCfg: false})
		.toPromise();
	await installDeps();
	t.true(await runsSuccessfully('npm test', testDir));
});

function exists(filename, dir) {
	filename = path.join(dir, filename);
	return new Promise((resolve) => {
		fs.access(filename, fs.F_OK, (err) => {
			resolve(!err);
		});
	});
}

function runsSuccessfully(command, dir) {
	return new Promise((resolve) => {
		cp.exec(command, {
			cwd: dir,
		}, (error, stdout, stderr) => {
			if (error) {
				console.error(error);
				console.error(stdout);
				console.error(stderr);
			}
			resolve(!error);
		});
	});
}

function installDeps() {
	return new Promise((resolve, reject) => {
		cp.exec('npm install', (error) => {
			if (error) {
				reject(error);
			} else {
				const localDeps = ['react-server-cli', 'react-server']
					.map(dep => path.resolve(path.join(__dirname, '../..', dep)));
				cp.exec('npm install ' + localDeps.join(' '), (error) => {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				});
			}
		});
	});
}
