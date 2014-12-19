
var React = require('react');

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
			this.props.context.navigate({path: '/r3s' + this.props.path});	
		} else {
			// do normal browser navigate
		}
		
	}
})
