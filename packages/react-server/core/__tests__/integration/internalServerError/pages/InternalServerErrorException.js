import React from "react"

export default class InternalServerErrorException {
	handleRoute() {

		// Need to throw a real error here, since CLS is going to
		// assign a property to the error to track its source context.
		throw new Error("died");

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
