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
