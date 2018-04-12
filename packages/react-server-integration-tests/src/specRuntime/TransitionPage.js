var React = require("react"),  //eslint-disable-line no-unused-vars
	Link = require("react-server").Link;

class TransitionPage {
	handleRoute() {
		this.path = this.getRequest().getQuery().url;
		return { code: 200 };
	}

	getElements() {
		return <Link path={this.path}>Click me</Link>;
	}
}

module.exports = TransitionPage;
