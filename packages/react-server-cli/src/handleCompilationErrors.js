import {logging} from "./react-server";

const logger = logging.getLogger(__LOGGER__);

export default function handleCompilationErrors (err, stats){
	if (err) {
		logger.error("Error during webpack build.");
		logger.error(err);
		return new Error(err);
		
	} else if (stats && stats.hasErrors()) {
		console.error("There were errors in the JavaScript compilation.");
		stats.toJson().errors.forEach((error) => {
			console.error(error);
		});
		return new Error("There were errors in the JavaScript compilation.");
	} else if (stats && stats.hasWarnings()) {
		logger.warning("There were warnings in the JavaScript compilation. Note that this is normal if you are minifying your code.");
	return null;
}


