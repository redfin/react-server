import yargs from "yargs"
import fs from "fs"
import pem from "pem"

export default (args = process.argv) => {
	var argsDefinition = yargs(args)
		.usage('Usage: $0 <command> [options]')
		.option("routes-file", {
			type: "string",
			describe: "The routes file to load. Default is 'routes.json'.",
		})
		.option("p", {
			alias: "port",
			describe: "Port to start listening for react-server. Default is 3000.",
			type: "number",
		})
		.option("host", {
			describe: "Hostname to start listening for react-server",
			type: "string",
		})
		.option("js-port", {
			describe: "Port to start listening for react-server's JavaScript. Default is 3001.",
			type: "number",
		})
		.option("https", {
			describe: "If true, the server will start up using https with a self-signed certificate. Note that browsers do not trust self-signed certificates by default, so you will have to click through some warning screens. This is a quick and dirty way to test HTTPS, but it has some limitations and should never be used in production. Requires OpenSSL to be installed. Default is false.",
			default: undefined,
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
			describe: "Load the app so that it can be hot reloaded in the browser. Default is false in production mode, true otherwise.",
			// we use undefined as the default because unlike other types, booleans
			// default to "false", making it impossible to distinguish between not
			// setting the option at the command line and setting --option=false.
			default: undefined,
			type: "boolean",
		})
		.option("m", {
			alias: "minify",
			describe: "Optimize client JS when option is present. Takes a bit longer to compile. Default is true in production mode, false otherwise.",
			default: undefined,
			type: "boolean",
		})
		.option("long-term-caching", {
			describe: "Use long-term cache headers for the static JS & CSS files. Default is true in production mode, false otherwise.",
			default: undefined,
			type: "boolean",
		})
		.option("log-level", {
			describe: "Set the severity level for the logs being reported. Values are, in ascending order of severity: 'debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'. Default is 'notice' in production mode, 'debug' otherwise.",
			type: "string",
		})
		.option("timing-log-level", {
			describe: "Set the severity level for the timing logs. Values are, in ascending order of verbosity: 'none', 'slow', 'fine', 'fast. Default is 'none' in production mode, 'fast' otherwise.",
			type: "string",
		})
		.option("gauge-log-level", {
			describe: "Set the severity level for the gauge logs. Values are, in ascending order of severity: 'no', 'hi', 'lo', 'ok'. Default is 'no' in production mode, 'ok' otherwise.",
			type: "string",
		})
		.option("compile-only", {
			describe: "Compile the client JavaScript only, and don't start any servers. This is what you want to do if you are building the client JavaScript to be hosted on a CDN. Unless you have a very specific reason, it's almost alway a good idea to only do this in production mode. Defaults to false.",
			default: undefined,
			type: "boolean",
		})
		.option("js-url", {
			describe: "A URL base for the pre-compiled client JavaScript. Setting a value for jsurl means that react-server-cli will not compile the client JavaScript at all, and it will not serve up any JavaScript. Obviously, this means that --jsurl overrides all of the options related to JavaScript compilation: --hot, --minify, and --bundleperroute.",
			type: "string",
		})
		.option("stats", {
			describe: "Output webpack stats to __clientTemp/build/stats.json.  Recommended for use with webpack-bundle-size-analyzer.",
			default: false,
			type: "boolean",
		})
		.version(function() {
			return require('../package').version;
		})
		.alias('v', 'version')
		.help('?')
		.alias('?', 'help')
		.demand(0)

	const commands = {
		"start"    : "Start the server",
		"compile"  : "Compile static assets",
		"init"     : "Initialize a React Server site",
		"add-page" : "Add a page to an existing site",
	}

	Object.keys(commands)
		.forEach(k => argsDefinition = argsDefinition.command(k, commands[k]));

	var parsedArgs = argsDefinition.argv;

	parsedArgs.command = parsedArgs._[2];

	if (!commands[parsedArgs.command]) {
		argsDefinition.showHelp();
		if (parsedArgs.command) {
			console.log("Invalid command: " + parsedArgs.command);
		}
		process.exit(1); // eslint-disable-line no-process-exit
	}

	// we remove all the options that have undefined as their value; those are the
	// ones that weren't on the command line, and we don't want them to override
	// defaults or config files.
	return sslize(removeUndefinedValues(parsedArgs));

}

const sslize = async argv => {

	const {
		https,
		httpsKey,
		httpsCert,
		httpsCa,
		httpsPfx,
		httpsPassphrase,
	} = argv;

	if (https || (httpsKey && httpsCert) || httpsPfx) {
		if ((httpsKey && httpsCert) || httpsPfx) {
			argv.httpsOptions = {
				key: httpsKey ? fs.readFileSync(httpsKey) : undefined,
				cert: httpsCert ? fs.readFileSync(httpsCert) : undefined,
				ca: httpsCa ? fs.readFileSync(httpsCa) : undefined,
				pfx: httpsPfx ? fs.readFileSync(httpsPfx) : undefined,
				passphrase: httpsPassphrase,
			};
		} else {
			argv.httpsOptions = await new Promise((resolve, reject) => {
				pem.createCertificate({ days: 1, selfSigned: true }, (err, keys) => {
					if (err) {
						reject(err);
					}
					resolve({ key: keys.serviceKey, cert: keys.certificate });
				});
			});
		}
	} else {
		argv.httpsOptions = false;
	}

	if ((httpsKey || httpsCert || httpsCa) && httpsPfx) {
		throw new Error("If you set https.pfx, you can't set https.key, https.cert, or https.ca.");
	}

	return argv;
}

const removeUndefinedValues = (input) => {
	const result = Object.assign({}, input);

	for (let key of Object.keys(input)) {
		if (result[key] === undefined) {
			delete result[key];
		}
	}

	return result;
}
