var React = require("react");

class TemporaryRedirectPage {
	handleRoute() {
		return {code: 302, location: "/final"};
	}	

	getElements() {
		return <div id="main">TemporaryRedirectPage</div>
	}
}

module.exports = TemporaryRedirectPage;