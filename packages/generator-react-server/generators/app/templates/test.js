import cp from 'child_process';
import http from 'http';
import test from 'ava';

let rs;

test.before('start the server', async () => {
	const stdout = await exec('npm run compile');
	console.log(stdout);
	rs = cp.spawn('npm', ['start']);
	rs.stderr.on('data', data => console.error(`ERR: ${data}`));
	await sleep(10000);
});

test('server is running', async t => {
	t.is(200, await getResponseCode('/'));
});

test.after.always('shut down the server', async () => {
	rs.kill('SIGHUP');
});

// runs a command asynchronously
function exec(cmd, opts = {maxBuffer: 1024 * 100000}) {
	return new Promise((resolve, reject) => {
		cp.exec(cmd, opts, (error, stdout, stderr) => {
			if (error) {
				console.error(stderr);
				reject(error);
				return;
			}
			resolve(stdout);
		});
	});
}

// gets the response code for an http request
function getResponseCode(url) {
	return new Promise((resolve, reject) => {
		const req = http.get({
			hostname: 'localhost',
			port: 3010,
			path: url
		}, res => {
			resolve(res.statusCode);
		});
		req.on('error', e => reject(e));
	});
}

function sleep(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
}
