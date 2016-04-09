import React from "react"

export default class InternalServerErrorWithDocumentPage {
	handleRoute() {
		return {
			code        : 500,
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
