var React = require('react');
var Q = require('q');

class RootElement extends React.Component {
	render() {
		return React.cloneElement(
			React.Children.only(this.props.children),
			this.props.childProps
		);
	}
}

module.exports = RootElement;

RootElement.propTypes = {
	when: React.PropTypes.object,
	childProps: React.PropTypes.object,
	_isRootElement: React.PropTypes.bool,
}

RootElement.defaultProps = {
	when: Q(),
	_isRootElement: true,
}

RootElement.isRootElement = function(element) {
	return element && element.props && element.props._isRootElement;
}

RootElement.ensureRootElement = function(element, child) {
	if (RootElement.isRootElement(child)) {
		return child;
	}
	return <RootElement when={element.props.when}>{child}</RootElement>;
}

RootElement.scheduleRender = function(element) {
	return element.props.when
		.then(childProps => React.cloneElement(element, {childProps}));
}
