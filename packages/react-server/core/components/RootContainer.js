var React = require('react');
var {
	ensureRootElementWithContainer,
	getRootElementAttributes,
} = require('./RootElement');

class RootContainer extends React.Component {
	render() {
		throw new Error("RootContainers can't go in non-RootContainers!");
	}
}

module.exports = RootContainer;

RootContainer.propTypes = {
	listen: React.PropTypes.func,
	when: React.PropTypes.object, // A promise.
	_isRootContainer: React.PropTypes.bool,
}

RootContainer.defaultProps = {
	_isRootContainer: true,
}

RootContainer.flattenForRender = function(element) {
	let tagName = element.props.tagName || 'div';
	return [{containerOpen: true,
			attrs: getRootElementAttributes(element),
			tagName: tagName,
		}]
		.concat(prepChildren(element))
		.concat([{containerClose: true,
				tagName: tagName,
		}])
		.reduce((m,v) => m.concat(Array.isArray(v)?v:[v]), [])
}

RootContainer.isRootContainer = function(element) {
	return element && element.props && element.props._isRootContainer;
}

function prepChildren (element) {
	return React.Children.toArray(element.props.children).map(
		child => RootContainer.isRootContainer(child)
			?RootContainer.flattenForRender(child)
			:ensureRootElementWithContainer(child, element)
	)
}
