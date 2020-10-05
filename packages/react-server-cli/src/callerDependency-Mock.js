import lookup from "look-up";
import path from "path";

export default function callerDependency(dep) {
	return lookup("packages/" + dep, {cwd: path.resolve(process.cwd() + '/..')});
}
