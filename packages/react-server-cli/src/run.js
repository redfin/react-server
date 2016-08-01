import path from "path";
import mergeOptions from "./mergeOptions"
import findOptionsInFiles from "./findOptionsInFiles"
import defaultOptions from "./defaultOptions"
import callerDependency from "./callerDependency";

const reactServer = require(callerDependency("react-server"));

const logger = reactServer.logging.getLogger(__LOGGER__);

export default function run(options = {}) {

	// for the option properties that weren't sent in, look for a config file
	// (either .reactserverrc or a reactServer section in a package.json). for
	// options neither passed in nor in a config file, use the defaults.
	options = mergeOptions(defaultOptions, findOptionsInFiles() || {}, options);

	setupLogging(options.logLevel, options.timingLogLevel, options.gaugeLogLevel);
	logProductionWarnings(options);

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

	return require("./" + path.join("commands", options.command)).default(options);
}

const setupLogging = (logLevel, timingLogLevel, gaugeLogLevel) => {
	reactServer.logging.setLevel('main',  logLevel);
	reactServer.logging.setLevel('time',  timingLogLevel);
	reactServer.logging.setLevel('gauge', gaugeLogLevel);
}

const logProductionWarnings = ({hot, minify, jsUrl, longTermCaching}) => {
	// if the server is being launched with some bad practices for production mode, then we
	// should output a warning. if arg.jsurl is set, then hot and minify are moot, since
	// we aren't serving JavaScript & CSS at all.
	if ((!jsUrl && (hot || !minify)) ||  process.env.NODE_ENV !== "production" || !longTermCaching) { //eslint-disable-line no-process-env
		logger.warning("PRODUCTION WARNING: the following current settings are discouraged in production environments. (If you are developing, carry on!):");
		if (hot) {
			logger.warning("-- Hot reload is enabled. To disable, set hot to false (--hot=false at the command-line) or set NODE_ENV=production.");
		}

		if (!minify) {
			logger.warning("-- Minification is disabled. To enable, set minify to true (--minify at the command-line) or set NODE_ENV=production.");
		}

		if (!longTermCaching) {
			logger.warning("-- Long-term caching is disabled. To enable, set longTermCaching to true (--long-term-caching at the command-line) or set NODE_ENV=production to turn on.");
		}
		logger.info(`NODE_ENV is set to ${process.env.NODE_ENV}`); //eslint-disable-line no-process-env
	}

}
