import callerDependency from "../callerDependency";

const reactServer = require(callerDependency("react-server"));

const logger = reactServer.logging.getLogger(__LOGGER__);

export default function compile(){
	logger.notice("Coming soon!");
}
