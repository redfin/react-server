import reactServer from "./react-server";

const logger = reactServer.logging.getLogger(__LOGGER__);

export default function logProductionWarnings({hot, minify, jsUrl, longTermCaching}){
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
