import lookup from "look-up";
import path from "path";

export default function callerDependency(dep) {
	// TODO: We should grab stuff based on what the routes file would get out
	// of `require.resolve(dep)`.  Using `process.cwd()` instead for now.
	let cwd = process.cwd(),
		lookupResult;

	if (process.env.NODE_ENV === '__react-server-cli-unit-test__') { // eslint-disable-line no-process-env
		cwd = path.resolve(cwd + '/..');
		lookupResult = lookup("packages/" + dep, {cwd: cwd});
	} else {
		lookupResult = lookup("node_modules/" + dep, {cwd: cwd});
	}
	console.log('cwd: ', cwd);
	console.log(lookupResult);
	return lookupResult;
}
