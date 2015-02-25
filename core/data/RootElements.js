var EventEmitter = require('eventemitter3'),
	Q = require("q"),
	React = require("react/addons"),
	Reflux = require("reflux");

var TritonDataRoot = React.createClass({
	componentDidMount: function() {
		this._storeListener = () => this.forceUpdate();
		this._unsubscribe = this.props._store.listen(this._storeListener);
	},

	componentWillUnmount: function () {
		if (this._unsubscribe) this._unsubscribe();
	}, 

	render: function() {
		if (this.props._childFactory) {
			return this.props._childFactory(this.props._store.state);
		} else {
			var singleChild = React.Children.only(this.props.children);
			return React.addons.cloneWithProps(singleChild, this.props._store.state);
		}
	}
})

module.exports = {

	createRootElement(store, element) {
		if (typeof element === "function") {
			return <TritonDataRoot _store={store} _childFactory={element}/>;
		} else {
			return <TritonDataRoot _store={store}>{element}</TritonDataRoot>;
		}
	},

	createRootElementWhen(names, store, element) {
		var promise = store.when(names).then(() => this.createRootElement(store, element));
		promise.getValue = () => this.createRootElement(store, element);
		return promise;
	},


	createRootElementWhenResolved(store, element) {
		var promise = store.whenResolved().then(() => this.createRootElement(store, element));
		promise.getValue = () => this.createRootElement(store, element);
		return promise;
	}
};