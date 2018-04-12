const PropTypes = require('prop-types');
var React = require('react');
var { Provider } = require('react-redux');

const rootProviderSymbol = Symbol();
class RootProvider extends React.Component {
	constructor() {
		super();
		this[rootProviderSymbol] = true;
	}

	static isRootProvider(elem) {
		return elem[rootProviderSymbol];
	}

	render() {
		if (!this.props.store) {
			throw (new Error("Error Root Provider expects a store passed in as a prop"));
		}

		let wrappedElements = []
		if (Array.isArray(this.props.children)) {
			this.props.children.forEach((element, index) => {
				if (!RootProvider.isRootProvider(element)) {
					wrappedElements.push(React.createElement(Provider, { key: index, store: this.props.store }, element));
				}
			});
		} else {
			wrappedElements.push(React.createElement(Provider, { key: 0, store: this.props.store }, this.props.children));
		}

		return React.createElement('div', null, wrappedElements);
	}
}

module.exports = RootProvider;

RootProvider.propTypes = {
	store: PropTypes.object.isRequired,
}
