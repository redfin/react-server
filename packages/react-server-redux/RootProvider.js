var React = require('react');
var { Provider } = require('react-redux');

class RootProvider extends React.Component {
	render() {
		if (!this.props.store) {
			throw (new Error("Error Root Provider expects a store passed in as a prop"));
		}

		let wrappedElements = []
		if (Array.isArray(this.props.children)) {
			this.props.children.forEach((element, index) => {
				wrappedElements.push(React.createElement(Provider, {key: index, store: this.props.store}, element));
			});
		} else {
			wrappedElements.push(React.createElement(Provider, {key: 1, store: this.props.store}, this.props.children));
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
