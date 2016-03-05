var React = require("react"),
	Link = require("../../../components/Link");

class SimpleTitlePage {
	getTitle() {
		return "This Is My Simple Title";
	}

	getElements() {
		return <Link path="/nullTitle">Click me</Link>;
	}
}

module.exports = SimpleTitlePage;