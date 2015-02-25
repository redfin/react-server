var EventEmitter = require('eventemitter3'),
	Q = require("q"),
	React = require("react/addons"),
	Reflux = require("reflux");

var TritonDataRoot = React.createClass({
	componentDidMount: function() {
		this._storeListener = () => this.forceUpdate();
		this.props._store.listen(this._storeListener);
	},

	componentWillUnmount: function () {
		this.props._store.removeListener("change", this._storeListener);
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

class TritonData {

	createRootElement(store, element) {
		if (typeof element === "function") {
			return <TritonDataRoot _store={store} _childFactory={element}/>;
		} else {
			return <TritonDataRoot _store={store}>{element}</TritonDataRoot>;
		}
	}

	createRootElementWhen(names, store, element) {
		var promise = store.when(names).then(() => this.createRootElement(store, element));
		promise.getValue = () => this.createRootElement(store, element);
		return promise;
	}


	createRootElementWhenResolved(store, element) {
		var promise = store.whenResolved().then(() => this.createRootElement(store, element));
		promise.getValue = () => this.createRootElement(store, element);
		return promise;
	}

	createAction() {
		return Reflux.createAction.apply(Reflux, arguments);
	}

	createActions() {
		return Reflux.createActions.apply(Reflux, arguments);
	}
}

module.exports = new TritonData();