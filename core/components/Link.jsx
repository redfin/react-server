
var React = require('react'),
	ClientRequest = require("../ClientRequest"),
	History = require("./History"),
	getCurrentRequestContext = require("../context/RequestContext").getCurrentRequestContext;

var Link = module.exports = React.createClass({
	displayName: 'Link',

	propTypes: {
		path: React.PropTypes.string.isRequired
	},

	render: function () {
		return (
			<a href={this.props.path} onClick={this._onClick}>{this.props.children}</a>
		);
	},

	_onClick: function (e) {

		// TODO: IE8-9 detection

		// TODO: if OSX && key.isMeta?
		if (!e.metaKey) {
			e.preventDefault();
			e.stopPropagation();
			getCurrentRequestContext().navigate(new ClientRequest(this.props.path), History.events.PUSHSTATE);
		} else {
			// do normal browser navigate
		}

	}
})
