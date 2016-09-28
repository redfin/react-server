var React = require('react');
var Q = require('q');

const {isTheFold} = require('./TheFold');

const _ = {
	assign: require('lodash/assign'),
};

var logger = require('../logging').getLogger(__LOGGER__);

class RootElement extends React.Component {
	componentDidMount() {
		if (this.props.subscribe) {
			this.props.subscribe(childProps => {
				var now            = new Date;
				var name           = this.getChildName();
				var count          = ++this._changeCount;
				var fromMount      = now - this._t0;
				var fromLastChange = now - this._t1;
				this._t1           = now;

				// Log some stuff about the change.
				[`byName.${name}`, 'all'].forEach(tag => {
					logger.time(`change.fromMount.${tag}`, fromMount);
					logger.time(`change.fromLastChange.${tag}`, fromLastChange);
					logger.gauge(`change.count.${tag}`, count);
				});

				// Okay, now we've complained about it
				// sufficiently, let's go ahead and update.
				this.props = _.assign({}, this.props, {childProps});
				this.forceUpdate();
			});
		}
	}

	componentWillUnmount() {
		if (this.props.unsubscribe) this.props.unsubscribe();
	}

	render() {

		// We'll use these to log stuff about re-renders.
		if (!this._t0) {
			this._t0 = this._t1 = new Date;
			this._changeCount = 0;
		}

		if (typeof this.props.children === 'string') {

			logger.error(
				"Root elements cannot be raw text",
				{ text: this.props.children }
			);

			// Don't keep choking on it.  Just gut it.
			return <div />;
		}

		return React.cloneElement(
			React.Children.only(this.props.children),
			this.props.childProps
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
	listen: React.PropTypes.func,
	when: React.PropTypes.object, // A promise.
	childProps: React.PropTypes.object,
	_isRootElement: React.PropTypes.bool,
}

RootElement.defaultProps = {
	_isRootElement: true,
}

RootElement.isRootElement = function(element) {
	return element && element.props && element.props._isRootElement;
}

RootElement.getRootElementAttributes = function(element) {
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

RootElement.ensureRootElementWithContainer = function(element, container) {

	// If it's _already_ a root element (or the fold), pass it along.
	if (RootElement.isRootElement(element) || isTheFold(element) || (

		// Alternatively, if it's a control object pass it along.
		//
		// We exclude strings here since we already gripe about them
		// at render time.
		//
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
	var dfd = Q.defer();
	var updater;
	var unsubscribe = listen(childProps => {

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
	var subscribe = callback => {updater = callback};
	return dfd.promise
}

RootElement.scheduleRender = function(element) {
	var {listen, when} = (element||{}).props||{};
	if (!(listen||when)) {
		return Q(element).then(RootElement.ensureRootElement);
	}

	// This is what we'll ultimately resolve our return promise with.
	// It may be changed by the output of `listen` or `when`.
	var rendered = element;

	// Install the listener right away to start gathering props.
	// It may be a gated emitter, but we want to make sure we squeeze
	// props out of it from the beginning if it's not.
	// Finally gate on the `when`.
	return Q(listen && RootElement.installListener(element, listen))
		.then(el => el && (rendered = el))
		.then(() => when)
		.then(childProps => childProps
			// merge "when" childProps and "listen" childProps preemptively
			// to prevent cloneElement shallow merge from clobbering "listen" childProps
			?React.cloneElement(rendered, {childProps: _.assign({}, rendered.props.childProps || {}, childProps)})
			:rendered
		)
}
