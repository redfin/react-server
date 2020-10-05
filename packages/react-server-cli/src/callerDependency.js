import lookup from "look-up";

export default function callerDependency(dep) {
	return lookup("node_modules/" + dep, {cwd: process.cwd()});
}
