import {events} from "stratocacher";
import {CACHE_NAME} from "./constants";
import {getLogger} from "./logging";

const logger = getLogger();

export default function logEvents() {
	events.on('error', err => logger.error(err));
	events.on('time', ({name, type, time}) => {
		if (name === CACHE_NAME) {
			logger.time(`stats.${type}`, time);
		}
	});
}
