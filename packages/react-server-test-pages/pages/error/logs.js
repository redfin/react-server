import Q from "q";

import {RootElement} from "react-server";

function fail() {
	return Q().then(() => { throw new Error("Fail!") });
}

export default class ErrorLogsPage {
	getElements() {
		return [
			<div>Check the logs</div>,
			<RootElement when={fail()}>Nope</RootElement>,
		]
	}
}
