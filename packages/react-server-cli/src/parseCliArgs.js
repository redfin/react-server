import yargs from "yargs"

export default (isProduction, args = process.argv) => {
	var parsedArgs = yargs(args)
		.usage('Usage: $0 [options]')
		.option("routes", {
			default: "./routes.js",
			describe: "The routes file to load.",
		})
		.option("p", {
			alias: "port",
			default: 3000,
			describe: "Port to start listening for react-server",
			type: "number",
		})
		.option("host", {
			default: "localhost",
			describe: "Hostname to start listening for react-server",
			type: "string",
		})
		.option("js-port", {
			default: 3001,
			describe: "Port to start listening for react-server's JavaScript",
			type: "number",
		})
		.option("https", {
			default: false,
			describe: "If true, the server will start up using https with a self-signed certificate. Note that browsers do not trust self-signed certificates by default, so you will have to click through some warning screens. This is a quick and dirty way to test HTTPS, but it has some limitations and should never be used in production. Requires OpenSSL to be installed. Default is false.",
			type: "boolean",
		})
		.option("https-key", {
			describe: "Start the server using HTTPS with this private key file in PEM format. Requires https-cert to be set as well. Default is none.",
			type: "string",
		})
		.option("https-cert", {
			describe: "Start the server using HTTPS with this cert file in PEM format. Requires https-key to be set as well. Default is none.",
			type: "string",
		})
		.option("https-ca", {
			describe: "Start the server using HTTPS with this certificate authority file in PEM format. Also requires https-key and https-cert to start the server. Default is none.",
			type: "string",
		})
		.option("https-pfx", {
			describe: "Start the server using HTTPS with this file containing the private key, certificate and CA certs of the server in PFX or PKCS12 format. Mutually exclusive with https-key, https-cert, and https-ca. Default is none.",
			type: "string",
		})
		.option("https-passphrase", {
			describe: "A passphrase for the private key or pfx. Requires https-key or https-pfx to be set. Default is none.",
			type: "string",
		})
		.option("h", {
			alias: "hot",
			default: !isProduction,
			describe: "Load the app so that it can be hot reloaded in the browser. Default is false in production mode, true otherwise.",
			type: "boolean",
		})
		.option("m", {
			alias: "minify",
			default: isProduction,
			describe: "Optimize client JS when option is present. Takes a bit longer to compile. Default is true in production mode, false otherwise.",
			type: "boolean",
		})
		.option("log-level", {
			default: isProduction ? "notice" : "debug",
			describe: "Set the severity level for the logs being reported. Values are, in ascending order of severity: 'debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'. Default is 'notice' in production mode, 'debug' otherwise.",
			type: "string",
		})
		.option("compile-only", {
			default: false,
			describe: "Compile the client JavaScript only, and don't start any servers. This is what you want to do if you are building the client JavaScript to be hosted on a CDN. Unless you have a very specific reason, it's almost alway a good idea to only do this in production mode. Defaults to false.",
			type: "boolean",
		})
		.option("js-url", {
			describe: "A URL base for the pre-compiled client JavaScript. Setting a value for jsurl means that react-server-cli will not compile the client JavaScript at all, and it will not serve up any JavaScript. Obviously, this means that --jsurl overrides all of the options related to JavaScript compilation: --hot, --minify, and --bundleperroute.",
			type: "string",
		})
		.option("production", {
			default: false,
			describe: "Forces production mode. If this is not set (or set to false), the CLI falls back to NODE_ENV to determine what mode we are in. Note that production mode only affects the default settings for other options; individual options can still be overridden by setting them directly.",
			type: "boolean",
		})
		.help('?')
		.alias('?', 'help')
		.demand(0)
		.argv;

	return camelize(parsedArgs);
}

const camelize = (input) => {
	const inputCopy = Object.assign({}, input)

	const replaceFn = (match, character) => { return character.toUpperCase() }
	for (let key in Object.keys(inputCopy)) {
		if (key.indexOf("-") !== -1) {
			const newKey = key.replace(/-(.)/g, replaceFn);
			inputCopy[newKey] = inputCopy[key];
			delete inputCopy[key];
		}
	}

	return inputCopy;
}
