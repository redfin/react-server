import ClientRequest from "../ClientRequest";
import History from "../components/History";
import { getCurrentRequestContext } from "../context/RequestContext";

// This initiates a client transition to `path` with `options`.
// Just a convenience wrapper.
export default function navigateTo(path, options) {
	getCurrentRequestContext().navigate(
		new ClientRequest(path, options),
		History.events.PUSHSTATE
	);
}
