module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var common = __webpack_require__(1);
	
	common.middleware = __webpack_require__(2)
	module.exports = common;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	// the common object model of triton on server and client -sra.
	
	module.exports = {
		page: __webpack_require__(7),
		baseStore: __webpack_require__(8),
		link: __webpack_require__(9),
		actions: __webpack_require__(14),
		objectGraph: __webpack_require__(10),
		enums: __webpack_require__(11),
		bundleNameUtil: __webpack_require__(12),
		config: __webpack_require__(13)
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	
	var debug = __webpack_require__(3)('rf:renderMiddleware'),
		React = __webpack_require__(4),
		AppRoot = React.createFactory(__webpack_require__(15)),
		RequestContext = __webpack_require__(16),
		ClientCssHelper = __webpack_require__(17),
		Q = __webpack_require__(5),
		config = __webpack_require__(13),
		superagent = __webpack_require__(6);
	
	
	// TODO FIXME ?? 
	// It *might* be worthwhile to get rid of all the closure-y things in render()
	// https://developers.google.com/speed/articles/optimizing-javascript
	
	var DATA_LOAD_WAIT = 250;
	
	
	
		function Renderer(context) {"use strict";
			this.context = context;
			this.router = context.router;
			this.$Renderer_userDataPromise = context.loadUserData();
		}
	
		Renderer.prototype.render=function(handlerResult) {"use strict";
			debug("Triggering userData load");
			beginRender(req, res, start, context, this.$Renderer_userDataPromise, handlerResult);
		};
	
	
	
	
	/**
	 * renderMiddleware entrypoint. Called by express for every request.
	 */
	module.exports = function(routes, $__0) {var superAgentExtender=$__0.superAgentExtender;
		if (superAgentExtender) {
			superAgentExtender(superagent);
		}
		return function (req, res, next) {
	
			var start = new Date();
	
			debug('request: ', req.path);
	
			// TODO? pull this context building into its own middleware
			var context = new RequestContext.Builder()
					.setRoutes(routes)
					.setLoaderOpts({}) // TODO FIXME
					.setDefaultXhrHeadersFromRequest(req)
					.create({
						// TODO: context opts?
					});
	
			// setup navigation handler (TODO: should we have a 'once' version?)
			context.onNavigate( function(err, result)  {
	
				if (err) {
					debug("There was an error:", err);
					if (err.status && err.status === 404) {
						next();
					} else if (err.status === 301 || err.status === 302) {
						res.redirect(err.status, err.redirectUrl);
					} else {
						next(err);
					}
					return;
				}
	
				debug('Executing navigate action');
				
				var userDataPromise = context.loadUserData();
				beginRender(req, res, start, context, userDataPromise, result);
	
			});
	
			context.navigate({path: req.path});
	
		}
	}
	
	function beginRender(req, res, start, context, userDataDfd, navigateResult) {
	
		var routeName = context.navigator.getCurrentRoute().name;
	
		debug("Route Name", routeName);
	
		// regardless of what happens, write out the header part
		// TODO: should this include the common.js file? seems like it
		// would give it a chance to download and parse while we're loading
		// data
		writeHeader(req, res, routeName, navigateResult.pageObject);
	
		var doRenderCallback = function () {
	
			// user data should never be the long pole here.
			userDataDfd.done(function () {
				writeBodyAndData(req, res, context, start, navigateResult);
				setupLateArrivals(req, res, context, start);
			});
		}
	
		// TODO: we probably want a "we're not waiting any longer for this"
		// timeout as well, and cancel the waiting deferreds
	
		var timeoutExceeded = false;
	
		// set up a maximum wait time for data loading.
		// if this timeout fires, we render with whatever we have,
		// as best as possible
		var loadWaitHdl = setTimeout(function () {
			debug("Timeout Exceeeded. Rendering...");
			timeoutExceeded = true;
			doRenderCallback();
		}, DATA_LOAD_WAIT);
	
		// if we happen to load all data before the timeout is exceeded,
		// we clear the timeout, and just render. If this fires after the
		// timeout is exceeded, it's a no-op
		// use .done(...) to propagate caught exceptions properly
		var loader = context.loader;
		loader.whenAllPendingResolve().done(function () {
			if (!timeoutExceeded) {
				debug("Data loaded. Rendering...");
				clearTimeout(loadWaitHdl);
				doRenderCallback();
			}
		});
	
	}
	
	function writeHeader(req, res, routeName, pageObject) {
		debug('Sending header');
		res.type('html');
	
		var pageHeader = "<!DOCTYPE html><html><head>"
			// TODO: we should allow title to be a deferred
			+ renderTitle(pageObject) + "\n"
			+ renderStylesheets(pageObject) + "\n"
			+ renderScripts(pageObject) + "\n"
			+ renderMetaTags(pageObject) + "\n"
			+ "</head><body class='route-" + routeName + "'><div id='content'>";
		res.write(pageHeader);
	}
	
	function renderTitle (pageObject) {
		return "<title>" + (pageObject.getTitle() || "Navtej's Awesome Test Page") + "</title>";
	}
	
	function renderMetaTags (pageObject) {
		var metaTags = [ {charset: 'utf-8'} ];
	
		var pageMetaTags = pageObject.getMetaTags();
		if (pageMetaTags.length > 0) {
			metaTags = metaTags.concat(pageMetaTags);
		}
	
		return metaTags.map( function(tagData)  {
			// TODO: escaping
			var tag = '<meta ';
			tag += Object.keys(tagData).map( function(metaAttrName)  {
				return metaAttrName + '="' + tagData[metaAttrName] + '"';
			}).join(' ');
			tag += '>';
			return tag;
		}).join("\n");
	}
	
	function renderScripts(pageObject) {
		// default script
		var scripts = pageObject.getHeadScriptFiles();
		if (scripts && !Array.isArray(scripts)) {
			scripts = [scripts];
		}
	
		return scripts.map( function(scriptPath)  {
			// make sure there's a leading '/'
			return '<script src="' + scriptPath +'"></script>'
		}).join("\n");
	
	
	}
	
	function renderStylesheets (pageObject) {
		var stylesheet = pageObject.getHeadStylesheet();
		if (!stylesheet) {
			return "";
		}
		return '<link rel="stylesheet" type="text/css" href="' + stylesheet + '" id="'+ ClientCssHelper.PAGE_CSS_NODE_ID + '">' 
	}
	
	
	function writeBodyAndData(req, res, context, start, navigateResult) {
	
		debug("Rendering AppRoot.");
		var html = React.renderToString(AppRoot({
			childComponent: navigateResult.component,
			context: context,
			pageStore: navigateResult.pageObject.getPageStore()
		}));
	
		res.write(html);
	
		debug('Exposing context state');
		res.expose(context.dehydrate(), 'InitialContext');
		res.expose(getNonInternalConfigs(), "Config");
	
	
		res.write("</div>"); // <div id="content">
	
		var pageFooter = ""
			+ "<script> " + res.locals.state + "; window.initialRenderDfd = window.rfBootstrap();</script>";
	
		res.write(pageFooter);
	
		debug("Content Written: " + (new Date().getTime() - start.getTime()) + "ms");
	}
	
	function setupLateArrivals(req, res, context, start) {
		var loader = context.loader;
		var notLoaded = loader.getPendingRequests();
	
		notLoaded.forEach( function(pendingRequest)  {
			pendingRequest.entry.dfd.promise.then( function(data)  {
				debug("Late arrival: " + pendingRequest.url + ". Arrived " + (new Date().getTime() - start.getTime()) + "ms after page start.");
				res.write("<script>window.initialRenderDfd.done(function () { window.context.loader.lateArrival(\"" + pendingRequest.url + "\", " + JSON.stringify(data) + "); });</script>");
			})
		});
	
		// TODO: maximum-wait-time-exceeded-so-cancel-pending-requests code
		var promises = notLoaded.map( function(result)  {return result.entry.dfd.promise;} );
		Q.allSettled(promises).then(function () {
			res.end("</body></html>");
			debug("All Done: " + (new Date().getTime() - start.getTime()) + "ms");
		});
	}
	
	function getNonInternalConfigs() {
		var nonInternal = {};
		Object.keys(config).forEach( function(configKey)  {
			if (configKey !== 'internal') {
				nonInternal[configKey] = config[configKey];
			}
		});
		return nonInternal;
	}


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("debug");

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("react");

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("q");

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("superagent");

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	
	
	
		function PageObject(context, route) {"use strict";
			if (!context) {
				throw new Error("'context' parameter is required for PageObject");
			}
			if (!route) {
				throw new Error("'route' parameter is required for PageObject");
			}
			this.$PageObject_context = context;
			this.$PageObject_route = route;
		}
	
		PageObject.prototype.getTitle=function()  {"use strict";
			warnDefaultImplementation(this, "getTitle");
			return "";
		};
	
		PageObject.prototype.getHeadScriptFiles=function()  {"use strict";
			return [];
		};
	
		// singular, for now
		PageObject.prototype.getHeadStylesheet=function()  {"use strict";
			return "";
		};
	
		PageObject.prototype.getCanonicalUrl=function()  {"use strict";
			return "";
		};
	
		PageObject.prototype.getMetaTags=function()  {"use strict";
			return [];
		};
	
	
	
	// class Stylesheet {
	
	// 	constructor (href, extraOpts) {
	// 		this._href = herf;
	// 		this._extraOpts = extraOpts;
	// 	}
	
	// 	toString () {
	// 		var tag = '<link rel="stylesheet" type="text/css" href="' + this._href + '"' 
	// 		Object.keys(this._extraOpts, (key) => {
	// 			tag += ' ' + key + '="' + this._extraOpts[key] + '"';
	// 		});
	// 		tag += '>';
	// 	}
	
	// }
	
	// TODO: we're going to have more than one kind of tag...
	
	
		function MetaTag(name, content, extraOpts) {"use strict";
			this.$MetaTag_name = name;
			this.$MetaTag_content = content;
			this.$MetaTag_extraOpts = extraOpts || {};
		}
	
		MetaTag.prototype.toString=function()  {"use strict";
			// TODO: escaping
			var tag = '<meta name="' + this.$MetaTag_name + '" content="' + this.$MetaTag_content + '"';
			Object.keys(this.$MetaTag_extraOpts, function(key)  {
				tag += ' ' + key + '="' + this.$MetaTag_extraOpts[key] + '"';
			}.bind(this));
			tag += '>';
		};
	
	
	
	function warnDefaultImplementation (instance, functionName) {
		if (process.env.NODE_ENV !== "production") {
			var debug = __webpack_require__(3)('rf:PageObject');
			debug("WARNING: PageObject implementor doesn't override " + functionName, instance);
		}
	}
	
	module.exports = PageObject;
	module.exports.MetaTag = MetaTag;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2014, Yahoo! Inc.
	 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
	 * 
	 * converted to ES6 syntax by Redfin; dropped interaction with dispatcher.
	 */
	// 'use strict';
	
	var debug = __webpack_require__(3)('rf:BaseStore'),
		EventEmitter = __webpack_require__(18).EventEmitter,
		Q = __webpack_require__(5),
	    CHANGE_EVENT = 'change';
	
	
	
	
		function BaseStore(context) {"use strict";
			this.$BaseStore_emitter = new EventEmitter();
	
			this.$BaseStore_loader = context.loader;
			this.$BaseStore_loadResults = {};
			this.$BaseStore_loadStatuses = {};
			this.$BaseStore_urls = {};
			this.$BaseStore_dataLoaderNames = [];
			this.$BaseStore_childStoreNames = [];
			this.$BaseStore_childStores = {};
			this.$BaseStore_isDone = false;
			this.$BaseStore_actionListeners = [];
		}
	
		BaseStore.prototype.addDataUrl=function(name, url) {"use strict";
			this.$BaseStore_dupeCheckLoaderName(name);
	
			this.$BaseStore_dataLoaderNames.push(name);
			this.$BaseStore_urls[name] = url;
			this.$BaseStore_loadStatuses[name] = BaseStore.LoadState.NOT_STARTED;
		};
	
		BaseStore.prototype.addChildStore=function(name, store) {"use strict";
			this.$BaseStore_dupeCheckLoaderName(name);
	
			this.$BaseStore_childStoreNames.push(name);
			this.$BaseStore_childStores[name] = store;
			store.addChangeListener(this.emitChange.bind(this));
		};
	
		BaseStore.prototype.getLoadStatus=function(field) {"use strict";
			if (this.$BaseStore_childStores[field]) {
				throw (field + " is a child store, not a data loader. Check the child store's status");
			}
			return this.$BaseStore_loadStatuses[field];
		};
	
		BaseStore.prototype.getIsReady=function(field) {"use strict";
			return this.getLoadStatus(field) === BaseStore.LoadState.DONE;
		};
	
		BaseStore.prototype.getIsDone=function() {"use strict";
			return this.$BaseStore_isDone;
		};
	
		BaseStore.prototype.get=function(field) {"use strict";
			if (this.$BaseStore_childStores[field]) {
				return this.$BaseStore_childStores[field];
			} else {
				//TODO - throw if not ready?
				return this.$BaseStore_loadResults[field];	
			}
		};
	
		BaseStore.prototype.$BaseStore_dupeCheckLoaderName=function(name) {"use strict";
			if (this.$BaseStore_urls[name]) {
				debug("Dataloader already exists with name " +name);
				throw ("Dataloader already exists with name " +name);
			} else if (this.$BaseStore_childStoreNames[name]) {
				debug("Child store already exists with name " +name);
				throw ("Child store already exists with name " +name);
			}
		};
	
		BaseStore.prototype.$BaseStore_handleLoadResult=function(name, result) {"use strict";
			 // TODO should we hold onto the raw result?		 
			try {
				this.$BaseStore_loadResults[name] = this.processResponseData(name, result);
				this.$BaseStore_loadStatuses[name] = BaseStore.LoadState.DONE;
			} catch(err) {
				this.$BaseStore_loadResults[name] = result;
				this.$BaseStore_loadStatuses[name] = BaseStore.LoadState.ERROR;
				debug(err);
				throw err;
			}		
		};
	
		BaseStore.prototype.$BaseStore_loadByName=function(name) {"use strict";
			var url = this.$BaseStore_urls[name];
			debug("requesting " + name + ": " + url);
			this.$BaseStore_loadStatuses[name] = BaseStore.LoadState.LOADING;
	
			var cachedResult = this.$BaseStore_loader.checkLoaded(url); 
			if (cachedResult) {
				this.$BaseStore_handleLoadResult(name, cachedResult.getData());
				return null;
			} else {
				return this.$BaseStore_loader.load(url).then(function(result)  {
					debug("completed " + name + ": " + url);
					this.$BaseStore_handleLoadResult(name, result);
					this.emitChange();		
				}.bind(this), function(err)  {
					debug("error " + name + ": " + url);
					debug(err);
					this.$BaseStore_loadStatuses[name] = BaseStore.LoadState.ERROR;
					this.emitChange();
				}.bind(this));
			}
		};
	
		BaseStore.prototype.loadData=function()  {"use strict";
			if (this.$BaseStore_dataLoaderNames.length < 1 && this.$BaseStore_childStoreNames.length < 1) {
				throw ("Can't load data with 0 URLs and 0 child stores");
			}
			var nullUrls = this.$BaseStore_dataLoaderNames.filter(function(name)  {
				return (name === null || name === undefined || !this.$BaseStore_urls[name])
			}.bind(this));		
			if (nullUrls.length > 0) {
				throw ("Can't load data from null or undefined urls. urls=" + this.$BaseStore_urls);			
			}
	
			// kick off requests and store the promises
			var loadPromises = this.$BaseStore_dataLoaderNames.map(function(name)  {
				return this.$BaseStore_loadByName(name);
			}.bind(this)).filter(function(promise){return promise !== null});
	
			var childStoreLoadPromises = this.$BaseStore_childStoreNames.map(function(name)  {
				var childStore = this.$BaseStore_childStores[name];
				debug("loading Child Store " + name);
				return childStore.loadData()
			}.bind(this))
	
			loadPromises = loadPromises.concat(childStoreLoadPromises);
	
			this.emitChange();
			// should we just use Q.all?
	
			var dfd = Q.defer();
			// we don't return the result of Q.allSettled so we can hide the loadResults from the caller.
			Q.allSettled(loadPromises).then(function(results) {
				this.$BaseStore_isDone = true;
				// TODO emitChange here?
				dfd.resolve();
			});
			return dfd;
		};
	
		//IMPLEMENT THIS IN SUBCLASSES IF NEEDED
		BaseStore.prototype.processResponseData=function(name, responseData) {"use strict";
			return responseData;
		};
	
		/**
		 * Action Stuff
		 */
		BaseStore.prototype.listenTo=function(action, callback) {"use strict";
			this.$BaseStore_actionListeners.push(action.onTrigger(callback.bind(this)));
		};
	
		BaseStore.prototype.removeAllActionListeners=function()  {"use strict";
			this.$BaseStore_actionListeners.forEach( function(hdl)  {return hdl.remove();} );
			this.$BaseStore_actionListeners = [];
			this.$BaseStore_childStoreNames.forEach( function(storeName)  {
				this.$BaseStore_childStores[storeName].removeAllActionListeners();
			}.bind(this))
		};
	
		/*
		 * Store event stuff
		 */
	
		BaseStore.prototype.addChangeListener=function(callback) {"use strict";
			this.$BaseStore_emitter.on(CHANGE_EVENT, callback);
		};
	
		BaseStore.prototype.removeChangeListener=function(callback) {"use strict";
			this.$BaseStore_emitter.removeListener(CHANGE_EVENT, callback);
		};
	
		BaseStore.prototype.emitChange=function() {"use strict";	
			this.$BaseStore_emitter.emit(CHANGE_EVENT, this.constructor);
		};
	
	
	// mixin for components that use an extended BaseStore as their top level store
	// assumes the store is passed in on the props as 'store'
	// TODO - is this too restrictive? maybe we do want multiple change handlers for different stores?
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
			this.forceUpdate();
		}
	}
	
	BaseStore.LoadState = {
		NOT_STARTED: {},
		LOADING: {},
		DONE: {},
		ERROR: {}
	}
	
	module.exports = BaseStore;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	
	var React = __webpack_require__(4);
	
	var Link = module.exports = React.createClass({
		displayName: 'Link',
	
		propTypes: {
			context: React.PropTypes.object.isRequired,
			path: React.PropTypes.string.isRequired
		},
	
		render: function () {
			return (
				React.createElement("a", {href: '/r3s' + this.props.path, onClick: this._onClick}, this.props.children)
			);
		},
	
		_onClick: function (e) {
	
			// TODO: IE8-9 detection
	
			// TODO: if OSX && key.isMeta? 
			if (!e.metaKey) {
				e.preventDefault();
				e.stopPropagation();
				this.props.context.navigate({path: '/r3s' + this.props.path});	
			} else {
				// do normal browser navigate
			}
			
		}
	})


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	function isArray(it){
		// summary:
		//		Return true if it is an Array.
		//		Does not work on Arrays created in other windows.
		// it: anything
		//		Item to test.
		return it && (it instanceof Array || typeof it == "array"); // Boolean
	}
	
	function isFunction(it){
		// summary:
		//		Return true if it is a Function
		// it: anything
		//		Item to test.
		return Object.prototype.toString.call(it) === "[object Function]";
	}
	
	function isObject(it){
		// summary:
		//		Returns true if it is a JavaScript object (or an Array, a Function
		//		or null)
		// it: anything
		//		Item to test.
		return it !== undefined &&
			(it === null || typeof it == "object" || isArray(it) || isFunction(it)); // Boolean
	}
	
	
	module.exports = (function(){
		function ObjectGraph(data, creationCallback) {"use strict";
			this.$ObjectGraph_types = data.__types;
			this.$ObjectGraph_global_attribute_names = data.__att_names;
			
			var globalIds = {};
	
			// It's sometimes the case (see CFDR annd DealRoomController.java) that ObjectGraph is 
			// used to deserialize data that has been serialized using a hybrid of ModelFactoryBuilder-style
			// serializations and straight-up GSON serializations.  To allow the latter to deserialize properly,
			// we simply return "data" in the case that a __root cannot be detected.
			if (data.__root == null) {
				this.$ObjectGraph_root = data;
			} else {
				this.$ObjectGraph_root = this.$ObjectGraph_recursiveHydrate(data.__root, globalIds, creationCallback);
			}
			this.$ObjectGraph_recursiveResolve(this.$ObjectGraph_root, globalIds, creationCallback);
		}
		
		ObjectGraph.prototype.getRoot=function()  {"use strict"; 
			return this.$ObjectGraph_root;
		};
				
		// this method takes in the raw JSON object tree and returns a "hydrated" version of the tree.  note that the 
		// tree passed in is NOT modified; a parallel tree is created.  every object and array in the original is 
		// translated to the result.  objects that have a __type are instantiated using that constructor.  $ref references
		// are not resolved, but all of the global ids are added to globalIds, which is a map of id to object -sra.
		ObjectGraph.prototype.$ObjectGraph_recursiveHydrate=function(node, globalIds, creationCallback) {"use strict";
			if (node == null) {
				// If null, no need to do anything. -shahaf.
				return node;
			} else if (isArray(node)) {
				// arrays we just copy over into a new array, but we call hydrate on each of their members -sra.
				var newArray = node.map(function(item)  {
					return this.$ObjectGraph_recursiveHydrate(item, globalIds, creationCallback);
				}.bind(this));
				return newArray;
			} else if (isObject(node)) {
				// for objects, we copy all the values over into newNodeData, then if there's a type,
				// we hydrate the type with newNodeData.  if not, we just use newNodeData.
				var newNodeData = {};
				var result = {};					
				var globalId;
				
				//MES- Untyped objects have attributes "directly" mapped into them.  Typed objects can ALSO have 
				//	have "directly" mapped attributes (if the type is "extended" with additional information.)
				for (var name in node) {
					//MES- Store the global ID, if that's what we found
					if (name === '__g_id') {
						globalId = node[name];
					}
					//MES- Ignore the other special "typed" fields
					else if (name === '__t_idx' || name === '__atts') {
						//MES- Ignore
					}
					else {
						//MES- This is an att we care about, tack it on.
						newNodeData[name] = this.$ObjectGraph_recursiveHydrate(node[name], globalIds, creationCallback);
					}
				}
	
				//MES- Is this object typed?  Typed objects are rehydrated based on an array of attribute values.
				if (undefined !== node.__t_idx) {
					//MES- Typed!
					var typeIdx = parseInt(node.__t_idx);
					var jsType = this.$ObjectGraph_types[typeIdx];
					var childNode = node.__atts;
					
					var numChildren = childNode.length;
					var typeFields = this.$ObjectGraph_global_attribute_names[typeIdx];
					for (var i = 0; i < numChildren; ++i) {
						var fieldName = typeFields[i];
						newNodeData[fieldName] = this.$ObjectGraph_recursiveHydrate(childNode[i], globalIds, creationCallback);
					}
	
					// all of our children have been hydrated; time to hydrate ourself -sra.
					var jsConstructor = null; //lang.getObject(jsType); //NSS TODO - disabled the object constructor thing here.
					/*if (!jsConstructor) {
					            // for dojo 1.8/AMD-style modules. This will failr if it hasn't been required by something else already.
						try {
						    jsConstructor = require(jsType.replace(/\./g, "\/")); // convert to AMD module definition by swapping out '.' for '/'
						} catch(e) {
							// error is printed out in next line
							jsConstructor = null;
						}
					}
					if (!jsConstructor) {
					         console.error("The type '" + jsType + "' could not be instantiated.  Have you dojo.required it?");
					}
					
					result = new jsConstructor(newNodeData);*/
					result = newNodeData;
					
					if (typeof(creationCallback) === "function") {
						// Call back about the creation
						creationCallback(result);
					}
				} else {
					result = newNodeData;
				}
				
				// now if there was a globalId, map it to the hydrated object -sra.
				if (globalId) {
					globalIds[globalId] = result;
				}
				return result;
			} else {
				// not an object or an array, not necessary to do anything. -sra.
				return node;
			}
		};
		
		// this method recursively walks an object tree and resolves $ref references.  it acts on the object graph
		// in place.  note that it will only work correctly if the object graph is currently in tree form; that is,
		// it has no cycles in the graph yet. note that $ref objects that are inherited properties will not be resolved,
		// but this shouldn't be a problem for us -sra.
		ObjectGraph.prototype.$ObjectGraph_recursiveResolve=function(node, globalIds) {"use strict";
			if (null === node) {
				return;
			}
			
			if (isArray(node)) {
				// for arrays, just resolve each item.  if the element is a reference, resolve it; otherwise,
				// call recursively. -sra.
				for (var i = 0; i < node.length; i++) {
					var item = node[i];
					if (null != item && isObject(item) && item["$ref"] && globalIds[item["$ref"]]) {
						// the item is a reference object.  resolve it. -sra.
						node[i] = globalIds[item["$ref"]];
					} else {
						// the item is another object; time to go recursive. note that we don't have
						// to put the result back into the array; we just resolve it in place. -sra.
						this.$ObjectGraph_recursiveResolve(item, globalIds);
					}
				}
			} else if (isObject(node)) {
				
				// for objects, resolve each property of the object.  if the property is a reference object, resolve it;
				// otherwise call recursively. -sra.
				for (var name in node) {
					// as an optimization, we only resolve direct properties. if we start using objects with 
					// inheritance chains and assign values on a prototype, then we should reconsider this. 
					// i doubt we will ever put object references onto prototypes, however. -sra.
					// RLG: skip fields starting with _Resettable, as they're not really fields on the object
					if (/^_Resettable.*/.test(name) || !node.hasOwnProperty(name)) {
						continue;
					}
	
					var value = node[name];
					if (null === value || isFunction(value)) {
						continue;
					}
					if (isObject(value) && value["$ref"] && globalIds[value["$ref"]]) {
						// the value is a reference object.  resolve it. -sra.
						node[name] = globalIds[value["$ref"]];
						
						/*if (isFunction(node.isInstanceOf) && node.isInstanceOf(_Resettable)) {
							// if we're a _Resettable, update the reset data for property on the object
							node._Resettable_resetData[name] = node[name];
						}*/
						
					} else if (isArray(value) || isObject(value)){
						// the value is another object; time to go recursive. note that we don't have
						// to assign to node[name]; we just resolve it in place. -sra.
						this.$ObjectGraph_recursiveResolve(value, globalIds);
						
						// in this case, we're not changing the reference to the object, so we don't need to update
						// _Resettable_resetData, since it only holds references
					}
				}
			}
		};
	return ObjectGraph;})()


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	
	var debug = __webpack_require__(3)('rf:enums'),
		superagent = __webpack_require__(6),
		Q = __webpack_require__(5);
	
	// ADD ENUMS TO INCLUDE HERE
	
	var enumMap = {
		Feature: 'g_feature',
		FavoritePropertyType: 'g_favoritePropertyType',
		ApiResultCode: 'g_apiResultCode'
	};
	
	
	/// END ADD ENUMS HERE
	
	
	var _dfd = null;
	
	var enums = {
		init: function () {
			// subsequent calls return the same dfd
			if (_dfd) return _dfd.promise;
	
			var dfd = _dfd = Q.defer();
	
			var req = superagent
				.get('/stingray/do/js/v56.0/EnumDefinitions.js');
	
			if (true) {
				req = req.buffer();
			}
				
			req.end( function(res)  {
	
				if (!res.ok) {
					console.error(res.text);
					throw Error('Error loading EnumDefinitions on startup');
				}
	
				debug("Executing Hack...");
	
				var enumDefs = Object.keys(enumMap).reduce( function(accum, key)  {
					if (accum !== "") {
						accum += ",";
					}
					return accum + key + ":" + enumMap[key];
				}, "");
	
				var hack = new Function(res.text + "; return {" + enumDefs + "}");
	
				debug("Hack Executed");
	
				// *copy* each loaded enum returned from our hack onto the appropriate
				// enum on the exported enums object. This allows us to reference a particular
				// enum object at require-time, but not have it filled in until a little later
				var loadedEnums = hack();
	
				Object.keys(loadedEnums).forEach( function(enumName)  {
					var loadedEnum = loadedEnums[enumName];
					Object.keys(loadedEnum).forEach( function(enumObjectPropName)  {
						enums[enumName][enumObjectPropName] = loadedEnum[enumObjectPropName];
					})
				});
	
				dfd.resolve();
			});
	
			return dfd.promise;
	
		}
	
	}
	
	// create a placeholder object on the enums export so that they can be referenced
	// at module-require time. We'll fill it in when enums.init() is run
	Object.keys(enumMap).forEach( function(key)  {
		enums[key] = {};
	});
	
	
	module.exports = enums;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	
	var JS_BUNDLE_SUFFIX = ".bundle.js";
	var CSS_ROLLUP_SUFFIX = ".styles.css";
	
	function getEntryPointNameFromRouteName (routeName) {
		return routeName + "Page";
	}
	
	module.exports = {
	
		JS_BUNDLE_SUFFIX: JS_BUNDLE_SUFFIX,
		CSS_ROLLUP_SUFFIX: CSS_ROLLUP_SUFFIX,
	
		getEntryPointNameFromRouteName: getEntryPointNameFromRouteName,
	
		getJsBundleFromRouteName: function (routeName) {
			return getEntryPointNameFromRouteName(routeName) + JS_BUNDLE_SUFFIX;
		},
	
		getCssRollupNameFromRouteName: function (routeName) {
			return getEntryPointNameFromRouteName(routeName) + CSS_ROLLUP_SUFFIX;
		}
	
	}


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Thin wrapper around the environment-specific configuration file
	 */
	
	if (true) {
	
	(function () {
	
		if (!process.env.R3S_CONFIGS) {
			throw 'R3S_CONFIGS environment variable required to start server.';
		}
	
		var fs = __webpack_require__(19);
		var configFile = fs.readFileSync(process.env.R3S_CONFIGS + "/config.json");
		module.exports = Object.freeze(JSON.parse(configFile));
	
	})();
	
	} else {
	
	(function () {
	
		var env = module.exports = {
	
			rehydrate: function (inputEnv) {
				Object.keys(inputEnv).forEach( function(key)  {
					env[key] = inputEnv[key];
				});
	
				// janky: remove the 'rehydrate' method from
				// the environment module after it's used
				delete env.rehydrate;
			}
		};
	
	})();
	
	}


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	
	var EventEmitter = __webpack_require__(18).EventEmitter;
	
	for(var EventEmitter____Key in EventEmitter){if(EventEmitter.hasOwnProperty(EventEmitter____Key)){Action[EventEmitter____Key]=EventEmitter[EventEmitter____Key];}}var ____SuperProtoOfEventEmitter=EventEmitter===null?null:EventEmitter.prototype;Action.prototype=Object.create(____SuperProtoOfEventEmitter);Action.prototype.constructor=Action;Action.__superConstructor__=EventEmitter;function Action(){"use strict";if(EventEmitter!==null){EventEmitter.apply(this,arguments);}}
	
		Action.prototype.trigger=function(payload) {"use strict";
			if (true) {
				throw "Can't trigger events server-side!";
			}
			this.emit('trigger', payload);
		};
	
		Action.prototype.triggerAsync=function(payload) {"use strict";
			if (true) {
				throw "Can't trigger events server-side!";
			}
			setTimeout( function()  {
				this.trigger(payload);
			}.bind(this), 0);
		};
	
		Action.prototype.onTrigger=function(callback) {"use strict";
			if (true) {
				// ignore
				return;
			}
			this.addListener('trigger', callback);
	
			return {
				remove: function()  {
					this.removeListener('trigger', callback);				
				}.bind(this)
			};
		};
	
	
	
	/**
	 * The API defined here loosely matches that of reflux.js
	 */
	function createAction() {
		var action = new Action();
	
		var func = function (payload) {
			action.triggerAsync(payload);
		}
	
		func.trigger = action.trigger.bind(action);
		func.triggerAsync = action.triggerAsync.bind(action);
		func.onTrigger = action.onTrigger.bind(action);
	
		return func;
	}
	
	module.exports = {
		createAction: createAction,
		createActions: function (actionNames) {
			var actions = {};
			actionNames.forEach( function(name)  {
				actions[name] = createAction();
			});
			return actions;
		}
	};

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	
	var React = __webpack_require__(4),
		RouterMixin = __webpack_require__(24),
		debug = __webpack_require__(3)('AppRoot');
	
	
	var AppRoot = React.createClass({
		mixins: [RouterMixin],
	
		displayName: "AppRoot",
	
		getInitialState: function () {
			this.navigator = this.props.context.navigator;
			var state = this.navigator.getState();
			state.componentFactory = React.createFactory(this.props.childComponent);
			return state;
		},
	
		// called when re-render is called from the top-level
		componentWillReceiveProps: function (nextProps) {
			if (this.props.pageStore && this.props.pageStore !== nextProps.pageStore) {
				// if the store has updated, disconnect events in the old store
				if (typeof this.props.pageStore.removeAllActionListeners === 'function') {
					this.props.pageStore.removeAllActionListeners();
				}
			}
			var newState = this.navigator.getState();
			newState.componentFactory = React.createFactory(nextProps.childComponent);
			this.setState(newState);
		},
	
		render: function () {
			if (this.state.componentFactory) {
				return (
					React.createElement("div", null, 
						 this.state.componentFactory({ context: this.props.context, store: this.props.pageStore }), 
						 this.state.loading ? React.createElement("div", {className: "loading"}, "LOADING") : ""
					)
				);
			} else {
				return React.createElement("div", null, "Loading From AppRoot.jsx");
			}
		}
	});
	
	module.exports = AppRoot;

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	
	var SuperAgentWrapper = __webpack_require__(20),
		Loader = __webpack_require__(21),
		Bouncer = __webpack_require__(22),
		ObjectGraph = __webpack_require__(10),
		Navigator = __webpack_require__(23),
		Q = __webpack_require__(5);
	
	// TODO FIXME
	var REFERRER_DOMAIN = "http://node.redfintest.com";
	
	
	
		function RequestContext(routes, loaderOpts, defaultHeaders, extraOpts) {"use strict";
	
			// don't include headers client-side (browser has them already)
			if (!(true) || !defaultHeaders) {
				defaultHeaders = {};
			}
			this.superagent = new SuperAgentWrapper(defaultHeaders);
	
			this.loader = new Loader(this /*context */, loaderOpts);
	
			this.navigator = new Navigator(this, routes);
	
			this.$RequestContext_navigateListeners = [];
		}
	
		RequestContext.prototype.loadUserData=function()  {"use strict";
			if (this.$RequestContext_userDataPromise) {
				return this.$RequestContext_userDataPromise
			}
			
			var dfd = Q.defer();
			this.$RequestContext_userDataPromise = dfd.promise;
	
			this.loader
				.load('/stingray/reactLdp/userData')
				.done( function(apiResult)  {
					this.$RequestContext_resolveUserDataRequest(apiResult, dfd)
				}.bind(this));
	
			return this.$RequestContext_userDataPromise;
		};
	
		RequestContext.prototype.$RequestContext_resolveUserDataRequest=function(apiResult, dfd) {"use strict";
			// TODO: what is the equivalent here
			// if (!res.ok) {
			// 	dfd.reject({ message: 'Error', status: res.status, text: res.text });
			// 	return;
			// }
	
			if (apiResult.resultCode) {
				dfd.reject({ message: apiResult.errorMessage });
				return;
			}
	
			var userDataResult = apiResult.payload;
	
			this.$RequestContext_bouncer = new Bouncer(userDataResult.bouncerData);
			this.$RequestContext_userData = new ObjectGraph(userDataResult.userData).getRoot();
	
			dfd.resolve(userDataResult);
		};
	
		RequestContext.prototype.onNavigate=function(callback) {"use strict";
			this.navigator.on('navigateDone', callback);
		};
	
		RequestContext.prototype.navigate=function(navOpts) {"use strict";
			this.navigator.navigate(navOpts);
		};
	
		RequestContext.prototype.getBouncer=function()  {"use strict";
			return this.$RequestContext_bouncer;
		};
	
		RequestContext.prototype.dehydrate=function()  {"use strict";
			return {
				loader: this.loader.dehydrate()
			}
		};
	
		RequestContext.prototype.rehydrate=function(state) {"use strict";
			this.loader.rehydrate(state.loader);
			var loaded = this.loader.checkLoaded('/stingray/reactLdp/userData');
			if (loaded) {
				var dfd = Q.defer();
				this.$RequestContext_userDataPromise = dfd.promise;
				this.$RequestContext_resolveUserDataRequest(loaded.getData(), dfd);
			} else {
				this.loadUserData();
			}
		};
	
	
	
	
	
		function RequestContextBuilder()  {"use strict";
			this.defaultHeaders = {};
			this.loaderOpts = {};
		}
	
		RequestContextBuilder.prototype.setRoutes=function(routes) {"use strict";
			this.routes = routes;
			return this;
		};
	
		RequestContextBuilder.prototype.setDefaultXhrHeadersFromRequest=function(req) {"use strict";
			var defaultHeaders = {};
			if (req) {
				defaultHeaders['Cookie'] = req.get('cookie');
				defaultHeaders['Referer'] = REFERRER_DOMAIN;
			}
			this.defaultHeaders = defaultHeaders;
			return this;
		};
	
		RequestContextBuilder.prototype.setLoaderOpts=function(loaderOpts) {"use strict";
			this.loaderOpts = loaderOpts || {};
			return this;
		};
	
		RequestContextBuilder.prototype.create=function(extraOpts) {"use strict";
	
			return new RequestContext(this.routes, this.loaderOpts, this.defaultHeaders, extraOpts);
		};
	
	
	
	module.exports = RequestContext;
	module.exports.Builder = RequestContextBuilder;
	


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	
	var debug = __webpack_require__(3)('rf:ClientCssHelper');
	
	var pageCssLinkNode;
	var loadedCss = {};
	
	var ClientCssHelper = module.exports = {
	
		PAGE_CSS_NODE_ID: 'CssClientHelper-InitialCSS',
	
		registerPageLoad: function registerPageLoad(routeName) {
			if (true) {
				throw new Error("ClientCssHelper.registerPageLoad can't be called server-side");
			}
			pageCssLinkNode = loadedCss[routeName] = document.getElementById(ClientCssHelper.PAGE_CSS_NODE_ID);
		},
	
		ensureCss: function ensureCss(routeName, pageObject) {
			if (true) {
				throw new Error("ClientCssHelper.registerPageLoad can't be called server-side");
			}
	
			if (pageCssLinkNode === loadedCss[routeName]) {
				debug("No-op: CSS for " + routeName + " is already in use");
				return;
			}
	
			var newCss = pageObject.getHeadStylesheet();
	
			if (!loadedCss[routeName] && newCss) {
				var styleTag = document.createElement('link');
				styleTag.rel = 'stylesheet';
				styleTag.type = 'text/css';
	
				styleTag.href = newCss;
				loadedCss[routeName] = styleTag;
			}
	
			debug('Updating to CSS for: ' + routeName);
			if (pageCssLinkNode) {
				// remove loaded CSS from the DOM
				pageCssLinkNode.parentNode.removeChild(pageCssLinkNode);
			}
	
			if (newCss) {
				// if we have new CSS, then we've already created the node (or)
				// have one from a previous load, so add it to the dom
				pageCssLinkNode = loadedCss[routeName];
				document.head.appendChild(pageCssLinkNode);
			} else {
				pageCssLinkNode = null;
			}
		}
	}


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("events");

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("fs");

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var debug = __webpack_require__(3)('rf:SuperAgentWrapperPlugin'),
		superagent = __webpack_require__(6);
	
	
	/**
	 * SuperAgent proxy object. Used to ensure that Redfin cookies
	 * are set properly when superagent is executed server-side
	 */
	function SuperAgentWrapper(defaultHeaders) {
		this.defaultHeaders = defaultHeaders || {};
	}
	
	
	// Adding a layer of indirection between SuperAgentWrapper and
	// the superagent object so that when we set things on
	// SuperAgentWrapper.prototype we don't actually change superagent's
	// functions
	var superAgentWrapperPrototype = {};
	superAgentWrapperPrototype.prototype = superagent;
	
	// SuperAgentWrapper inherits from the superagent
	// object. Note that this makes it impossible for
	// developers to use the low-level request(<method>, <url>)
	// functionality of superagent.
	SuperAgentWrapper.prototype = superAgentWrapperPrototype;
	
	// Override specific functionality from superagent
	
	SuperAgentWrapper.prototype.get = function (url, data, fn) {
		// we never want to pass fn, because we need to do stuff
		// to the request first
		if ('function' == typeof data) fn = data, data = null;
		var req = superagent.get.call(this, url, data);
		req.set(this.defaultHeaders);
		if (fn) req.end(fn);
		return req;
	}
	
	SuperAgentWrapper.prototype.head = function (url, data, fn){
		if ('function' == typeof data) fn = data, data = null;
		var req = superagent.head.call(this, url, data);
		req.set(this.defaultHeaders);
		if (fn) req.end(fn);
		return req;
	};
	
	SuperAgentWrapper.prototype.del = function (url, fn){
		var req = superagent.del.call(this, url, data);
		req.set(this.defaultHeaders);
		if (fn) req.end(fn);
		return req;
	};
	
	SuperAgentWrapper.prototype.patch = function (url, data, fn){
		if ('function' == typeof data) fn = data, data = null;
		var req = superagent.patch.call(this, url, data);
		req.set(this.defaultHeaders);
		if (fn) req.end(fn);
		return req;
	};
	
	SuperAgentWrapper.prototype.post = function (url, data, fn){
		if ('function' == typeof data) fn = data, data = null;
		var req = superagent.post.call(this, url, data);
		req.set(this.defaultHeaders);
		if (fn) req.end(fn);
		return req;
	};
	
	SuperAgentWrapper.prototype.put = function (url, data, fn){
	  	if ('function' == typeof data) fn = data, data = null;
		var req = superagent.patch.put(this, url, data);
		req.set(this.defaultHeaders);
		if (fn) req.end(fn);
		return req;
	};
	
	module.exports = SuperAgentWrapper;

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	
	var Q = __webpack_require__(5),
		debug = __webpack_require__(3)('rf:Loader'),
		config = __webpack_require__(13);
	
	
	// can't do "export class Loader"
	module.exports = (function(){
	
		function Loader(context, options) {"use strict";
			// super();
	
			this.context = context;
			this.options = options || {};
			this.dataCache = {};
		}
	
		Loader.prototype.dehydrate=function()  {"use strict";
	
			var out = {};
			
			// dehydrate all options, except the 'headers' key,
			// which doesn't make sense client-side
			out.options = {};
			Object.keys(this.options).forEach( function(key)  {
				if (key.toLowerCase() !== 'headers') {
					out.options[key] = this.options[key];
				}
			}.bind(this));
	
			out.dataCache = {};
	
			var dataCache = this.dataCache;
			Object.keys(dataCache).forEach(function (url) {
				var result = {
					loaded: dataCache[url].dfd.promise.isFulfilled(),
					requesters: dataCache[url].requesters
				};
				if (result.loaded) {
					result.data = dataCache[url].data;
				}
				out.dataCache[url] = result;
			});
	
			return out;
	
		};
	
		Loader.prototype.rehydrate=function(state) {"use strict";
	
			debug("REHYDRATING LOADER!!");
	
			if (state.options) {
				this.options = state.options;
			}
	
			// clear state
			var dataCache = this.dataCache = {};
	
	
			Object.keys(state.dataCache).forEach(function (url) {
				var cacheEntry = state.dataCache[url];
				var dfd = Q.defer();
	
				dataCache[url] = { dfd: dfd, requesters: cacheEntry.requesters }
				if (cacheEntry.loaded) {
					dataCache[url].data = cacheEntry.data;
					// immediately resolve
					// TODO: setTimeout, so it's not synchronous?
					// TODO: it appears to be asynchronous w/ or w/o setTimeout?
					//setTimeout(function () {
						dfd.resolve(cacheEntry.data);
					//}, 0);
				}
				
			});
	
		};
		
		Loader.prototype.load=function(urlPattern) {"use strict";
			var actualUrl = this.buildUrl(urlPattern);
	
			if (this.dataCache[actualUrl]) {
				debug("HITTING CACHE, OH YEAH. ");
	
				var cacheEntry = this.dataCache[actualUrl],
					promise = cacheEntry.dfd.promise;
	
				// TODO: should probably figure out how to deep copy the data?
	
				if (true) {
					// server-side, we increment the number of requesters
					// we expect to retrieve the data on the frontend
					cacheEntry.requesters += 1;	
				} else {
					// client-side, whenever someone retrieves data from the cache,
					// we decrement the number of retrievals expected, and when we
					// hit zero, remove the cache entry. 
	
					promise = this.$Loader_requesterDecrementingPromise(promise, actualUrl);
				}
				
				return promise;
			}
	
			var dfd = Q.defer(),
				promise = dfd.promise;
	
			// TODO: make this request cancelable
			this.context.superagent.get(this.$Loader_apiServerPrefix() + actualUrl)
				.end( function(res)  {
	
					debug("Response Came Back!");
	
					// server-side, we cache the response in the dataCache to
					// present to the frontend
					if (true) {
						this.dataCache[actualUrl].loaded = true;
						this.dataCache[actualUrl].data = res.body;
					}
					dfd.resolve(res.body);
				}.bind(this));
			
			if (true) {
				// server-side, we cache the data, and count the number of requesters so
				// that we know how many requests to fulfill client-side
				this.dataCache[actualUrl] = { dfd: dfd, loaded: false, requesters: 1 };
			} else {
				// client-side, we do *nothing* on this code path, because it means
				// that a url was requested that we couldn't serve from our cache, i.e.
				// it was either not previously requested on the backend, or was requested,
				// but we fulfilled our obligations to its requestors. This is a *new* request,
				// and we shouldn't need to cache it (Right?)
				// TODO: it might be cool if two people on the frontend could request the same resource,
				// and if they did it fast enough, they both got the same instance of it. That seems like
				// a P2 though?
			}
			return promise;
		};
	
		/**
		 * Chain a promise with another promise that decrements
		 * the number of expected requesters.
		 */
		Loader.prototype.$Loader_requesterDecrementingPromise=function(promise, actualUrl) {"use strict";
			var dataCache = this.dataCache;
			return promise.then(function (data) {
				dataCache[actualUrl].requesters -= 1;
				debug("Decrementing: ", dataCache[actualUrl]);
				if (dataCache[actualUrl].requesters === 0) {
					delete dataCache[actualUrl];
				}
	
				// since we're adding to the original promise chain,
				// we need to pass the data through
				return data;
	
			}.bind(this));
		};
	
		/**
		 * Synchronously check if data is loaded already.
		 * Returns an object with a getData() function, to
		 * make it possible to check for the existence of a URL
		 * in the cache, but not actually retrieve if (if desired).
		 * Calling getData() will retrieve the data from the cache
		 * and decrement the number of requesters
		 */
		Loader.prototype.checkLoaded=function(urlPattern) {"use strict";
			var actualUrl = this.buildUrl(urlPattern),
				dataCache = this.dataCache,
				cached = dataCache[actualUrl];
	
			if (cached && cached.data) {
				return {
					getData: function () {
						// sort of a synchronous promise thing
						cached.requesters -= 1;
						if (cached.requesters === 0) {
							delete dataCache[actualUrl];
						}
						return cached.data;
					}
				};
			}
			return null;
		};
	
		Loader.prototype.buildUrl=function(urlPattern) {"use strict";
			// keep it dead-simple for now
			if (this.options.id) {
				return urlPattern.replace(/{id}/g, this.options.id);
			} else {
				return urlPattern;
			}
		};
	
		Loader.prototype.getPendingRequests=function()  {"use strict";
			var dataCache = this.dataCache;
	
			return Object.keys(dataCache)
				.filter( function(url)  {return !dataCache[url].loaded;} )
				.map( function(url)  {
					return {url: url, entry: dataCache[url] }
				});
		};
	
		Loader.prototype.whenAllPendingResolve=function()  {"use strict";
			var promises = Object.keys(this.dataCache)
				.map( function(url)  {return this.dataCache[url].dfd.promise;}.bind(this) );
			return Q.allSettled(promises);
		};
	
		Loader.prototype.lateArrival=function(url, data) {"use strict";
			var dataCache = this.dataCache;
			if (dataCache[url]) {
				dataCache[url].loaded = true;
				dataCache[url].data = data;
				dataCache[url].dfd.resolve(data);
			} else {
				debug("WTF?");
			}
		};
	
		Loader.prototype.$Loader_apiServerPrefix=function()  {"use strict";
			var prefix;
	
			if (true) {
				// internal URL. Is likely different than the public URL, and indeed
				// shouldn't be displayed publicly, probably?
				prefix = config.internal.apiServerPrefix;
			} else {
				// public URL (e.g. http://www.redfin.com)
				prefix = config.apiServerPrefix;
			}
			debug("_apiServerPrefix: " + prefix);
			return prefix;
		};
	
	return Loader;})();


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	
	module.exports = (function(){
	
		function Bouncer(data) {"use strict";
			this.setBouncerData(data || {});
		}
	
		Bouncer.prototype.setBouncerData=function(bouncerData) {"use strict";
			this.$Bouncer_bouncerData = bouncerData;
		};
	
		Bouncer.prototype.isOn=function(feature) {"use strict";
			return typeof( this.getVariant(feature) ) !== "undefined";
		};
	
		Bouncer.prototype.getVariant=function(feature) {"use strict";
			try {
				var featureId = feature && feature.id ? feature.id : feature;
				return this.$Bouncer_bouncerData[featureId];
			}
			catch(e) {
				console.error("Bouncer failed for feature ["+feature+"]", e);
			}
			return {}.x; // Return (guaranteed to be) undefined. Cannot use "return undefined" because "undefined" can technically be reassigned
		};
	
	return Bouncer;})()


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	
	var EventEmitter = __webpack_require__(18).EventEmitter,
		Router = __webpack_require__(25),
		Q = __webpack_require__(5);
	
	for(var EventEmitter____Key in EventEmitter){if(EventEmitter.hasOwnProperty(EventEmitter____Key)){Navigator[EventEmitter____Key]=EventEmitter[EventEmitter____Key];}}var ____SuperProtoOfEventEmitter=EventEmitter===null?null:EventEmitter.prototype;Navigator.prototype=Object.create(____SuperProtoOfEventEmitter);Navigator.prototype.constructor=Navigator;Navigator.__superConstructor__=EventEmitter;
	
		function Navigator(context, routes, applicationStore) {"use strict";
			this.router = new Router(routes);
			this.context = context;
			
			this.$Navigator_loading = false;
			this.$Navigator_currentRoute = null;
		}
	
		Navigator.prototype.navigate=function(navOpts) {"use strict";
	
			var route = this.router.getRoute(navOpts.path, {navigate: navOpts});
			if (!route) {
				setTimeout( function()  {
					this.emit('navigateDone', { status: 404, message: "No Route!" });
				}.bind(this), 0);
				return;
			}
	
			this.startRoute(route);
			this.emit('navigateStart', route);
	
			/* Breathe... */
	
			route.config.resolveComponent().done( function(component)  {
				// when the handler function is done, we'll start it executing, optimistically
				var actionFunc = Q.nfbind(component.handleRoute);
				actionFunc(this.context, route).done( function(pageObject)  {
					this.finishRoute(route);
					this.emit('navigateDone', null, {
						component: component,
						pageObject: pageObject
					});
				}.bind(this), function(err)  {
					// if the handler function had an error (i.e., an indication of a redirect)
					this.emit('navigateDone', err);
				}.bind(this));
			}.bind(this), function(handlerFuncErr)  {
				console.error("Error resolving handler function", handlerFuncErr);
			});
	
		};
	
		Navigator.prototype.getState=function()  {"use strict";
			return {
				loading: this.$Navigator_loading,
				route: this.$Navigator_currentRoute
			}
		};
	
		Navigator.prototype.getCurrentRoute=function()  {"use strict";
			return this.$Navigator_currentRoute;
		};
	
		Navigator.prototype.getLoading=function()  {"use strict";
			return this.$Navigator_loading;
		};
	
		Navigator.prototype.startRoute=function(route) {"use strict";
			this.$Navigator_loading = true;
			this.$Navigator_currentRoute = route;
		};
	
		Navigator.prototype.finishRoute=function(route) {"use strict";
			this.$Navigator_loading = false;
		};
	
	
	
	module.exports = Navigator;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2014, Yahoo! Inc.
	 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
	 */
	 /**
	  * Redfin: converted to not use a dispatcher or navigateAction, and to use a different
	  * form for triggering navigation. Removed setImmediate?
	  */
	'use strict';
	
	var History = __webpack_require__(26),
	    EVT_PAGELOAD = 'pageload',
	    EVT_POPSTATE = 'popstate',
	    RouterMixin;
	
	// require('setimmediate');
	
	function routesEqual(route1, route2) {
	    route1 = route1 || {};
	    route2 = route2 || {};
	    return (route1.path === route2.path);
	}
	
	RouterMixin = {
	    componentDidMount: function() {
	        var self = this,
	            context = self.props.context,
	            pathFromHistory,
	            pathFromState = self.state.route.path;
	
	        self._history = ('function' === typeof self.props.historyCreator) ? self.props.historyCreator() : new History();
	        pathFromHistory = self._history.getPath();
	
	        if (context && (pathFromHistory !== pathFromState)) {
	
	            // REDFIN-TODO: do we need this business? We're already doing this ourselves, and our 'navigate'
	            // needs to do things in its callback
	
	            // YAHOO: put it in setImmediate, because we need the base component to have
	            // store listeners attached, before navigateAction is executed.
	            // setImmediate(function navigateToActualRoute() {
	            //     context.executeAction(navigateAction, {type: EVT_PAGELOAD, path: pathFromHistory});
	            // });
	        }
	
	        self._historyListener = function (e) {
	            if (context) {
	                var path = self._history.getPath();
	
	                // REDFIN-TODO: this appears to pass some state. Should we figure out how to replicate that?
	                // context.executeAction(navigateAction, {type: EVT_POPSTATE, path: path, params: e.state});
	
	                context.navigate({ type: EVT_POPSTATE, path: path });
	                
	            }
	        };
	        self._history.on(self._historyListener);
	    },
	    componentWillUnmount: function() {
	        this._history.off(this._historyListener);
	        this._historyListener = null;
	        this._history = null;
	    },
	    componentDidUpdate: function (prevProps, prevState) {
	        var newState = this.state;
	        if (routesEqual(prevState && prevState.route, newState && newState.route)) {
	            return;
	        }
	        var nav = newState.route.navigate;
	        if (nav.type !== EVT_POPSTATE && nav.type !== EVT_PAGELOAD) {
	            this._history.pushState(nav.params || null, null, newState.route.path);
	        }
	    }
	};
	
	module.exports = RouterMixin;


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("routr");

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2014, Yahoo! Inc.
	 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
	 */
	 /*
	  * Redfin: unchnaged (so far)
	  */
	/*global window */
	'use strict';
	
	var EVENT_POPSTATE = 'popstate';
	
	/**
	 * This only supports pushState for the browsers with native pushState support.
	 * For other browsers (mainly IE8 and IE9), it will refresh the page upon pushState()
	 * and replaceState().
	 * @class History
	 * @constructor
	 * @param {Object} [options]  The options object
	 * @param {Window} [options.win=window]  The window object
	 */
	function History(options) {
	    this.win = (options && options.win) || window;
	    this._hasPushState = !!(this.win && this.win.history && this.win.history.pushState);
	}
	
	History.prototype = {
	    /**
	     * Add the given listener for 'popstate' event (nothing happens for browsers that
	     * don't support popstate event).
	     * @method on
	     * @param {Function} listener
	     */
	    on: function (listener) {
	        if (this._hasPushState) {
	            this.win.addEventListener(EVENT_POPSTATE, listener);
	        }
	    },
	
	    /**
	     * Remove the given listener for 'popstate' event (nothing happens for browsers that
	     * don't support popstate event).
	     * @method off
	     * @param {Function} listener
	     */
	    off: function (listener) {
	        if (this._hasPushState) {
	            this.win.removeEventListener(EVENT_POPSTATE, listener);
	        }
	    },
	
	    /**
	     * Gets the path string, including the pathname and search query (if it exists).
	     * @method getPath
	     * @return {String} The path string that denotes current route path
	     */
	    getPath: function () {
	        var location = this.win.location;
	        return location.pathname + location.search;
	    },
	
	    /**
	     * Same as HTML5 pushState API, but with old browser support
	     * @method pushState
	     * @param {Object} state The state object
	     * @param {String} title The title string
	     * @param {String} url The new url
	     */
	    pushState: function (state, title, url) {
	        var win = this.win;
	        if (this._hasPushState) {
	            win.history.pushState(state, title, url);
	        } else {
	            win.location.href = url;
	        }
	    },
	
	    /**
	     * Same as HTML5 replaceState API, but with old browser support
	     * @method replaceState
	     * @param {Object} state The state object
	     * @param {String} title The title string
	     * @param {String} url The new url
	     */
	    replaceState: function (state, title, url) {
	        var win = this.win;
	        if (this._hasPushState) {
	            win.history.replaceState(state, title, url);
	        } else {
	            win.location.replace(url);
	        }
	    }
	};
	
	module.exports = History;


/***/ }
/******/ ])
//# sourceMappingURL=triton-server.js.map