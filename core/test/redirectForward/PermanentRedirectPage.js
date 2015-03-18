var React = require("react");

class PermanentRedirectPage {
	handleRoute(request) {
		return {code: 301, location: "/final"};
	}	

	getElements() {
		return <div id="main">PermanentRedirectPage</div>
	}
}

module.exports = PermanentRedirectPage;