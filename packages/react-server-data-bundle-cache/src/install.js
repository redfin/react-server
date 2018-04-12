import wrap from "./wrap";
import logEvents from "./log-events";

let _didInstall = 0;

export default function (opts) {

	// Only going to wrap once.
	if (_didInstall++) return;

	wrap(opts);

	logEvents();
}
