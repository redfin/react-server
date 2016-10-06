import test from 'ava';
import defaultOptions from '../src/defaultOptions';
import parseCliArgs from '../src/parseCliArgs';

const defaultArgs = ['/usr/local/bin/node', '/usr/local/bin/react-server'];

// routesFile options can be modified using --routes-file argument
test('react-server-cli:parseCliArgs::routesFile can be modified using --routes-file flag', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'--routes-file',
  		'customRoutes.js'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(parsedArgs.routesFile, 'customRoutes.js', 'routesFile option is customRoutes.js');
});

// routesFile options can be modified using --routesFile argument
test('react-server-cli:parseCliArgs::routesFile can be modified using --routesFile flag', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'--routesFile',
  		'customRoutes.js'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(parsedArgs.routesFile, 'customRoutes.js', 'routesFile option is customRoutes.js');
});


// **** port ****
// port will be undefined if no argument is provided
test('react-server-cli:parseCliArgs::port will be undefined if no argument is provided', async t => {
	const args = [
		...defaultArgs,
  		'compile'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(parsedArgs.port, undefined, 'port is undefined if no argument is provided');
});

// port option can be modified using --port argument
test('react-server-cli:parseCliArgs::port option can be modified using --port argument', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'--port',
  		'8080'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(typeof parsedArgs.port, 'number', 'port is a number');
  	t.is(parsedArgs.port, 8080, 'port is 8080');
  	t.true(Object.keys(defaultOptions).indexOf('port') > -1, 'port key exists in defaultOptions');
});

// port option can be modified using -p argument
test('react-server-cli:parseCliArgs::port option can be modified using -p argument', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'-p',
  		'8080'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(typeof parsedArgs.port, 'number', 'port is a number');
  	t.is(parsedArgs.port, 8080, 'port is 8080');
  	t.true(Object.keys(defaultOptions).indexOf('port') > -1, 'port key exists in defaultOptions');
});


// **** host ****
// host will be undefined if no argument is provided
test('react-server-cli:parseCliArgs::host will be undefined if no argument is provided', async t => {
	const args = [
		...defaultArgs,
  		'compile'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(parsedArgs.host, undefined, 'host is undefined if no argument is provided');
});

// host option can be modified using --host argument
test('react-server-cli:parseCliArgs::host option can be modified using --host argument', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'--host',
  		'www.myhost.dev'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(parsedArgs.host, 'www.myhost.dev', 'host is www.myhost.dev');
  	t.true(Object.keys(defaultOptions).indexOf('host') > -1, 'host key exists in defaultOptions');
});


// **** js-port ****
// jsPort will be undefined if no argument is provided
test('react-server-cli:parseCliArgs::jsPort will be undefined if no argument is provided', async t => {
	const args = [
		...defaultArgs,
  		'compile'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(parsedArgs.jsPort, undefined, 'jsPort is undefined if no argument is provided');
});

// jsPort options can be modified using --js-port argument
test('react-server-cli:parseCliArgs::jsPort can be modified using --js-port flag', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'--js-port',
  		'8081'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(typeof parsedArgs.jsPort, 'number', 'jsPort is a number');
  	t.is(parsedArgs.jsPort, 8081, 'jsPort option is 8081');
  	t.true(Object.keys(defaultOptions).indexOf('jsPort') > -1, 'jsPort key exists in defaultOptions');
});

// jsPort options can be modified using --jsPort argument
test('react-server-cli:parseCliArgs::jsPort can be modified using --jsPort flag', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'--jsPort',
  		'8081'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(typeof parsedArgs.jsPort, 'number', 'jsPort is a number');
  	t.is(parsedArgs.jsPort, 8081, 'jsPort option is 8081');
  	t.true(Object.keys(defaultOptions).indexOf('jsPort') > -1, 'jsPort key exists in defaultOptions');
});


// **** httpsOptions ****
// httpsOptions always exists in parsed cli arguments
test('react-server-cli:parseCliArgs::httpsOptions defaults to false', async t => {
	const args = [
		...defaultArgs,
  		'compile'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(parsedArgs.httpsOptions, false, 'Default httpsOptions is false');
});

// httpsOptions will be false if https is false
test('react-server-cli:parseCliArgs::httpsOptions will be false if https is false', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'--https',
  		'false'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(parsedArgs.httpsOptions, false, 'httpsOptions is false if https is false');
});

// httpsOptions will be an object with two keys; key and cert, if option flag https is set
test('react-server-cli:parseCliArgs::httpsOptions will be an object with two keys; key and cert', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'--https',
  		'true'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(typeof parsedArgs.httpsOptions, 'object', 'httpsOptions is an object');
  	t.is(typeof parsedArgs.httpsOptions.key, 'string', 'httpsOptions property key is a string');
  	t.is(typeof parsedArgs.httpsOptions.cert, 'string', 'httpsOptions property cert is a string');
  	t.is(parsedArgs.httpsOptions.key.slice(0,31), '-----BEGIN RSA PRIVATE KEY-----', 'httpsOptions property key is a RSA private key');
  	t.is(parsedArgs.httpsOptions.cert.slice(0,27), '-----BEGIN CERTIFICATE-----', 'httpsOptions property cert is a https certificate');
});

// httpsOptions will be an object containing key, cert, ca, pfx, and passphrase if --https-key and --https-cert is provided as an argument
test('react-server-cli:parseCliArgs::httpsOptions will be an object containing key, cert, ca, pfx, and passphrase if --https-key and --https-cert is provided as an argument', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'--https-key',
  		'../.babelrc',
  		'--https-cert',
  		'../.babelrc'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(parsedArgs.httpsKey, '../.babelrc', 'httpsKey is ../.babelrc');
  	t.is(parsedArgs.httpsCert, '../.babelrc', 'httpsCert is ../.babelrc');

  	t.is(typeof parsedArgs.httpsOptions, 'object', 'httpsOptions is an object');
  	t.true(Buffer.isBuffer(parsedArgs.httpsOptions.key), 'httpsOptions property key is a buffer from reading a file');
  	t.true(Buffer.isBuffer(parsedArgs.httpsOptions.cert), 'httpsOptions property cert is a buffer from reading a file');
  	t.is(typeof parsedArgs.httpsOptions.ca, 'undefined', 'httpsOptions property ca is undefined');
  	t.is(typeof parsedArgs.httpsOptions.pfx, 'undefined', 'httpsOptions property pfx is undefined');
  	t.is(typeof parsedArgs.httpsOptions.passphrase, 'undefined', 'httpsOptions property passphrase is undefined');
});


// **** hot ****
// hot will be undefined if no argument is provided
test('react-server-cli:parseCliArgs::hot will be undefined if no argument is provided', async t => {
	const args = [
		...defaultArgs,
  		'compile'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(parsedArgs.hot, undefined, 'hot is undefined if no argument is provided');
});

// hot option can be turned on using --hot argument
test('react-server-cli:parseCliArgs::hot option can be turned on using --hot argument', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'--hot'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(typeof parsedArgs.hot, 'boolean', 'hot is true');
  	t.is(parsedArgs.hot, true, 'hot is true');
  	t.true(Object.keys(defaultOptions).indexOf('hot') > -1, 'hot key exists in defaultOptions');
});

// hot option can be turned on using -h argument
test('react-server-cli:parseCliArgs::hot option can be turned on using -h argument', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'-h'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(typeof parsedArgs.hot, 'boolean', 'hot is true');
  	t.is(parsedArgs.hot, true, 'hot is true');
  	t.true(Object.keys(defaultOptions).indexOf('hot') > -1, 'hot key exists in defaultOptions');
});


// **** minify ****
// minify will be undefined if no argument is provided
test('react-server-cli:parseCliArgs::minify will be undefined if no argument is provided', async t => {
	const args = [
		...defaultArgs,
  		'compile'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(parsedArgs.minify, undefined, 'minify is undefined if no argument is provided');
});

// minify option can be turned on using --minify argument
test('react-server-cli:parseCliArgs::minify option can be turned on using --minify argument', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'--minify'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(typeof parsedArgs.minify, 'boolean', 'minify is true');
  	t.is(parsedArgs.minify, true, 'minify is true');
  	t.true(Object.keys(defaultOptions).indexOf('minify') > -1, 'minify key exists in defaultOptions');
});

// minify option can be turned on using -m argument
test('react-server-cli:parseCliArgs::minify option can be turned on using -m argument', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'-m'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(typeof parsedArgs.minify, 'boolean', 'minify is true');
  	t.is(parsedArgs.minify, true, 'minify is true');
  	t.true(Object.keys(defaultOptions).indexOf('minify') > -1, 'minify key exists in defaultOptions');
});


// **** longTermCaching ****
// longTermCaching will be undefined if no argument is provided
test('react-server-cli:parseCliArgs::longTermCaching will be undefined if no argument is provided', async t => {
	const args = [
		...defaultArgs,
  		'compile'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(parsedArgs.longTermCaching, undefined, 'longTermCaching is undefined if no argument is provided');
});

// longTermCaching option can be turned on using --longTermCaching argument
test('react-server-cli:parseCliArgs::longTermCaching option can be turned on using --longTermCaching argument', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'--longTermCaching'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(typeof parsedArgs.longTermCaching, 'boolean', 'longTermCaching is true');
  	t.is(parsedArgs.longTermCaching, true, 'longTermCaching is true');
  	t.true(Object.keys(defaultOptions).indexOf('longTermCaching') > -1, 'longTermCaching key exists in defaultOptions');
});

// longTermCaching option can be turned on using --long-term-caching argument
test('react-server-cli:parseCliArgs::longTermCaching option can be turned on using --long-term-caching argument', async t => {
	const args = [
		...defaultArgs,
  		'compile',
  		'--long-term-caching'
  	];
  	const parsedArgs = await parseCliArgs(args);
  	t.is(typeof parsedArgs.longTermCaching, 'boolean', 'longTermCaching is true');
  	t.is(parsedArgs.longTermCaching, true, 'longTermCaching is true');
  	t.true(Object.keys(defaultOptions).indexOf('longTermCaching') > -1, 'longTermCaching key exists in defaultOptions');
});




