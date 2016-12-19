import handleCompilationErrors from "../handleCompilationErrors";
import setupLogging from "../setupLogging";
import logProductionWarnings from "../logProductionWarnings";
import {logging} from "../react-server";
import buildWebpackConfigs from "../buildWebpackConfigs";
import buildWebpackCompilers from "../buildWebpackCompilers";

const logger = logging.getLogger(__LOGGER__);

export default function compile(options){
	setupLogging(options);
	logProductionWarnings(options);


	const {finalClientWebpackConfig, finalServerWebpackConfig, pathInfo} = buildWebpackConfigs(options);
	const {serverRoutes, clientCompiler, serverCompiler} = buildWebpackCompilers(options, finalClientWebpackConfig, finalServerWebpackConfig, pathInfo);

	const compiledClientPromise = new Promise((resolve) => clientCompiler.plugin("done", () => resolve()));
	const compiledServerPromise = new Promise((resolve) => serverCompiler.plugin("done", () => resolve()));

	logger.notice("Starting compilation of client JavaScript...");
	clientCompiler.run((err, stats) => {
		const error = handleCompilationErrors(err, stats);
		if (!error) {
			logger.notice("Successfully compiled client JavaScript.");
		} else {
			logger.error(error);
		}
	});
	Promise.all([compiledClientPromise, compiledServerPromise]);
}
