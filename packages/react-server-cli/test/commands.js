import path from 'path';
import fs from 'fs';
import readdirSyncRecursive from 'fs-readdir-recursive';
import outputFileSync from 'output-file-sync';
import child_process from 'child_process';
import test from 'ava';
import rimraf from 'rimraf';

const fixturesPath = path.join(__dirname, 'fixtures', 'commands');

fs.readdirSync(fixturesPath).forEach(testName => {
	if (testName[0] === '.') return;

	const [, command, testType] = testName.match(/([^-]+)-(.+)/);

	test(`${command} command: ${testType}`, async t => {
		const testPath = path.join(fixturesPath, testName);
		const tmpPath = path.join(testPath, 'tmp');
		createAndChangeToTempDir(tmpPath);

		if (!Object.entries) {
			// This is for Node 6, which doesn't support Object.entries
			Object.entries = (obj) => {
				const ownProps = Object.keys( obj );
				let i = ownProps.length;
				const resArray = new Array(ownProps.length); // preallocate the Array
				while (i--) {
					resArray[i] = [ownProps[i], obj[ownProps[i]]];
				}

				return resArray;
			};
		}

		// Write files to temporary location
		Object.entries(readDir(path.join(testPath, 'in-files')))
			.forEach(([filename, content]) =>
				outputFileSync(filename, content)
			);

		const {
			args,
			stdoutIncludes,
			stderrIncludes,
		} = JSON.parse(fs.readFileSync(path.join(testPath, 'options.json')));

		const server = child_process.spawn(
			process.execPath,
			[
				path.join(__dirname, '..', 'bin', 'react-server-cli'),
				...args,
			]
		);

		let stdout = '';
		let stderr = '';

		server.stdout.on('data', chunk => stdout += chunk);
		server.stderr.on('data', chunk => stderr += chunk);

		const frequency = 100;
		let elapsed = 0;

		// Wait for the expected output or the timeout
		await new Promise(resolve => {
			const checkForExpectedOutput = setInterval(() => {
				// Increment the elapsed time if neither stdout nor stderr includes the expected content and the time limit hasn't been reached.
				if (
					(
						(stdoutIncludes && !stdout.includes(stdoutIncludes)) ||
						(stderrIncludes && !stderr.includes(stderrIncludes))
					) &&
					elapsed < frequency * 10 // need enough time for webpack to compile on startup
				) {
					elapsed += frequency;
					return;
				}

				clearInterval(checkForExpectedOutput);
				resolve();
			}, frequency);
		});

		t.true(testStdOutput(stderr, stderrIncludes), 'stderr does not include expected output.  Instead, it says: ' + stderr);
		t.true(testStdOutput(stdout, stdoutIncludes), 'stdout does not include expected output.  Instead, it says: ' + stdout);

		server.kill();

		// Remove temporary directory after the test
		rimraf.sync(tmpPath);
	});
});

//Test the output to stderr or stdout against an approved message.
//Ignore messages that start with "Warning:"
function testStdOutput(stdOutput, includes) {
	//Ignore warning messages
	if (stdOutput.startsWith("Warning:")) {
		return true;
	}
	if (includes && stdOutput.includes(includes)) {
		return true;
	}
	return !stdOutput;
}

function createAndChangeToTempDir(tmpPath){
	if (fs.existsSync(tmpPath)) rimraf.sync(tmpPath);
	fs.mkdirSync(tmpPath);
	process.chdir(tmpPath);
}

function noDotDirectory(x){
	return x !== '.';
}

function readDir(dirPath){
	const files = {};
	if (fs.existsSync(dirPath)) {
		readdirSyncRecursive(dirPath, noDotDirectory).forEach(filename => {
			files[filename] = fs.readFileSync(path.join(dirPath, filename));
		});
	}
	return files;
};
