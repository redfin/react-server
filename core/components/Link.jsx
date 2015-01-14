
var React = require('react'),
	ClientRequest = require("../ClientRequest"),
	History = require("./History");

var Link = module.exports = React.createClass({
	displayName: 'Link',

	propTypes: {
		context: React.PropTypes.object.isRequired,
		path: React.PropTypes.string.isRequired
	},

	render: function () {
		return (
			<a href={'/r3s' + this.props.path} onClick={this._onClick}>{this.props.children}</a>
		);
	},

	_onClick: function (e) {

		// TODO: IE8-9 detection

		// TODO: if OSX && key.isMeta? 
		if (!e.metaKey) {
			e.preventDefault();
			e.stopPropagation();
			this.props.context.navigate(new ClientRequest('/r3s' + this.props.path), History.events.PUSHSTATE);	
		} else {
			// do normal browser navigate
		}
		
	}
})
