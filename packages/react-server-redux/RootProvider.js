var React = require('react');
var { Provider } = require('react-redux');

class RootProvider extends React.Component {
	render() {
		let wrappedElements = []
		if (Array.isArray(this.props.children)) {
			this.props.children.forEach((element) => {
				wrappedElements.push(React.createElement(Provider, {store: this.props.store}, element));
			});
		} else {
			wrappedElements.push(React.createElement(Provider, {store: this.props.store}, this.props.children));
		}

		return React.createElement('div', null, wrappedElements);
	}
}

module.exports = RootProvider;

RootProvider.propTypes = {
	store: React.PropTypes.object.isRequired,
}

RootProvider.defaultProps = {
	_isRootProvider: true,
}

RootProvider.isRootProvider = function(element) {
	return element && element.props && element.props._isRootProvider;
}
