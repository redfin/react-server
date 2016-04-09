import React from "react"

export default class NotFoundWithDocumentPage {
	handleRoute() {
		return {
			code        : 404,
			hasDocument : true,
		};
	}

	getTitle() {
		return "foo";
	}

	getElements() {
		return <div>foo</div>;
	}
}
