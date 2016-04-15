
var React = require('react'),
	ClientRequest = require("../ClientRequest"),
	History = require("./History"),
	getCurrentRequestContext = require("../context/RequestContext").getCurrentRequestContext;

module.exports = React.createClass({
	displayName: 'Link',

	propTypes: {
		path       : React.PropTypes.string.isRequired,
		bundleData : React.PropTypes.bool,
		frameback  : React.PropTypes.bool,
		reuseDom   : React.PropTypes.bool,
	},

	getDefaultProps(){
		return {
			bundleData : false,
			frameback  : false,
			reuseDom   : false,
			reuseFrame : false,
		}
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
			const {bundleData, frameback, reuseDom, reuseFrame} = this.props;
			getCurrentRequestContext().navigate(
				new ClientRequest(this.props.path, {
					bundleData,
					frameback,
					reuseDom,
					reuseFrame,
				}),
				History.events.PUSHSTATE
			);
		} else {
			// do normal browser navigate
		}

	},
})
