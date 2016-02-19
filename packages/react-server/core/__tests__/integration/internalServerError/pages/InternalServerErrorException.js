import React from "react"

export default class InternalServerErrorException {
	handleRoute() {

		// Not throwing an `Error` since this is easier to match.
		throw "died";

		return {code: 200};
	}

	// Should never get called.
	getTitle() {
		return "foo";
	}

	// Should never get called.
	getElements() {
		return <div>foo</div>;
	}
}
