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
    CHANGE_EVENT = 'change';


class BaseStore {

	constructor (loader) {
		this._emitter = new EventEmitter();

		this._loader = loader;
		this._loadResults = {};
		this._loadStatuses = {};
		this._urls = {};
		this._dataLoaderNames = [];
		this._childStoreNames = [];
		this._childStores = {};
		this._isDone = false;
		this._actionListeners = [];
	}

	addDataUrl(name, url) {
		this._dupeCheckLoaderName(name);

		this._dataLoaderNames.push(name);
		this._urls[name] = url;
		this._loadStatuses[name] = BaseStore.LoadState.NOT_STARTED;
	}

	addChildStore(name, store) {
		this._dupeCheckLoaderName(name);

		this._childStoreNames.push(name);
		this._childStores[name] = store;
		store.addChangeListener(this.emitChange.bind(this));
	}

	getLoadStatus(field) {
		if (this._childStores[field]) {
			throw (field + " is a child store, not a data loader. Check the child store's status");
		}
		return this._loadStatuses[field];
	}

	getIsReady(field) {
		return this.getLoadStatus(field) === BaseStore.LoadState.DONE;
	}

	getIsDone() {
		return this._isDone;
	}

	get(field) {
		if (this._childStores[field]) {
			return this._childStores[field];
		} else {
			//TODO - throw if not ready?
			return this._loadResults[field];	
		}
	}

	_dupeCheckLoaderName(name) {
		if (this._urls[name]) {
			logger.debug("Dataloader already exists with name " +name);
			throw ("Dataloader already exists with name " +name);
		} else if (this._childStoreNames[name]) {
			logger.debug("Child store already exists with name " +name);
			throw ("Child store already exists with name " +name);
		}
	}

	_handleLoadResult(name, result) {
		 // TODO should we hold onto the raw result?		 
		try {
			this._loadResults[name] = this.processResponseData(name, result);
			this._loadStatuses[name] = BaseStore.LoadState.DONE;
		} catch(err) {
			this._loadResults[name] = result;
			this._loadStatuses[name] = BaseStore.LoadState.ERROR;
			logger.error('Failed _handleLoadResult', err);
			throw err;
		}		
	}

	_loadByName(name) {
		var url = this._urls[name];
		var t0 = new Date;
		logger.debug("requesting " + name + ": " + url);
		this._loadStatuses[name] = BaseStore.LoadState.LOADING;

		var cachedResult = this._loader.checkLoaded(url); 
		if (cachedResult) {
			this._handleLoadResult(name, cachedResult.getData());
			// returning null is OK because we filter out nulls in loadData,
			// and Q.allSettled with an empty array is resolved immediately
			return null;
		} else {
			return this._loader.load(url).then(result => {
				logger.debug("completed " + name + ": " + url);
				logger.time(`loadByName.success.${name}`, new Date - t0);
				this._handleLoadResult(name, result);
				this.emitChange();		
			}, err => {
				logger.error("error " + name + ": " + url, err);
				logger.time(`loadByName.error.${name}`, new Date - t0);
				this._loadStatuses[name] = BaseStore.LoadState.ERROR;
				this.emitChange();
			});
		}
	}

	loadData () {
		if (this._dataLoaderNames.length < 1 && this._childStoreNames.length < 1) {
			throw ("Can't load data with 0 URLs and 0 child stores");
		}
		var nullUrls = this._dataLoaderNames.filter(name => {
			return (name === null || name === undefined || !this._urls[name])
		});		
		if (nullUrls.length > 0) {
			throw ("Can't load data from null or undefined urls. urls=" + this._urls);			
		}

		// kick off requests and store the promises
		var loadPromises = this._dataLoaderNames.map(name => {
			return this._loadByName(name);
		}).filter(promise=>{return promise !== null});

		var childStoreLoadPromises = this._childStoreNames.map(name => {
			var childStore = this._childStores[name];
			logger.debug("loading Child Store " + name);
			return childStore.loadData()
		})

		loadPromises = loadPromises.concat(childStoreLoadPromises);

		this.emitChange();
		// should we just use Q.all?

		var dfd = Q.defer();
		// we don't return the result of Q.allSettled so we can hide the loadResults from the caller.
		Q.allSettled(loadPromises).then( (results) => {
			this._isDone = true;
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
		this._childStoreNames.forEach( storeName => {
			this._childStores[storeName].removeAllActionListeners();
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

var debugCscm = require('debug')('rf:BaseStore.ComponentStoreChangeMixin');

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
			debugCscm("Error occurred during component update: " + e, e);
		}
	}
}

BaseStore.LoadState = {
	NOT_STARTED: {},
	LOADING: {},
	DONE: {},
	ERROR: {}
}

module.exports = BaseStore;
