
var React = require('react'),
	PropTypes = require('prop-types'),
	navigateTo = require("../util/navigateTo");

class Link extends React.Component {

	static get displayName() {
		return 'Link';
	}

	static get propTypes() {
		return {
			path: PropTypes.string,
			href: PropTypes.string,
			onClick: PropTypes.func,
			bundleData: PropTypes.bool,
			reuseDom: PropTypes.bool,
			className: PropTypes.string,
		};
	}

	static get defaultProps() {
		return {
			bundleData: false,
			reuseDom: false,
		};
	}

	constructor(props) {
		super(props);

		this._onClick = this._onClick.bind(this);
	}

	render() {
		return (
			<a href={this.props.path || this.props.href} onClick={this._onClick} className={this.props.className}>{this.props.children}</a>
		);
	}

	_onClick(e) {

		// TODO: IE8-9 detection

		// TODO: if OSX && key.isMeta?
		if (!e.metaKey) {
			e.preventDefault();
			e.stopPropagation();
			const { bundleData, reuseDom } = this.props;
			navigateTo(this.props.path || this.props.href, {
				bundleData,
				reuseDom,
			});
			if (this.props.onClick) {
				this.props.onClick(e);
			}
		} else {
			// do normal browser navigate
		}
	}
}

module.exports = Link;
