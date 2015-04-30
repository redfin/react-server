var React = require("react");

class ForwardPage {
	handleRoute() {
		return {page: require("./FinalPage")};
	}

	getElements() {
		return <div id="main">ForwardPage</div>;
	}

}

module.exports = ForwardPage;