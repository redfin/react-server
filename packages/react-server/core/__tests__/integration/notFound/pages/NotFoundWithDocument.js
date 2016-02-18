import React from "react"

export default class NotFoundWithDocumentPage {
	handleRoute() {
		this.setHaveDocument(true);
		return {code: 404};
	}

	getTitle() {
		return "foo";
	}

	getElements() {
		return <div>foo</div>;
	}
}
