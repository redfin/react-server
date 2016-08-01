import path from "path";

export default function callerDependency(dep) {
	// TODO: We should grab stuff based on what the routes file would get out
	// of `require.resolve(dep)`.  Using `process.cwd()` instead for now.
	return path.resolve(path.join(process.cwd(), "node_modules/" + dep));
}
