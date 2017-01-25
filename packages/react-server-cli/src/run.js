import path from "path";
import chalk from "chalk";
import mergeOptions from "./mergeOptions"
import findOptionsInFiles from "./findOptionsInFiles"
import defaultOptions from "./defaultOptions"
import ConfigurationError from "./ConfigurationError"

/* eslint-disable consistent-return */
export default function run(options = {}) {

	// for the option properties that weren't sent in, look for a config file
	// (either .reactserverrc or a reactServer section in a package.json). for
	// options neither passed in nor in a config file, use the defaults.
	options = mergeOptions(defaultOptions, findOptionsInFiles() || {}, options);

	const {
		routesFile,
		jsUrl,
		jsPort,
		host,
	} = options;

	options.routesPath = path.resolve(process.cwd(), routesFile);
	options.routesDir = path.dirname(options.routesPath);

	try {
		options.routes = require(options.routesPath);
	} catch (e) {
		// Pass. Commands need to check for routes themselves.
	}

	// The non-jsUrl created output URL should be as relative as possible.  '//' ensures that we use the same
	// scheme as the browser, which is important when using a fronting server that terminates HTTPS connections and
	// proxies requests to react-server over HTTP.  Another note, is that `host` should be `0.0.0.0` to make it relative
	// to the hostname being used.
	options.outputUrl = jsUrl || `//${host}:${jsPort}/`;

	try {
		return require("./" + path.join("commands", options.command))(options);
	} catch (e) {
		if (e instanceof ConfigurationError) {
			console.error(chalk.red(e.message));
		} else {
			throw e;
		}
	}
}
