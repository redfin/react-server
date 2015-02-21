var EventEmitter = require('eventemitter3'),
	Q = require("q"),
	React = require("react/addons");

var TritonDataRoot = React.createClass({
	componentDidMount: function() {
		this._storeListener = () => this.forceUpdate();
		this.props._store.on("change", this._storeListener);
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
	createStoreFactory(storeMethods) {
		class Store extends EventEmitter {
			constructor() {
				super();
				this.state = {};
				this._childListeners = {};
				this._childStores = {};
				this._whenDeferreds = {};
				this._pendingValues = {};

				this.__tritonIsStore = true;

				if (this.init) {
					this.init.apply(this, arguments);
				}
			}

			when(names) {
				if (!Array.isArray(names)) names = [names];

				var promises = names.map((name) => {
					if (typeof this.state[name] !== "undefined") {
						return Q();
					} else {
						var deferred = Q.defer();
						this._whenDeferreds[name] = deferred;
						return deferred.promise;
					}
				});

				return Q.all(promises).then(() => {
					var result = {};
					names.forEach((name) => {
						result[name] = this.state[name];
					})
					return result;
				});
			}

			whenResolved() {
				var pendingValuesPromises = Object.keys(this._pendingValues).map((key) => this._pendingValues[key]);
				// base case; we're not waiting for any values.
				if (pendingValuesPromises.length === 0) {
					return Q(this.state);
				} else {
					// recursive case: wait for all the currently pending values, then call
					// whenResolved again in case more pending values have been added.
					return Q.all(pendingValuesPromises).then(() => {
						return this.whenResolved();
					});
				}
			}

			setState(newState) {
				var shouldEmitChange = false;
				Object.keys(newState).forEach((key) => {

					// first we look to see if there is currently a child store at this key. if so, 
					// we need to make this store stop listening to the child store.
					if (this._childListeners[key]) {
						// this was a child store; we need to stop listening to it.
						this._childStores[key].removeListener("change", this._childListeners[key]);
						delete this._childListeners[key];
						delete this._childStores[key];
					}

					// now we need to add the new value to our state.
					var newValue = newState[key];
					if (newValue.__tritonIsStore) {
						// the new value here is a child store, so we must assign the child store's 
						// state, not the child store itself, as our state value. 
						this._setSingleNameValue(key, newValue.state);

						// also, we need to automatically listen to change events from this child store.
						this._childListeners[key] = () => {
							this._setSingleNameValue(key, newValue.state);
							this.emit("change");
						};
						this._childStores[key] = newValue;
						newValue.on("change", this._childListeners[key]);
						shouldEmitChange = true;
					} else if (newValue.then) {
						// the value is a Promise (or a thenable, at the very least), which means that 
						// we don't update state immediately, but only when the promise resolves.
						this._pendingValues[key] = newValue;
						newValue.then((value) => {
							this._setSingleNameValue(key, value);
							delete this._pendingValues[key];
							this.emit("change");
						});
					} else {
						// it was just a simple value, so we assign it to our state.
						this._setSingleNameValue(key, newValue);
						shouldEmitChange = true;
					}
				});

				if (shouldEmitChange) this.emit("change");
			}

			// adds a single name-value pair to the store's state and, if when is waiting on that name, resolves the 
			// corresponding deferred.
			_setSingleNameValue(name, value) {
				this.state[name] = value;
				// if a when was waiting for this name, notify it.
				if (this._whenDeferreds[name]) {
					this._whenDeferreds[name].resolve();
					delete this._whenDeferreds[name];
				}
			}
		}

		// now mix in the store methods that were passed in.
		Object.keys(storeMethods).forEach((key) => {
			Store.prototype[key] = storeMethods[key];
		});

		return Store;
	}

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
}

module.exports = new TritonData();