import React from "react"

export default class NotFoundNoDocumentPage {
	handleRoute() {
		return {code: 404};
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
