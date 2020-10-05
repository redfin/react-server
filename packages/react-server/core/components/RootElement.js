
var React = require('react');
const PropTypes = require('prop-types');
var Q = require('q');

const {isTheFold} = require('./TheFold');

const _ = {
	assign: require('lodash/assign'),
};

var logger = require('../logging').getLogger(__LOGGER__);

class RootElement extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			childProps: props.childProps,
		};
	}

	componentDidMount() {
		if (this.props.subscribe) {
			this.props.subscribe(childProps => {
				var now            = new Date;
				var name           = this.getChildName();
				var count          = ++this._changeCount;
				var fromMount      = now - this._t0;
				var fromLastChange = now - this._t1;
				this._t1           = now;

				[`byName.${name}`, 'all'].forEach(tag => {
					logger.time(`change.fromMount.${tag}`, fromMount);
					logger.time(`change.fromLastChange.${tag}`, fromLastChange);
					logger.gauge(`change.count.${tag}`, count);
				});

				const newChildProps = _.assign({}, this.state.childProps, childProps);
				this.setState({
					childProps: newChildProps,
				});
			});
		}
	}

	componentWillUnmount() {
		if (this.props.unsubscribe) this.props.unsubscribe();
	}

	componentWillReceiveProps(nextProps) {
		const newChildProps = _.assign({}, this.state.childProps, nextProps.childProps);
		this.setState({
			childProps: newChildProps,
		});
	}

	render() {

		if (!this._t0) {
			this._t0 = this._t1 = new Date;
			this._changeCount = 0;
		}

		if (typeof this.props.children === 'string') {

			logger.error(
				"Root elements cannot be raw text",
				{ text: this.props.children }
			);

			return <div />;
		}

		return React.cloneElement(
			React.Children.only(this.props.children),
			this.state.childProps
		);
	}

	getChildName() {
		if (!this._childName){
			this._childName = (React.Children.only(
				this.props.children
			).type.displayName||'Unknown').split('.').pop();
		}
		return this._childName;
	}

}

module.exports = RootElement;

RootElement.propTypes = {
	listen: PropTypes.func,
	when: PropTypes.object, 
	childProps: PropTypes.object,
	_isRootElement: PropTypes.bool,
	children: PropTypes.node,
	subscribe: PropTypes.func,
	unsubscribe: PropTypes.func,
};

RootElement.defaultProps = {
	_isRootElement: true,
};

RootElement.isRootElement = function(element) {
	return element && element.props && element.props._isRootElement;
}

RootElement.getRootElementAttributes = function(element) {
	var props = element.props;
	var attrs = {};

	if (props.className) attrs.class = props.className;

	[
		'id',
		'style',
	].forEach(k => props[k] && (attrs[k] = props[k]));

	return attrs;
}

RootElement.ensureRootElementWithContainer = function(element, container) { // eslint-disable-line react/display-name

	if (RootElement.isRootElement(element) || isTheFold(element) || (

	
		!React.isValidElement(element) && typeof element !== 'string'
	)){
		return element;
	}

	const {listen, when} = container.props;

	return <RootElement listen={listen} when={when}>{element}</RootElement>;
}

RootElement.ensureRootElement = function(element){
	return RootElement.ensureRootElementWithContainer(element, {props:{}});
}

RootElement.installListener = function(element, listen) {
	var dfd = Q.defer(),
		updater,
		subscribe = callback => {updater = callback},
		unsubscribe = listen(childProps => {
			// Once the component has mounted it will provide an updater.
			// After that we can just short-circuit here and let it handle
			// updating itself.
			if (updater) {
				updater(childProps);
			}

			// The promise itself will only resolve once, but we don't
			// want to _clone_ multiple times.
			else if (dfd.promise.isPending()) {
				dfd.resolve(React.cloneElement(element, {
					childProps,
					subscribe,
					unsubscribe,
				}));
			}
		});
	return dfd.promise
}

RootElement.scheduleRender = function(element) {
	var {listen, when, componentLoader, childProps} = (element||{}).props||{};
	if (!(listen||when||componentLoader||childProps)) {
		return Q(element).then(RootElement.ensureRootElement);
	}

	// This is what we'll ultimately resolve our return promise with.
	// It may be changed by the output of `listen` or `when`.
	var rendered = element;
	var componentLoaderDeferred = componentLoader ? componentLoader() : null;

	// Install the listener right away to start gathering props.
	// It may be a gated emitter, but we want to make sure we squeeze
	// props out of it from the beginning if it's not.
	// Finally gate on the `when`.
	return Q(listen && RootElement.installListener(element, listen))
		.then(el => el && (rendered = el))
		.then(() => Q.allSettled([when, componentLoaderDeferred]))
		.then(results => {
			var [whenResult, loadedComponent] = results;
			if (whenResult.value || loadedComponent.value || childProps) {
				// merge in child props from listen, when, and childProps
				const clonedChildProps = _.assign({}, rendered.props.childProps, whenResult.value, childProps);

				// if we have a component loader specified, copy the resolved component
				// and render that with the current child as a child of that component
				const currentChild = rendered.props.children;
				const childToRender = componentLoaderDeferred ? React.createElement(loadedComponent.value, null, currentChild) : currentChild;

				return React.cloneElement(rendered, {childProps: clonedChildProps}, childToRender);
			}
			return rendered;
		});
}
