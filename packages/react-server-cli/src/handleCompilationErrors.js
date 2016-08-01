import callerDependency from "./callerDependency";

const reactServer = require(callerDependency("react-server"));

const logger = reactServer.logging.getLogger(__LOGGER__);

// takes in the err and stats object returned by a webpack compilation and returns
// an error object if something serious happened, or null if things are ok.
export default function handleCompilationErrors (err, stats){
	if (err) {
		logger.error("Error during webpack build.");
		logger.error(err);
		return new Error(err);
		// TODO: inspect stats to see if there are errors -sra.
	} else if (stats.hasErrors()) {
		console.error("There were errors in the JavaScript compilation.");
		stats.toJson().errors.forEach((error) => {
			console.error(error);
		});
		return new Error("There were errors in the JavaScript compilation.");
	} else if (stats.hasWarnings()) {
		logger.warning("There were warnings in the JavaScript compilation. Note that this is normal if you are minifying your code.");
		// for now, don't enumerate warnings; they are absolutely useless in minification mode.
		// TODO: handle this more intelligently, perhaps with a --reportwarnings flag or with different
		// behavior based on whether or not --minify is set.
	}
	return null;
}


