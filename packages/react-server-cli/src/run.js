import path from "path";
import chalk from "chalk";
import mergeOptions from "./mergeOptions"
import findOptionsInFiles from "./findOptionsInFiles"
import defaultOptions from "./defaultOptions"
import ConfigurationError from "./ConfigurationError"

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
		httpsOptions,
	} = options;

	options.routesPath = path.resolve(process.cwd(), routesFile);
	options.routesDir = path.dirname(options.routesPath);

	try {
		options.routes = require(options.routesPath);
	} catch (e) {
		// Pass. Commands need to check for routes themselves.
	}

	options.outputUrl = jsUrl || `${httpsOptions ? "https" : "http"}://${host}:${jsPort}/`;

	try {
		require("./" + path.join("commands", options.command)).default(options);
	} catch (e) {
		if (e instanceof ConfigurationError) {
			console.error(chalk.red(e.message));
		} else {
			throw e;
		}
	}
}
