import React from "react"

export default class InternalServerErrorWithDocumentPage {
	handleRoute() {
		this.setHaveDocument(true);
		return {code: 500};
	}

	getTitle() {
		return "foo";
	}

	getElements() {
		return <div>foo</div>;
	}
}
