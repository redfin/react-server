import compileClient from "../compileClient"
import callerDependency from "../callerDependency";
import handleCompilationErrors from "../handleCompilationErrors";

const reactServer = require(callerDependency("react-server"));

const logger = reactServer.logging.getLogger(__LOGGER__);

export default function compile(options){
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
