import React from "react"

export default class TemporaryRedirectWithDocumentPage {
	handleRoute() {
		return {code: 302, location: "/final", hasDocument: true};
	}

	getElements() {
		return <div id="main">TemporaryRedirectWithDocumentPage</div>
	}
}
