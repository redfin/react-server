import parseCliArgs from "./parseCliArgs"
import {start} from "."

// returns true if there are any options sent to react-server-cli
const usesCustomArgs = () => {
	for (let arg of process.argv) {
		if (arg.length > 0 && arg.charAt(0) === "-") {
			return true;
		}
	}
	return false;
}

const argv = parseCliArgs();

if (usesCustomArgs()) {
	start(argv.routes, argv);
} else {
	start(argv.routes);
}
