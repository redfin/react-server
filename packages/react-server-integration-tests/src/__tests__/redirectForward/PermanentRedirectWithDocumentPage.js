import React from "react"

export default class PermanentRedirectWithDocumentPage {
	handleRoute() {
		return { code: 301, location: "/final", hasDocument: true };
	}

	getElements() {
		return <div id="main">PermanentRedirectWithDocumentPage</div>
	}
}
