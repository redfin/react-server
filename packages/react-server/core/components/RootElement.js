var React = require('react');
var Promise = require('bluebird');

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
				this.props.childProps = childProps;
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

	// If it's _already_ a root element, pass it along.
	if (RootElement.isRootElement(element) || (

		// Alternatively, if it's a control object pass it along.
		//
		// We exclude strings here since we already gripe about them
		// at render time.
		//
		!React.isValidElement(element) && typeof element !== 'string'
	)){
		return element;
	}

	return <RootElement listen={container.props.listen}>{element}</RootElement>;
}

RootElement.ensureRootElement = function(element){
	return RootElement.ensureRootElementWithContainer(element, {props:{}});
}

RootElement.scheduleRender = function(element) {
	var listen = ((element||{}).props||{}).listen;
	if (!listen) return Promise.resolve(element).then(RootElement.ensureRootElement);
	var resolve;
	var updater;
	var promise = new Promise(res => resolve = res);
	var unsubscribe = listen(childProps => {

		// Once the component has mounted it will provide an updater.
		// After that we can just short-circuit here and let it handle
		// updating itself.
		if (updater) return updater(childProps);

		// The promise itself will only resolve once, but we don't
		// want to _clone_ multiple times.
		if (promise.isPending()) {
			resolve(React.cloneElement(element, {
				childProps,
				subscribe,
				unsubscribe,
			}));
		}
	});
	var subscribe = callback => updater = callback;
	return promise
}
