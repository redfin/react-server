import React from "react"

export default class InternalServerErrorException {
	handleRoute() {
		return {code: 500};
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
