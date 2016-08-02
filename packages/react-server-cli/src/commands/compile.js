import compileClient from "../compileClient"
import handleCompilationErrors from "../handleCompilationErrors";
import setupLogging from "../setupLogging";
import logProductionWarnings from "../logProductionWarnings";

const logger = require("react-server").logging.getLogger(__LOGGER__);

export default function compile(options){
	setupLogging(options);
	logProductionWarnings(options);

	const {compiler} = compileClient(options);

	logger.notice("Starting compilation of client JavaScript...");
	compiler.run((err, stats) => {
		const error = handleCompilationErrors(err, stats);
		if (!error) {
			logger.notice("Successfully compiled client JavaScript.");
		} else {
			logger.error(error);
		}
	});
}
