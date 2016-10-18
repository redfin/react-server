
var React = require('react'),
	navigateTo = require("../util/navigateTo");

module.exports = React.createClass({
	displayName: 'Link',

	propTypes: {
		path       : React.PropTypes.string,
		href       : React.PropTypes.string,
		bundleData : React.PropTypes.bool,
		frameback  : React.PropTypes.bool,
		reuseDom   : React.PropTypes.bool,
		className  : React.PropTypes.string,
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
			<a href={this.props.path || this.props.href} onClick={this._onClick} className={this.props.className}>{this.props.children}</a>
		);
	},

	_onClick: function (e) {

		// TODO: IE8-9 detection

		// TODO: if OSX && key.isMeta?
		if (!e.metaKey) {
			e.preventDefault();
			e.stopPropagation();
			const {bundleData, frameback, reuseDom, reuseFrame} = this.props;
			navigateTo(this.props.path || this.props.href, {
				bundleData,
				frameback,
				reuseDom,
				reuseFrame,
			});
		} else {
			// do normal browser navigate
		}

	},
})
