var React = require("react"),
	Link = require("../../components/Link");

class TransitionPage {
	handleRoute() {
		this.path = this.getRequest().getQuery().url;
		return {code:200};
	}

	getElements() {
		return <Link path={this.path}>Click me</Link>;
	}
}

module.exports = TransitionPage;