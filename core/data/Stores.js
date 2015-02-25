var Reflux = require("reflux"),
	Q = require("q"),
	logger = require("../logging").getLogger(__LOGGER__);


module.exports = {
	createStoreFactory(impl) {
		var mixin = {
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
			},

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
			},

			setState(newState) {
				var shouldEmitChange = false;
				Object.keys(newState).forEach((key) => {

					// first we look to see if there is currently a child store at this key. if so, 
					// we need to make this store stop listening to the child store.
					if (this._childUnsubscribes[key]) {
						// this was a child store; we need to stop listening to it.
						this._childUnsubscribes[key]();
						delete this._childUnsubscribes[key];
						delete this._childStores[key];
					}

					// now we need to add the new value to our state.
					var newValue = newState[key];
					if (newValue.__tritonIsStore) {
						// the new value here is a child store, so we must assign the child store's 
						// state, not the child store itself, as our state value. 
						this._setSingleNameValue(key, newValue.state);

						// also, we need to automatically listen to change events from this child store.
						this._childStores[key] = newValue;
						this._childUnsubscribes[key] = newValue.listen(() => {
							this._setSingleNameValue(key, newValue.state);
							this._emitChange();
						});
						shouldEmitChange = true;
					} else if (newValue.then) {
						// the value is a Promise (or a thenable, at the very least), which means that 
						// we don't update state immediately, but only when the promise resolves.
						this._pendingValues[key] = newValue;
						newValue.then((value) => {
							this._setSingleNameValue(key, value);
							delete this._pendingValues[key];
							this._emitChange();
						});
					} else {
						// it was just a simple value, so we assign it to our state.
						this._setSingleNameValue(key, newValue);
						shouldEmitChange = true;
					}
				});

				if (shouldEmitChange) this._emitChange();
			},

			_emitChange() {
				this.trigger(this.state);
			},

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

		};

		Object.keys(impl).forEach((key) => {
			if (mixin[key]) throw new Error(`Cannot override method ${key} in Store; try a new name`);
			mixin[key] = impl[key];
		});

		return function() {
			var args = arguments;
			mixin.init = function () {
				this.state = {};
				this._childUnsubscribes = {};
				this._childStores = {};
				this._whenDeferreds = {};
				this._pendingValues = {};
				this._actionListeners = [];

				this.__tritonIsStore = true;

				if (impl.init) impl.init.apply(this, args);
			};

			return Reflux.createStore(mixin);
		}
	}
};
