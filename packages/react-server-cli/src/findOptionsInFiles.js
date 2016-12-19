// implements the search algorithm for finding react-server config files. see
// the README.md for a description.
import path from "path"
import fs from "fs"

const REACT_SERVER_RC = ".reactserverrc";
const PACKAGE_JSON = "package.json";

// returns an options object that represents the **first** config file found in the
// search path. if none are found, returns null.
// as described in the README, this method starts at dir, and for each directory
// looks first for a .reactserverrc file, then for a "reactServer" section of
// the package.json. if it finds neither, it goes up a directory and looks again.
// it returns the contents of the first config file found; it never merges multiple
// configurations.
export default (dir = process.cwd()) => {
	let options = null;

	do {
		let reactServerRc = null;
		try {
			// readFileSync throws if the file doesn't exist.
			reactServerRc = fs.readFileSync(path.join(dir, REACT_SERVER_RC));
		} catch (e) {} //eslint-disable-line no-empty
		if (reactServerRc) {
			options = JSON.parse(reactServerRc);
			break;
		}

		let packageJson = null;
		try {
			packageJson = fs.readFileSync(path.join(dir, PACKAGE_JSON));
		} catch (e) {} //eslint-disable-line no-empty

		if (packageJson) {
			const parsedPackageJson = JSON.parse(packageJson);
			if (parsedPackageJson.reactServer) {
				options = parsedPackageJson.reactServer;
				break;
			}
		}
	} while (dir !== (dir = path.dirname(dir)));

	if (options) {
		options.routesPath = path.resolve(process.cwd(), options.routesFile);
		options.routesDir = path.dirname(options.routesPath);

		try {
			options.routes = require(options.routesPath);
		} catch (e) {
			// Pass. Commands need to check for routes themselves.
		}

		options.outputUrl = options.jsUrl || '/';
	}

	return options;
}
