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

	let webpackInfo = buildWebpackConfigs(options);
	webpackInfo = buildWebpackCompilers(options, webpackInfo);
	webpackInfo.client.compiledPromise = new Promise((resolve) => webpackInfo.client.compiler.plugin("done", () => resolve()));
	webpackInfo.server.compiledPromise = new Promise((resolve) => webpackInfo.server.compiler.plugin("done", () => resolve()));

	logger.notice("Starting compilation of client and server JavaScript...");
	webpackInfo.client.compiler.run((err, stats) => {
		const error = handleCompilationErrors(err, stats);
		if (!error) {
			logger.notice("Successfully compiled client and server JavaScript.");
		} else {
			logger.error(error);
		}
	});
	Promise.all([webpackInfo.client.compiledPromise, webpackInfo.server.compiledPromise]);
}
