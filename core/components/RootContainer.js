var React = require('react');
var Q = require('q');
var {ensureRootElementWithContainer} = require('./RootElement');

class RootContainer extends React.Component {
	render() {
		throw new Error("RootContainers can't go in non-RootContainers!");
	}
}

module.exports = RootContainer;

RootContainer.propTypes = {
	listen: React.PropTypes.func,
	_isRootContainer: React.PropTypes.bool,
}

RootContainer.defaultProps = {
	_isRootContainer: true,
}

RootContainer.flattenForRender = function(element) {
	return [{containerOpen: containerAttrs(element)}]
		.concat(prepChildren(element))
		.concat([{containerClose: true}])
		.reduce((m,v) => m.concat(Array.isArray(v)?v:[v]), [])
}

RootContainer.isRootContainer = function(element) {
	return element && element.props && element.props._isRootContainer;
}

function containerAttrs (element) {
	var props = element.props;
	var attrs = {};

	if (props.className) attrs.class = props.className;

	// TODO: Others?
	[
		'id',
		'style',
	].forEach(k => props[k] && (attrs[k] = props[k]));

	return attrs;
}

function prepChildren (element) {
	return React.Children.toArray(element.props.children).map(
		child => RootContainer.isRootContainer(child)
			?RootContainer.flattenForRender(child)
			:ensureRootElementWithContainer(child, element)
	)
}
