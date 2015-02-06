/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 * 
 * converted to ES6 syntax by Redfin; dropped interaction with dispatcher.
 */
// 'use strict';

var logger = require('../logging').getLogger(__LOGGER__),
	EventEmitter = require('events').EventEmitter,
	Q = require('q'),
	React = require("react/addons"),
	PromiseUtil = require("../util/PromiseUtil"),
	TritonAgent = require('../util/TritonAgent'),
    CHANGE_EVENT = 'change';


class BaseStore {

	constructor () {
		this._emitter = new EventEmitter();

		this._actionListeners = [];

		// this is a map that keeps track of all of the child stores and 
		// data requests. it's a map of name => dataObject, where dataObject is 
		// either {store: ChildStore} or {url: String, result?: String, status: LoadingStatus, loaded?: Promise}
		this._data = {};
	}

	addDataUrl(name, url) {
		this._dupeCheckLoaderName(name);

		this._data[name] = this._attachNotStartedDfd({
			url,
			status: BaseStore.LoadState.NOT_STARTED
		})
	}

	addChildStore(name, store) {
		this._dupeCheckLoaderName(name);

		this._data[name] = this._attachNotStartedDfd({
			store
		});
		store.addChangeListener(this.emitChange.bind(this));
	}

	getNames() {
		// TODO: defensive copy?
		return Object.keys(this._data);
	}

	getLoadStatus(field) {
		if (this._data[field].store) {
			throw (field + " is a child store, not a data loader. Check the child store's status");
		}
		return this._data[field].status;
	}

	getIsReady(field) {
		return this.getLoadStatus(field) === BaseStore.LoadState.DONE;
	}

	get(field) {
		//TODO - throw if not ready?
		return this._data[field].store || this._data[field].result;
	}

	/**
	 * whenAll() : Promise
	 * whenAll returns a Promise that resolves when all the current loading resources (and their
	 * dependents) load.
	 */
	whenAll() {

		// the goal here is to wait for all of the currently outstanding requests,
		// then when they come back to wait for any NEW outstanding requests.
		var waitForAllExcept = (alreadyLoaded) => {
			// which names should we wait for in this round?
			var waitForNames = [];
			Object.keys(this._data).forEach((name) => {
				if (!alreadyLoaded[name]) {
					waitForNames.push(name);
				}
			});

			// if there's nothing left to wait for, return a resolved promise.
			if (waitForNames.length === 0) {
				// we're done, return a resolved promise.
				return Q(null);
			}

			// otherwise, return a promise of waiting for the rest of the outstanding requests.
			return this.when(waitForNames).then(() => {
				waitForNames.forEach((name) => alreadyLoaded[name] = true);
				return waitForAllExcept(alreadyLoaded);
			});
		}

		return waitForAllExcept({});

	} 

	// TODO: how to wait on data that has not yet been added to BaseStore?
	when(names) {
		var promises = [];
		names.map((name) => {
			if (this._data[name].promise) {
				promises.push(this._data[name].promise);
			}
		});

		return Q.all(promises).then((data) => {
			logger.debug("when resolved.");
			return data;
		});
	} 

	elementWhen(names, element, pendingElement) {
		pendingElement = pendingElement || element;

		return PromiseUtil.early(this.when(names).then(() => {
			return <BaseStore.Component store={this} names={names}>{element}</BaseStore.Component>;
		}), () => {
			return <BaseStore.Component store={this} names={names}>{pendingElement}</BaseStore.Component>;
		});
	}

	elementWhenAll(element, pendingElement) {
		pendingElement = pendingElement || element;

		return PromiseUtil.early(this.whenAll().then(() => {
			return <BaseStore.Component store={this}>{element}</BaseStore.Component>;
		}), () => {
			return <BaseStore.Component store={this}>{pendingElement}</BaseStore.Component>;
		});
	}

	_attachNotStartedDfd(item) {

		// Need to have a promise attached from the get-go so callers
		// of the `when...()` methods have something to wait for.
		item.notStartedDfd = Q.defer();
		item.promise = item.notStartedDfd.promise;

		return item;
	}

	_dupeCheckLoaderName(name) {
		if (this._data[name]) {
			var type = (this._data[name].url) ? "Dataloader" : "Child store";
			logger.debug(`${type} already exists with name ${name}`);
			throw (`${type} already exists with name ${name}`);
		}
	}

	_handleLoadResult(name, result) {
		 // TODO should we hold onto the raw result?		 
		try {
			this._data[name].result = this.processResponseData(name, result);
			this._data[name].status = BaseStore.LoadState.DONE;
		} catch(err) {
			this._data[name].result = result;
			this._data[name].status = BaseStore.LoadState.ERROR;
			logger.error('Failed _handleLoadResult', err);
			throw err;
		}		
	}

	_loadByName(name) {
		var url = this._data[name].url;
		var t0 = new Date;
		logger.debug("requesting " + name + ": " + url);
		this._data[name].status = BaseStore.LoadState.LOADING;

		var cachedResult = TritonAgent.cache().checkLoaded(url); 
		if (cachedResult) {
			this._handleLoadResult(name, cachedResult.getData().body);
			// returning null is OK because we filter out nulls in loadData,
			// and Q.allSettled with an empty array is resolved immediately
			return null;
		} else {
			var dfd = Q.defer();

			TritonAgent.get(url).end( (err, res) => {

				if (err) {
					logger.error("error " + name + ": " + url, err);
					logger.time(`loadByName.error.${name}`, new Date - t0);
					this._data[name].status = BaseStore.LoadState.ERROR;
					this.emitChange();

					// TODO: reject?
					dfd.resolve();
					return;
				}

				logger.debug("completed " + name + ": " + url);
				logger.time(`loadByName.success.${name}`, new Date - t0);
				this._handleLoadResult(name, res.body);
				this.emitChange();
				dfd.resolve();	
			});

			return dfd.promise;
		}
	}

	loadData () {
		if (this._data.length < 1) {
			throw ("Can't load data with 0 URLs and 0 child stores");
		}
		var nullUrls = Object.keys(this._data).filter(name => {
			return (name === null || name === undefined || (!this._data[name].url && !this._data[name].store));
		});		
		if (nullUrls.length > 0) {
			throw ("Can't load data from null or undefined urls. urls=" + this._data.filter(data => !data.store).map(data => data.url));
		}

		// kick off requests and store the promises
		var loadPromises = Object.keys(this._data).map(name => {
			var promise;
			if (this._data[name].store) {
				logger.debug("loading Child Store " + name);
				promise = this._data[name].store.loadData();
			} else {
				promise = this._loadByName(name);
			}

			if (promise) {

				// Any calls to `when...()` methods before we
				// started loading will be waiting for the
				// initial promise that was attached to the
				// `_data` member at creation time.  We'll
				// chain _that_ promise up with our new
				// promise so everyone's happy.
				this._data[name].promise = promise
					.then(() => this._data[name].notStartedDfd.resolve())
			}

			return promise;
		}).filter(promise=>{return promise !== null;});

		this.emitChange();
		// should we just use Q.all?

		var dfd = Q.defer();
		// we don't return the result of Q.allSettled so we can hide the loadResults from the caller.
		Q.allSettled(loadPromises).then( (results) => {
			// TODO emitChange here?
			dfd.resolve();
		});
		return dfd.promise;
	}

	//IMPLEMENT THIS IN SUBCLASSES IF NEEDED
	processResponseData(name, responseData) {
		return responseData;
	}

	/**
	 * Action Stuff
	 */
	listenTo (action, callback) {
		this._actionListeners.push(action.onTrigger(callback.bind(this)));
	}

	removeAllActionListeners () {
		this._actionListeners.forEach( hdl => hdl.remove() );
		this._actionListeners = [];
		Object.keys(this._data).forEach( storeName => {
			var store = this._data[storeName].store;
			if (store) store.removeAllActionListeners();
		})
	}

	/*
	 * Store event stuff
	 */

	addChangeListener(callback) {
		this._emitter.on(CHANGE_EVENT, callback);
	}

	removeChangeListener(callback) {
		this._emitter.removeListener(CHANGE_EVENT, callback);
	}

	emitChange() {	
		this._emitter.emit(CHANGE_EVENT, this.constructor);
	}
}

// mixin for components that use an extended BaseStore as their top level store
// assumes the store is passed in on the props as 'store'
// TODO - is this too restrictive? maybe we do want multiple change handlers for different stores?

var loggerCscm = require('../logging').getLogger(__LOGGER__({
	label: 'ComponentStoreChangeMixin'
}));

BaseStore.ComponentStoreChangeMixin = {
	componentDidMount: function () {
		this.props.store.addChangeListener(this.__BaseStore_storeChange);
	},

	componentWillReceiveProps: function (nextProps) {
		var oldStore = this.props.store;
		var newStore = nextProps.store;
		if (newStore !== oldStore) {
			oldStore.removeChangeListener(this.__BaseStore_storeChange);
			newStore.addChangeListener(this.__BaseStore_storeChange);
		}
	},

	componentWillUnmount: function () {
		this.props.store.removeChangeListener(this.__BaseStore_storeChange);
	},

	// funky name so that we don't prevent implementers from using
	// the function name if they want
	__BaseStore_storeChange: function () {
		try {
			this.forceUpdate();
		} catch (e) {
			loggerCscm.error("Error occurred during component update", e);
		}
	}
}

// this helper component takes in a BaseStore as this.props.store and passes along the properties to 
// the child components.
BaseStore.Component = React.createClass({
	mixins: [BaseStore.ComponentStoreChangeMixin],

	render: function() {
		var child = React.Children.only(this.props.children);
		// TODO: take this line out when context is moved to local storage.
		child = React.addons.cloneWithProps(child, {context: this.props.context});

		var names = this.props.names || this.props.store.getNames();

		return this._addPropsToElement(child, names);

	},

	_addPropsToElement(element, names) {
		var propsToMixin = {};
		names.forEach((name) => {propsToMixin[name] = this.props.store.get(name);});

		return React.addons.cloneWithProps(element, propsToMixin);
	}
});

BaseStore.LoadState = {
	NOT_STARTED: {},
	LOADING: {},
	DONE: {},
	ERROR: {}
}

module.exports = BaseStore;
