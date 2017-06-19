import cp from 'child_process';
import http from 'http';
import test from 'ava';

let rs;

test.before('start the server', async () => {
	rs = cp.spawn('npm', ['start']);
	rs.stderr.on('data', data => console.error(data.toString()));
	rs.stdout.on('data', data => console.log(data.toString()));
	await sleep(15000);
});

test('server is running', async t => {
	t.is(200, await getResponseCode('/'));
});

test.after.always('shut down the server', async () => {
	rs.kill('SIGHUP');
});

// gets the response code for an http request
function getResponseCode(url) {
	return new Promise((resolve, reject) => {
		const req = http.get({
			hostname: 'localhost',
			port: 3000,
			path: url,
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
