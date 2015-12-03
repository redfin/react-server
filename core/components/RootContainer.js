var React = require('react');
var Q = require('q');

var RootContainer = module.exports = React.createClass({
	displayName: 'RootContainer',

	propTypes: {
		when: React.PropTypes.object,
		_isRootContainer: React.PropTypes.bool,
	},

	getDefaultProps(){
		return {
			when: Q(),
			_isRootContainer: true,
		}
	},

	render: function () {
		throw new Error("RootContainers can't go in non-RootContainers!");
	},

})

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

function scheduleChild (element, child) {
	return element.props.when.then(props => React.cloneElement(child, props))
}

function prepChildren (element) {
	return React.Children.toArray(element.props.children).map(
		child => RootContainer.isRootContainer(child)
			?RootContainer.flattenForRender(child)
			:scheduleChild(element, child)
	)
}
