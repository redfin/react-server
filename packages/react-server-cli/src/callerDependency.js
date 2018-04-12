import lookup from "look-up";

// NOTE: if this function changes, make sure it also changes in the 'callerDependency-Mock.js' file as well.
export default function callerDependency(dep) {
	// TODO: We should grab stuff based on what the routes file would get out
	// of `require.resolve(dep)`.  Using `process.cwd()` instead for now.
	return lookup("node_modules/" + dep, { cwd: process.cwd() });
}
