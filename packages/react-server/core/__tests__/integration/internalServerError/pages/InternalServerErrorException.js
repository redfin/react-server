import React from "react"

export default class InternalServerErrorException {
	handleRoute() {
		// This is just to verify that we don't render after a real
		// exception even if we claim that we can.
		this.setHaveDocument(true);

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
