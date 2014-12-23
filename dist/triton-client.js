module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __triton_require__(moduleId) {
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
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __triton_require__);
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
/******/ 	__triton_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__triton_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__triton_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __triton_require__(0);
/******/ })
/************************************************************************/
/******/ ((function(modules) {
	// Check all modules for deduplicated modules
	for(var i in modules) {
		switch(typeof modules[i]) {
		case "number":
			// Module is a copy of another module
			modules[i] = modules[modules[i]];
			break;
		case "object":
			// Module can be created from a template
			modules[i] = (function(_m) {
				var args = _m.slice(1), fn = modules[_m[0]];
				return function (a,b,c) {
					fn.apply(null, [a,b,c].concat(args));
				};
			}(modules[i]));
		}
	}
	return modules;
}([
/* 0 */
/***/ function(module, exports, __triton_require__) {

	/**
	 * client.js contains the bootstrap code for the
	 * client-side.
	 */
	
	// TODO: is triggering enum loads here too late? it appears todelay render
	// by 50-100ms after page load (current enum hack loads a giant enum file though.
	// might be faster if we did something more clever... like fixing JSEnumController
	// to send down a module)
	// ALSO: putting this require() at the top of the file appears to be somewhat
	// noticeably faster than putting it after the requires below. I guess one of them
	// has an intense setup? 
	var enumRequestStart = new Date().getTime();
	var enumDfd = __triton_require__(3).init();
	
	
	var React = __triton_require__(1),
		debug = __triton_require__(19),
		bootstrapDebug = debug('rf:client'),
		RequestContext = __triton_require__(5),
		AppRoot = React.createFactory(__triton_require__(6)),
		Q = __triton_require__(8),
		cssHelper = __triton_require__(7),
		superagent = __triton_require__(21);
	
	// TODO: turn this off in prod builds
	debug.enable("*");
	
	// for dev tools
	window.React = React;
	
	var common = __triton_require__(2);
	
	common.initialize = function (initialComponent, routes, $__0) {var superAgentExtender=$__0.superAgentExtender;
		if (superAgentExtender) {
			superAgentExtender(superagent);
		}
	
		var initialRenderDfd = Q.defer();
	
		var dehydratedConfig = window.RF && window.RF.Config;
		if (!dehydratedConfig) {
			throw new Error("RF.Config not specified!");
		}
	
		// rehydrate the 'env' object
		var config = __triton_require__(4);
		config.rehydrate(dehydratedConfig);
	
		// update the URL from which webpack jsonp-loads require.ensure scripts
		// (mostly for lazy-loading routes for client-side routing)
		// TODO: factor this out somewhere
		__triton_require__.p = config.imageServerUrl + '/r3sjs/';
	
		var dehydratedState = window.RF && window.RF.InitialContext;
	
		var context = new RequestContext.Builder().setRoutes(routes).create();
	
		context.rehydrate(dehydratedState);
	
		window.context = context;
	
		var previouslyRendered = false;
	
		context.onNavigate( function(err, result)  {
			debug('Executing navigate action');
			
			if (err) {
				debug("There was an error:", err);
				console.error(err);
				return;
			}
	
			var routeName = context.navigator.getCurrentRoute().name;
	
			if (!previouslyRendered) {
				cssHelper.registerPageLoad(routeName);
			} else {
				var newTitle = result.pageObject.getTitle();
				if (newTitle && newTitle !== document.title) {
					document.title = newTitle;
				}
			}
	
			cssHelper.ensureCss(routeName, result.pageObject);
	
			var render = function () {
	
				var mountNode = document.getElementById('content');
	
				bootstrapDebug('React Rendering');
				React.render(AppRoot({
					childComponent: result.component,
					context: context,
					pageStore: result.pageObject.getPageStore()
				}), mountNode, function () {
					bootstrapDebug('React Rendered');
					initialRenderDfd.resolve();
				});
	
			}
	
			if (!previouslyRendered) {
	
				// ensure that enums are ready before we start running code
				enumDfd.done(function () {
					render();
					previouslyRendered = true;
				});
			} else {
				render();
			}
	
	
		});
	
		var location = window.location;
		var path = location.pathname + location.search;
		context.navigate({path: path});
	
		return initialRenderDfd.promise;
	}
	
	module.exports = common;

/***/ },
/* 1 */
/***/ function(module, exports, __triton_require__) {

	module.exports = require("react");

/***/ },
/* 2 */
/***/ function(module, exports, __triton_require__) {

	// the common object model of triton on server and client -sra.
	
	module.exports = {
		page: __triton_require__(9),
		baseStore: __triton_require__(13),
		link: __triton_require__(10),
		actions: __triton_require__(14),
		objectGraph: __triton_require__(11),
		enums: __triton_require__(3),
		bundleNameUtil: __triton_require__(12),
		config: __triton_require__(4)
	}

/***/ },
/* 3 */
/***/ function(module, exports, __triton_require__) {

	
	var debug = __triton_require__(19)('rf:enums'),
		superagent = __triton_require__(21),
		Q = __triton_require__(8);
	
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
	
			if (false) {
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
/* 4 */
/***/ function(module, exports, __triton_require__) {

	
	/**
	 * Thin wrapper around the environment-specific configuration file
	 */
	
	if (false) {
	
	(function () {
	
		if (!process.env.R3S_CONFIGS) {
			throw 'R3S_CONFIGS environment variable required to start server.';
		}
	
		var fs = require("fs");
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
/* 5 */
/***/ function(module, exports, __triton_require__) {

	
	var SuperAgentWrapper = __triton_require__(15),
		Loader = __triton_require__(16),
		Bouncer = __triton_require__(17),
		ObjectGraph = __triton_require__(11),
		Navigator = __triton_require__(18),
		Q = __triton_require__(8);
	
	// TODO FIXME
	var REFERRER_DOMAIN = "http://node.redfintest.com";
	
	
	
		function RequestContext(routes, loaderOpts, defaultHeaders, extraOpts) {"use strict";
	
			// don't include headers client-side (browser has them already)
			if (true) {
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
/* 6 */
/***/ function(module, exports, __triton_require__) {

	
	var React = __triton_require__(1),
		RouterMixin = __triton_require__(20),
		debug = __triton_require__(19)('AppRoot');
	
	
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
/* 7 */
/***/ function(module, exports, __triton_require__) {

	
	var debug = __triton_require__(19)('rf:ClientCssHelper');
	
	var pageCssLinkNode;
	var loadedCss = {};
	
	var ClientCssHelper = module.exports = {
	
		PAGE_CSS_NODE_ID: 'CssClientHelper-InitialCSS',
	
		registerPageLoad: function registerPageLoad(routeName) {
			if (false) {
				throw new Error("ClientCssHelper.registerPageLoad can't be called server-side");
			}
			pageCssLinkNode = loadedCss[routeName] = document.getElementById(ClientCssHelper.PAGE_CSS_NODE_ID);
		},
	
		ensureCss: function ensureCss(routeName, pageObject) {
			if (false) {
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
/* 8 */
/***/ function(module, exports, __triton_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {// vim:ts=4:sts=4:sw=4:
	/*!
	 *
	 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
	 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
	 *
	 * With parts by Tyler Close
	 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
	 * at http://www.opensource.org/licenses/mit-license.html
	 * Forked at ref_send.js version: 2009-05-11
	 *
	 * With parts by Mark Miller
	 * Copyright (C) 2011 Google Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 * http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 *
	 */
	
	(function (definition) {
	    // Turn off strict mode for this function so we can assign to global.Q
	    /* jshint strict: false */
	
	    // This file will function properly as a <script> tag, or a module
	    // using CommonJS and NodeJS or RequireJS module formats.  In
	    // Common/Node/RequireJS, the module exports the Q API and when
	    // executed as a simple <script>, it creates a Q global instead.
	
	    // Montage Require
	    if (typeof bootstrap === "function") {
	        bootstrap("promise", definition);
	
	    // CommonJS
	    } else if (true) {
	        module.exports = definition();
	
	    // RequireJS
	    } else if (typeof define === "function" && define.amd) {
	        define(definition);
	
	    // SES (Secure EcmaScript)
	    } else if (typeof ses !== "undefined") {
	        if (!ses.ok()) {
	            return;
	        } else {
	            ses.makeQ = definition;
	        }
	
	    // <script>
	    } else {
	        Q = definition();
	    }
	
	})(function () {
	"use strict";
	
	var hasStacks = false;
	try {
	    throw new Error();
	} catch (e) {
	    hasStacks = !!e.stack;
	}
	
	// All code after this point will be filtered from stack traces reported
	// by Q.
	var qStartingLine = captureLine();
	var qFileName;
	
	// shims
	
	// used for fallback in "allResolved"
	var noop = function () {};
	
	// Use the fastest possible means to execute a task in a future turn
	// of the event loop.
	var nextTick =(function () {
	    // linked list of tasks (single, with head node)
	    var head = {task: void 0, next: null};
	    var tail = head;
	    var flushing = false;
	    var requestTick = void 0;
	    var isNodeJS = false;
	
	    function flush() {
	        /* jshint loopfunc: true */
	
	        while (head.next) {
	            head = head.next;
	            var task = head.task;
	            head.task = void 0;
	            var domain = head.domain;
	
	            if (domain) {
	                head.domain = void 0;
	                domain.enter();
	            }
	
	            try {
	                task();
	
	            } catch (e) {
	                if (isNodeJS) {
	                    // In node, uncaught exceptions are considered fatal errors.
	                    // Re-throw them synchronously to interrupt flushing!
	
	                    // Ensure continuation if the uncaught exception is suppressed
	                    // listening "uncaughtException" events (as domains does).
	                    // Continue in next event to avoid tick recursion.
	                    if (domain) {
	                        domain.exit();
	                    }
	                    setTimeout(flush, 0);
	                    if (domain) {
	                        domain.enter();
	                    }
	
	                    throw e;
	
	                } else {
	                    // In browsers, uncaught exceptions are not fatal.
	                    // Re-throw them asynchronously to avoid slow-downs.
	                    setTimeout(function() {
	                       throw e;
	                    }, 0);
	                }
	            }
	
	            if (domain) {
	                domain.exit();
	            }
	        }
	
	        flushing = false;
	    }
	
	    nextTick = function (task) {
	        tail = tail.next = {
	            task: task,
	            domain: isNodeJS && process.domain,
	            next: null
	        };
	
	        if (!flushing) {
	            flushing = true;
	            requestTick();
	        }
	    };
	
	    if (typeof process !== "undefined" && process.nextTick) {
	        // Node.js before 0.9. Note that some fake-Node environments, like the
	        // Mocha test runner, introduce a `process` global without a `nextTick`.
	        isNodeJS = true;
	
	        requestTick = function () {
	            process.nextTick(flush);
	        };
	
	    } else if (typeof setImmediate === "function") {
	        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
	        if (typeof window !== "undefined") {
	            requestTick = setImmediate.bind(window, flush);
	        } else {
	            requestTick = function () {
	                setImmediate(flush);
	            };
	        }
	
	    } else if (typeof MessageChannel !== "undefined") {
	        // modern browsers
	        // http://www.nonblocking.io/2011/06/windownexttick.html
	        var channel = new MessageChannel();
	        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
	        // working message ports the first time a page loads.
	        channel.port1.onmessage = function () {
	            requestTick = requestPortTick;
	            channel.port1.onmessage = flush;
	            flush();
	        };
	        var requestPortTick = function () {
	            // Opera requires us to provide a message payload, regardless of
	            // whether we use it.
	            channel.port2.postMessage(0);
	        };
	        requestTick = function () {
	            setTimeout(flush, 0);
	            requestPortTick();
	        };
	
	    } else {
	        // old browsers
	        requestTick = function () {
	            setTimeout(flush, 0);
	        };
	    }
	
	    return nextTick;
	})();
	
	// Attempt to make generics safe in the face of downstream
	// modifications.
	// There is no situation where this is necessary.
	// If you need a security guarantee, these primordials need to be
	// deeply frozen anyway, and if you don’t need a security guarantee,
	// this is just plain paranoid.
	// However, this **might** have the nice side-effect of reducing the size of
	// the minified code by reducing x.call() to merely x()
	// See Mark Miller’s explanation of what this does.
	// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
	var call = Function.call;
	function uncurryThis(f) {
	    return function () {
	        return call.apply(f, arguments);
	    };
	}
	// This is equivalent, but slower:
	// uncurryThis = Function_bind.bind(Function_bind.call);
	// http://jsperf.com/uncurrythis
	
	var array_slice = uncurryThis(Array.prototype.slice);
	
	var array_reduce = uncurryThis(
	    Array.prototype.reduce || function (callback, basis) {
	        var index = 0,
	            length = this.length;
	        // concerning the initial value, if one is not provided
	        if (arguments.length === 1) {
	            // seek to the first value in the array, accounting
	            // for the possibility that is is a sparse array
	            do {
	                if (index in this) {
	                    basis = this[index++];
	                    break;
	                }
	                if (++index >= length) {
	                    throw new TypeError();
	                }
	            } while (1);
	        }
	        // reduce
	        for (; index < length; index++) {
	            // account for the possibility that the array is sparse
	            if (index in this) {
	                basis = callback(basis, this[index], index);
	            }
	        }
	        return basis;
	    }
	);
	
	var array_indexOf = uncurryThis(
	    Array.prototype.indexOf || function (value) {
	        // not a very good shim, but good enough for our one use of it
	        for (var i = 0; i < this.length; i++) {
	            if (this[i] === value) {
	                return i;
	            }
	        }
	        return -1;
	    }
	);
	
	var array_map = uncurryThis(
	    Array.prototype.map || function (callback, thisp) {
	        var self = this;
	        var collect = [];
	        array_reduce(self, function (undefined, value, index) {
	            collect.push(callback.call(thisp, value, index, self));
	        }, void 0);
	        return collect;
	    }
	);
	
	var object_create = Object.create || function (prototype) {
	    function Type() { }
	    Type.prototype = prototype;
	    return new Type();
	};
	
	var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);
	
	var object_keys = Object.keys || function (object) {
	    var keys = [];
	    for (var key in object) {
	        if (object_hasOwnProperty(object, key)) {
	            keys.push(key);
	        }
	    }
	    return keys;
	};
	
	var object_toString = uncurryThis(Object.prototype.toString);
	
	function isObject(value) {
	    return value === Object(value);
	}
	
	// generator related shims
	
	// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
	function isStopIteration(exception) {
	    return (
	        object_toString(exception) === "[object StopIteration]" ||
	        exception instanceof QReturnValue
	    );
	}
	
	// FIXME: Remove this helper and Q.return once ES6 generators are in
	// SpiderMonkey.
	var QReturnValue;
	if (typeof ReturnValue !== "undefined") {
	    QReturnValue = ReturnValue;
	} else {
	    QReturnValue = function (value) {
	        this.value = value;
	    };
	}
	
	// long stack traces
	
	var STACK_JUMP_SEPARATOR = "From previous event:";
	
	function makeStackTraceLong(error, promise) {
	    // If possible, transform the error stack trace by removing Node and Q
	    // cruft, then concatenating with the stack trace of `promise`. See #57.
	    if (hasStacks &&
	        promise.stack &&
	        typeof error === "object" &&
	        error !== null &&
	        error.stack &&
	        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
	    ) {
	        var stacks = [];
	        for (var p = promise; !!p; p = p.source) {
	            if (p.stack) {
	                stacks.unshift(p.stack);
	            }
	        }
	        stacks.unshift(error.stack);
	
	        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
	        error.stack = filterStackString(concatedStacks);
	    }
	}
	
	function filterStackString(stackString) {
	    var lines = stackString.split("\n");
	    var desiredLines = [];
	    for (var i = 0; i < lines.length; ++i) {
	        var line = lines[i];
	
	        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
	            desiredLines.push(line);
	        }
	    }
	    return desiredLines.join("\n");
	}
	
	function isNodeFrame(stackLine) {
	    return stackLine.indexOf("(module.js:") !== -1 ||
	           stackLine.indexOf("(node.js:") !== -1;
	}
	
	function getFileNameAndLineNumber(stackLine) {
	    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
	    // In IE10 function name can have spaces ("Anonymous function") O_o
	    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
	    if (attempt1) {
	        return [attempt1[1], Number(attempt1[2])];
	    }
	
	    // Anonymous functions: "at filename:lineNumber:columnNumber"
	    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
	    if (attempt2) {
	        return [attempt2[1], Number(attempt2[2])];
	    }
	
	    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
	    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
	    if (attempt3) {
	        return [attempt3[1], Number(attempt3[2])];
	    }
	}
	
	function isInternalFrame(stackLine) {
	    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);
	
	    if (!fileNameAndLineNumber) {
	        return false;
	    }
	
	    var fileName = fileNameAndLineNumber[0];
	    var lineNumber = fileNameAndLineNumber[1];
	
	    return fileName === qFileName &&
	        lineNumber >= qStartingLine &&
	        lineNumber <= qEndingLine;
	}
	
	// discover own file name and line number range for filtering stack
	// traces
	function captureLine() {
	    if (!hasStacks) {
	        return;
	    }
	
	    try {
	        throw new Error();
	    } catch (e) {
	        var lines = e.stack.split("\n");
	        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
	        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
	        if (!fileNameAndLineNumber) {
	            return;
	        }
	
	        qFileName = fileNameAndLineNumber[0];
	        return fileNameAndLineNumber[1];
	    }
	}
	
	function deprecate(callback, name, alternative) {
	    return function () {
	        if (typeof console !== "undefined" &&
	            typeof console.warn === "function") {
	            console.warn(name + " is deprecated, use " + alternative +
	                         " instead.", new Error("").stack);
	        }
	        return callback.apply(callback, arguments);
	    };
	}
	
	// end of shims
	// beginning of real work
	
	/**
	 * Constructs a promise for an immediate reference, passes promises through, or
	 * coerces promises from different systems.
	 * @param value immediate reference or promise
	 */
	function Q(value) {
	    // If the object is already a Promise, return it directly.  This enables
	    // the resolve function to both be used to created references from objects,
	    // but to tolerably coerce non-promises to promises.
	    if (isPromise(value)) {
	        return value;
	    }
	
	    // assimilate thenables
	    if (isPromiseAlike(value)) {
	        return coerce(value);
	    } else {
	        return fulfill(value);
	    }
	}
	Q.resolve = Q;
	
	/**
	 * Performs a task in a future turn of the event loop.
	 * @param {Function} task
	 */
	Q.nextTick = nextTick;
	
	/**
	 * Controls whether or not long stack traces will be on
	 */
	Q.longStackSupport = false;
	
	/**
	 * Constructs a {promise, resolve, reject} object.
	 *
	 * `resolve` is a callback to invoke with a more resolved value for the
	 * promise. To fulfill the promise, invoke `resolve` with any value that is
	 * not a thenable. To reject the promise, invoke `resolve` with a rejected
	 * thenable, or invoke `reject` with the reason directly. To resolve the
	 * promise to another thenable, thus putting it in the same state, invoke
	 * `resolve` with that other thenable.
	 */
	Q.defer = defer;
	function defer() {
	    // if "messages" is an "Array", that indicates that the promise has not yet
	    // been resolved.  If it is "undefined", it has been resolved.  Each
	    // element of the messages array is itself an array of complete arguments to
	    // forward to the resolved promise.  We coerce the resolution value to a
	    // promise using the `resolve` function because it handles both fully
	    // non-thenable values and other thenables gracefully.
	    var messages = [], progressListeners = [], resolvedPromise;
	
	    var deferred = object_create(defer.prototype);
	    var promise = object_create(Promise.prototype);
	
	    promise.promiseDispatch = function (resolve, op, operands) {
	        var args = array_slice(arguments);
	        if (messages) {
	            messages.push(args);
	            if (op === "when" && operands[1]) { // progress operand
	                progressListeners.push(operands[1]);
	            }
	        } else {
	            nextTick(function () {
	                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
	            });
	        }
	    };
	
	    // XXX deprecated
	    promise.valueOf = function () {
	        if (messages) {
	            return promise;
	        }
	        var nearerValue = nearer(resolvedPromise);
	        if (isPromise(nearerValue)) {
	            resolvedPromise = nearerValue; // shorten chain
	        }
	        return nearerValue;
	    };
	
	    promise.inspect = function () {
	        if (!resolvedPromise) {
	            return { state: "pending" };
	        }
	        return resolvedPromise.inspect();
	    };
	
	    if (Q.longStackSupport && hasStacks) {
	        try {
	            throw new Error();
	        } catch (e) {
	            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
	            // accessor around; that causes memory leaks as per GH-111. Just
	            // reify the stack trace as a string ASAP.
	            //
	            // At the same time, cut off the first line; it's always just
	            // "[object Promise]\n", as per the `toString`.
	            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
	        }
	    }
	
	    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
	    // consolidating them into `become`, since otherwise we'd create new
	    // promises with the lines `become(whatever(value))`. See e.g. GH-252.
	
	    function become(newPromise) {
	        resolvedPromise = newPromise;
	        promise.source = newPromise;
	
	        array_reduce(messages, function (undefined, message) {
	            nextTick(function () {
	                newPromise.promiseDispatch.apply(newPromise, message);
	            });
	        }, void 0);
	
	        messages = void 0;
	        progressListeners = void 0;
	    }
	
	    deferred.promise = promise;
	    deferred.resolve = function (value) {
	        if (resolvedPromise) {
	            return;
	        }
	
	        become(Q(value));
	    };
	
	    deferred.fulfill = function (value) {
	        if (resolvedPromise) {
	            return;
	        }
	
	        become(fulfill(value));
	    };
	    deferred.reject = function (reason) {
	        if (resolvedPromise) {
	            return;
	        }
	
	        become(reject(reason));
	    };
	    deferred.notify = function (progress) {
	        if (resolvedPromise) {
	            return;
	        }
	
	        array_reduce(progressListeners, function (undefined, progressListener) {
	            nextTick(function () {
	                progressListener(progress);
	            });
	        }, void 0);
	    };
	
	    return deferred;
	}
	
	/**
	 * Creates a Node-style callback that will resolve or reject the deferred
	 * promise.
	 * @returns a nodeback
	 */
	defer.prototype.makeNodeResolver = function () {
	    var self = this;
	    return function (error, value) {
	        if (error) {
	            self.reject(error);
	        } else if (arguments.length > 2) {
	            self.resolve(array_slice(arguments, 1));
	        } else {
	            self.resolve(value);
	        }
	    };
	};
	
	/**
	 * @param resolver {Function} a function that returns nothing and accepts
	 * the resolve, reject, and notify functions for a deferred.
	 * @returns a promise that may be resolved with the given resolve and reject
	 * functions, or rejected by a thrown exception in resolver
	 */
	Q.Promise = promise; // ES6
	Q.promise = promise;
	function promise(resolver) {
	    if (typeof resolver !== "function") {
	        throw new TypeError("resolver must be a function.");
	    }
	    var deferred = defer();
	    try {
	        resolver(deferred.resolve, deferred.reject, deferred.notify);
	    } catch (reason) {
	        deferred.reject(reason);
	    }
	    return deferred.promise;
	}
	
	promise.race = race; // ES6
	promise.all = all; // ES6
	promise.reject = reject; // ES6
	promise.resolve = Q; // ES6
	
	// XXX experimental.  This method is a way to denote that a local value is
	// serializable and should be immediately dispatched to a remote upon request,
	// instead of passing a reference.
	Q.passByCopy = function (object) {
	    //freeze(object);
	    //passByCopies.set(object, true);
	    return object;
	};
	
	Promise.prototype.passByCopy = function () {
	    //freeze(object);
	    //passByCopies.set(object, true);
	    return this;
	};
	
	/**
	 * If two promises eventually fulfill to the same value, promises that value,
	 * but otherwise rejects.
	 * @param x {Any*}
	 * @param y {Any*}
	 * @returns {Any*} a promise for x and y if they are the same, but a rejection
	 * otherwise.
	 *
	 */
	Q.join = function (x, y) {
	    return Q(x).join(y);
	};
	
	Promise.prototype.join = function (that) {
	    return Q([this, that]).spread(function (x, y) {
	        if (x === y) {
	            // TODO: "===" should be Object.is or equiv
	            return x;
	        } else {
	            throw new Error("Can't join: not the same: " + x + " " + y);
	        }
	    });
	};
	
	/**
	 * Returns a promise for the first of an array of promises to become fulfilled.
	 * @param answers {Array[Any*]} promises to race
	 * @returns {Any*} the first promise to be fulfilled
	 */
	Q.race = race;
	function race(answerPs) {
	    return promise(function(resolve, reject) {
	        // Switch to this once we can assume at least ES5
	        // answerPs.forEach(function(answerP) {
	        //     Q(answerP).then(resolve, reject);
	        // });
	        // Use this in the meantime
	        for (var i = 0, len = answerPs.length; i < len; i++) {
	            Q(answerPs[i]).then(resolve, reject);
	        }
	    });
	}
	
	Promise.prototype.race = function () {
	    return this.then(Q.race);
	};
	
	/**
	 * Constructs a Promise with a promise descriptor object and optional fallback
	 * function.  The descriptor contains methods like when(rejected), get(name),
	 * set(name, value), post(name, args), and delete(name), which all
	 * return either a value, a promise for a value, or a rejection.  The fallback
	 * accepts the operation name, a resolver, and any further arguments that would
	 * have been forwarded to the appropriate method above had a method been
	 * provided with the proper name.  The API makes no guarantees about the nature
	 * of the returned object, apart from that it is usable whereever promises are
	 * bought and sold.
	 */
	Q.makePromise = Promise;
	function Promise(descriptor, fallback, inspect) {
	    if (fallback === void 0) {
	        fallback = function (op) {
	            return reject(new Error(
	                "Promise does not support operation: " + op
	            ));
	        };
	    }
	    if (inspect === void 0) {
	        inspect = function () {
	            return {state: "unknown"};
	        };
	    }
	
	    var promise = object_create(Promise.prototype);
	
	    promise.promiseDispatch = function (resolve, op, args) {
	        var result;
	        try {
	            if (descriptor[op]) {
	                result = descriptor[op].apply(promise, args);
	            } else {
	                result = fallback.call(promise, op, args);
	            }
	        } catch (exception) {
	            result = reject(exception);
	        }
	        if (resolve) {
	            resolve(result);
	        }
	    };
	
	    promise.inspect = inspect;
	
	    // XXX deprecated `valueOf` and `exception` support
	    if (inspect) {
	        var inspected = inspect();
	        if (inspected.state === "rejected") {
	            promise.exception = inspected.reason;
	        }
	
	        promise.valueOf = function () {
	            var inspected = inspect();
	            if (inspected.state === "pending" ||
	                inspected.state === "rejected") {
	                return promise;
	            }
	            return inspected.value;
	        };
	    }
	
	    return promise;
	}
	
	Promise.prototype.toString = function () {
	    return "[object Promise]";
	};
	
	Promise.prototype.then = function (fulfilled, rejected, progressed) {
	    var self = this;
	    var deferred = defer();
	    var done = false;   // ensure the untrusted promise makes at most a
	                        // single call to one of the callbacks
	
	    function _fulfilled(value) {
	        try {
	            return typeof fulfilled === "function" ? fulfilled(value) : value;
	        } catch (exception) {
	            return reject(exception);
	        }
	    }
	
	    function _rejected(exception) {
	        if (typeof rejected === "function") {
	            makeStackTraceLong(exception, self);
	            try {
	                return rejected(exception);
	            } catch (newException) {
	                return reject(newException);
	            }
	        }
	        return reject(exception);
	    }
	
	    function _progressed(value) {
	        return typeof progressed === "function" ? progressed(value) : value;
	    }
	
	    nextTick(function () {
	        self.promiseDispatch(function (value) {
	            if (done) {
	                return;
	            }
	            done = true;
	
	            deferred.resolve(_fulfilled(value));
	        }, "when", [function (exception) {
	            if (done) {
	                return;
	            }
	            done = true;
	
	            deferred.resolve(_rejected(exception));
	        }]);
	    });
	
	    // Progress propagator need to be attached in the current tick.
	    self.promiseDispatch(void 0, "when", [void 0, function (value) {
	        var newValue;
	        var threw = false;
	        try {
	            newValue = _progressed(value);
	        } catch (e) {
	            threw = true;
	            if (Q.onerror) {
	                Q.onerror(e);
	            } else {
	                throw e;
	            }
	        }
	
	        if (!threw) {
	            deferred.notify(newValue);
	        }
	    }]);
	
	    return deferred.promise;
	};
	
	/**
	 * Registers an observer on a promise.
	 *
	 * Guarantees:
	 *
	 * 1. that fulfilled and rejected will be called only once.
	 * 2. that either the fulfilled callback or the rejected callback will be
	 *    called, but not both.
	 * 3. that fulfilled and rejected will not be called in this turn.
	 *
	 * @param value      promise or immediate reference to observe
	 * @param fulfilled  function to be called with the fulfilled value
	 * @param rejected   function to be called with the rejection exception
	 * @param progressed function to be called on any progress notifications
	 * @return promise for the return value from the invoked callback
	 */
	Q.when = when;
	function when(value, fulfilled, rejected, progressed) {
	    return Q(value).then(fulfilled, rejected, progressed);
	}
	
	Promise.prototype.thenResolve = function (value) {
	    return this.then(function () { return value; });
	};
	
	Q.thenResolve = function (promise, value) {
	    return Q(promise).thenResolve(value);
	};
	
	Promise.prototype.thenReject = function (reason) {
	    return this.then(function () { throw reason; });
	};
	
	Q.thenReject = function (promise, reason) {
	    return Q(promise).thenReject(reason);
	};
	
	/**
	 * If an object is not a promise, it is as "near" as possible.
	 * If a promise is rejected, it is as "near" as possible too.
	 * If it’s a fulfilled promise, the fulfillment value is nearer.
	 * If it’s a deferred promise and the deferred has been resolved, the
	 * resolution is "nearer".
	 * @param object
	 * @returns most resolved (nearest) form of the object
	 */
	
	// XXX should we re-do this?
	Q.nearer = nearer;
	function nearer(value) {
	    if (isPromise(value)) {
	        var inspected = value.inspect();
	        if (inspected.state === "fulfilled") {
	            return inspected.value;
	        }
	    }
	    return value;
	}
	
	/**
	 * @returns whether the given object is a promise.
	 * Otherwise it is a fulfilled value.
	 */
	Q.isPromise = isPromise;
	function isPromise(object) {
	    return isObject(object) &&
	        typeof object.promiseDispatch === "function" &&
	        typeof object.inspect === "function";
	}
	
	Q.isPromiseAlike = isPromiseAlike;
	function isPromiseAlike(object) {
	    return isObject(object) && typeof object.then === "function";
	}
	
	/**
	 * @returns whether the given object is a pending promise, meaning not
	 * fulfilled or rejected.
	 */
	Q.isPending = isPending;
	function isPending(object) {
	    return isPromise(object) && object.inspect().state === "pending";
	}
	
	Promise.prototype.isPending = function () {
	    return this.inspect().state === "pending";
	};
	
	/**
	 * @returns whether the given object is a value or fulfilled
	 * promise.
	 */
	Q.isFulfilled = isFulfilled;
	function isFulfilled(object) {
	    return !isPromise(object) || object.inspect().state === "fulfilled";
	}
	
	Promise.prototype.isFulfilled = function () {
	    return this.inspect().state === "fulfilled";
	};
	
	/**
	 * @returns whether the given object is a rejected promise.
	 */
	Q.isRejected = isRejected;
	function isRejected(object) {
	    return isPromise(object) && object.inspect().state === "rejected";
	}
	
	Promise.prototype.isRejected = function () {
	    return this.inspect().state === "rejected";
	};
	
	//// BEGIN UNHANDLED REJECTION TRACKING
	
	// This promise library consumes exceptions thrown in handlers so they can be
	// handled by a subsequent promise.  The exceptions get added to this array when
	// they are created, and removed when they are handled.  Note that in ES6 or
	// shimmed environments, this would naturally be a `Set`.
	var unhandledReasons = [];
	var unhandledRejections = [];
	var trackUnhandledRejections = true;
	
	function resetUnhandledRejections() {
	    unhandledReasons.length = 0;
	    unhandledRejections.length = 0;
	
	    if (!trackUnhandledRejections) {
	        trackUnhandledRejections = true;
	    }
	}
	
	function trackRejection(promise, reason) {
	    if (!trackUnhandledRejections) {
	        return;
	    }
	
	    unhandledRejections.push(promise);
	    if (reason && typeof reason.stack !== "undefined") {
	        unhandledReasons.push(reason.stack);
	    } else {
	        unhandledReasons.push("(no stack) " + reason);
	    }
	}
	
	function untrackRejection(promise) {
	    if (!trackUnhandledRejections) {
	        return;
	    }
	
	    var at = array_indexOf(unhandledRejections, promise);
	    if (at !== -1) {
	        unhandledRejections.splice(at, 1);
	        unhandledReasons.splice(at, 1);
	    }
	}
	
	Q.resetUnhandledRejections = resetUnhandledRejections;
	
	Q.getUnhandledReasons = function () {
	    // Make a copy so that consumers can't interfere with our internal state.
	    return unhandledReasons.slice();
	};
	
	Q.stopUnhandledRejectionTracking = function () {
	    resetUnhandledRejections();
	    trackUnhandledRejections = false;
	};
	
	resetUnhandledRejections();
	
	//// END UNHANDLED REJECTION TRACKING
	
	/**
	 * Constructs a rejected promise.
	 * @param reason value describing the failure
	 */
	Q.reject = reject;
	function reject(reason) {
	    var rejection = Promise({
	        "when": function (rejected) {
	            // note that the error has been handled
	            if (rejected) {
	                untrackRejection(this);
	            }
	            return rejected ? rejected(reason) : this;
	        }
	    }, function fallback() {
	        return this;
	    }, function inspect() {
	        return { state: "rejected", reason: reason };
	    });
	
	    // Note that the reason has not been handled.
	    trackRejection(rejection, reason);
	
	    return rejection;
	}
	
	/**
	 * Constructs a fulfilled promise for an immediate reference.
	 * @param value immediate reference
	 */
	Q.fulfill = fulfill;
	function fulfill(value) {
	    return Promise({
	        "when": function () {
	            return value;
	        },
	        "get": function (name) {
	            return value[name];
	        },
	        "set": function (name, rhs) {
	            value[name] = rhs;
	        },
	        "delete": function (name) {
	            delete value[name];
	        },
	        "post": function (name, args) {
	            // Mark Miller proposes that post with no name should apply a
	            // promised function.
	            if (name === null || name === void 0) {
	                return value.apply(void 0, args);
	            } else {
	                return value[name].apply(value, args);
	            }
	        },
	        "apply": function (thisp, args) {
	            return value.apply(thisp, args);
	        },
	        "keys": function () {
	            return object_keys(value);
	        }
	    }, void 0, function inspect() {
	        return { state: "fulfilled", value: value };
	    });
	}
	
	/**
	 * Converts thenables to Q promises.
	 * @param promise thenable promise
	 * @returns a Q promise
	 */
	function coerce(promise) {
	    var deferred = defer();
	    nextTick(function () {
	        try {
	            promise.then(deferred.resolve, deferred.reject, deferred.notify);
	        } catch (exception) {
	            deferred.reject(exception);
	        }
	    });
	    return deferred.promise;
	}
	
	/**
	 * Annotates an object such that it will never be
	 * transferred away from this process over any promise
	 * communication channel.
	 * @param object
	 * @returns promise a wrapping of that object that
	 * additionally responds to the "isDef" message
	 * without a rejection.
	 */
	Q.master = master;
	function master(object) {
	    return Promise({
	        "isDef": function () {}
	    }, function fallback(op, args) {
	        return dispatch(object, op, args);
	    }, function () {
	        return Q(object).inspect();
	    });
	}
	
	/**
	 * Spreads the values of a promised array of arguments into the
	 * fulfillment callback.
	 * @param fulfilled callback that receives variadic arguments from the
	 * promised array
	 * @param rejected callback that receives the exception if the promise
	 * is rejected.
	 * @returns a promise for the return value or thrown exception of
	 * either callback.
	 */
	Q.spread = spread;
	function spread(value, fulfilled, rejected) {
	    return Q(value).spread(fulfilled, rejected);
	}
	
	Promise.prototype.spread = function (fulfilled, rejected) {
	    return this.all().then(function (array) {
	        return fulfilled.apply(void 0, array);
	    }, rejected);
	};
	
	/**
	 * The async function is a decorator for generator functions, turning
	 * them into asynchronous generators.  Although generators are only part
	 * of the newest ECMAScript 6 drafts, this code does not cause syntax
	 * errors in older engines.  This code should continue to work and will
	 * in fact improve over time as the language improves.
	 *
	 * ES6 generators are currently part of V8 version 3.19 with the
	 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
	 * for longer, but under an older Python-inspired form.  This function
	 * works on both kinds of generators.
	 *
	 * Decorates a generator function such that:
	 *  - it may yield promises
	 *  - execution will continue when that promise is fulfilled
	 *  - the value of the yield expression will be the fulfilled value
	 *  - it returns a promise for the return value (when the generator
	 *    stops iterating)
	 *  - the decorated function returns a promise for the return value
	 *    of the generator or the first rejected promise among those
	 *    yielded.
	 *  - if an error is thrown in the generator, it propagates through
	 *    every following yield until it is caught, or until it escapes
	 *    the generator function altogether, and is translated into a
	 *    rejection for the promise returned by the decorated generator.
	 */
	Q.async = async;
	function async(makeGenerator) {
	    return function () {
	        // when verb is "send", arg is a value
	        // when verb is "throw", arg is an exception
	        function continuer(verb, arg) {
	            var result;
	
	            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
	            // engine that has a deployed base of browsers that support generators.
	            // However, SM's generators use the Python-inspired semantics of
	            // outdated ES6 drafts.  We would like to support ES6, but we'd also
	            // like to make it possible to use generators in deployed browsers, so
	            // we also support Python-style generators.  At some point we can remove
	            // this block.
	
	            if (typeof StopIteration === "undefined") {
	                // ES6 Generators
	                try {
	                    result = generator[verb](arg);
	                } catch (exception) {
	                    return reject(exception);
	                }
	                if (result.done) {
	                    return result.value;
	                } else {
	                    return when(result.value, callback, errback);
	                }
	            } else {
	                // SpiderMonkey Generators
	                // FIXME: Remove this case when SM does ES6 generators.
	                try {
	                    result = generator[verb](arg);
	                } catch (exception) {
	                    if (isStopIteration(exception)) {
	                        return exception.value;
	                    } else {
	                        return reject(exception);
	                    }
	                }
	                return when(result, callback, errback);
	            }
	        }
	        var generator = makeGenerator.apply(this, arguments);
	        var callback = continuer.bind(continuer, "next");
	        var errback = continuer.bind(continuer, "throw");
	        return callback();
	    };
	}
	
	/**
	 * The spawn function is a small wrapper around async that immediately
	 * calls the generator and also ends the promise chain, so that any
	 * unhandled errors are thrown instead of forwarded to the error
	 * handler. This is useful because it's extremely common to run
	 * generators at the top-level to work with libraries.
	 */
	Q.spawn = spawn;
	function spawn(makeGenerator) {
	    Q.done(Q.async(makeGenerator)());
	}
	
	// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
	/**
	 * Throws a ReturnValue exception to stop an asynchronous generator.
	 *
	 * This interface is a stop-gap measure to support generator return
	 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
	 * generators like Chromium 29, just use "return" in your generator
	 * functions.
	 *
	 * @param value the return value for the surrounding generator
	 * @throws ReturnValue exception with the value.
	 * @example
	 * // ES6 style
	 * Q.async(function* () {
	 *      var foo = yield getFooPromise();
	 *      var bar = yield getBarPromise();
	 *      return foo + bar;
	 * })
	 * // Older SpiderMonkey style
	 * Q.async(function () {
	 *      var foo = yield getFooPromise();
	 *      var bar = yield getBarPromise();
	 *      Q.return(foo + bar);
	 * })
	 */
	Q["return"] = _return;
	function _return(value) {
	    throw new QReturnValue(value);
	}
	
	/**
	 * The promised function decorator ensures that any promise arguments
	 * are settled and passed as values (`this` is also settled and passed
	 * as a value).  It will also ensure that the result of a function is
	 * always a promise.
	 *
	 * @example
	 * var add = Q.promised(function (a, b) {
	 *     return a + b;
	 * });
	 * add(Q(a), Q(B));
	 *
	 * @param {function} callback The function to decorate
	 * @returns {function} a function that has been decorated.
	 */
	Q.promised = promised;
	function promised(callback) {
	    return function () {
	        return spread([this, all(arguments)], function (self, args) {
	            return callback.apply(self, args);
	        });
	    };
	}
	
	/**
	 * sends a message to a value in a future turn
	 * @param object* the recipient
	 * @param op the name of the message operation, e.g., "when",
	 * @param args further arguments to be forwarded to the operation
	 * @returns result {Promise} a promise for the result of the operation
	 */
	Q.dispatch = dispatch;
	function dispatch(object, op, args) {
	    return Q(object).dispatch(op, args);
	}
	
	Promise.prototype.dispatch = function (op, args) {
	    var self = this;
	    var deferred = defer();
	    nextTick(function () {
	        self.promiseDispatch(deferred.resolve, op, args);
	    });
	    return deferred.promise;
	};
	
	/**
	 * Gets the value of a property in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of property to get
	 * @return promise for the property value
	 */
	Q.get = function (object, key) {
	    return Q(object).dispatch("get", [key]);
	};
	
	Promise.prototype.get = function (key) {
	    return this.dispatch("get", [key]);
	};
	
	/**
	 * Sets the value of a property in a future turn.
	 * @param object    promise or immediate reference for object object
	 * @param name      name of property to set
	 * @param value     new value of property
	 * @return promise for the return value
	 */
	Q.set = function (object, key, value) {
	    return Q(object).dispatch("set", [key, value]);
	};
	
	Promise.prototype.set = function (key, value) {
	    return this.dispatch("set", [key, value]);
	};
	
	/**
	 * Deletes a property in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of property to delete
	 * @return promise for the return value
	 */
	Q.del = // XXX legacy
	Q["delete"] = function (object, key) {
	    return Q(object).dispatch("delete", [key]);
	};
	
	Promise.prototype.del = // XXX legacy
	Promise.prototype["delete"] = function (key) {
	    return this.dispatch("delete", [key]);
	};
	
	/**
	 * Invokes a method in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of method to invoke
	 * @param value     a value to post, typically an array of
	 *                  invocation arguments for promises that
	 *                  are ultimately backed with `resolve` values,
	 *                  as opposed to those backed with URLs
	 *                  wherein the posted value can be any
	 *                  JSON serializable object.
	 * @return promise for the return value
	 */
	// bound locally because it is used by other methods
	Q.mapply = // XXX As proposed by "Redsandro"
	Q.post = function (object, name, args) {
	    return Q(object).dispatch("post", [name, args]);
	};
	
	Promise.prototype.mapply = // XXX As proposed by "Redsandro"
	Promise.prototype.post = function (name, args) {
	    return this.dispatch("post", [name, args]);
	};
	
	/**
	 * Invokes a method in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @param name      name of method to invoke
	 * @param ...args   array of invocation arguments
	 * @return promise for the return value
	 */
	Q.send = // XXX Mark Miller's proposed parlance
	Q.mcall = // XXX As proposed by "Redsandro"
	Q.invoke = function (object, name /*...args*/) {
	    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
	};
	
	Promise.prototype.send = // XXX Mark Miller's proposed parlance
	Promise.prototype.mcall = // XXX As proposed by "Redsandro"
	Promise.prototype.invoke = function (name /*...args*/) {
	    return this.dispatch("post", [name, array_slice(arguments, 1)]);
	};
	
	/**
	 * Applies the promised function in a future turn.
	 * @param object    promise or immediate reference for target function
	 * @param args      array of application arguments
	 */
	Q.fapply = function (object, args) {
	    return Q(object).dispatch("apply", [void 0, args]);
	};
	
	Promise.prototype.fapply = function (args) {
	    return this.dispatch("apply", [void 0, args]);
	};
	
	/**
	 * Calls the promised function in a future turn.
	 * @param object    promise or immediate reference for target function
	 * @param ...args   array of application arguments
	 */
	Q["try"] =
	Q.fcall = function (object /* ...args*/) {
	    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
	};
	
	Promise.prototype.fcall = function (/*...args*/) {
	    return this.dispatch("apply", [void 0, array_slice(arguments)]);
	};
	
	/**
	 * Binds the promised function, transforming return values into a fulfilled
	 * promise and thrown errors into a rejected one.
	 * @param object    promise or immediate reference for target function
	 * @param ...args   array of application arguments
	 */
	Q.fbind = function (object /*...args*/) {
	    var promise = Q(object);
	    var args = array_slice(arguments, 1);
	    return function fbound() {
	        return promise.dispatch("apply", [
	            this,
	            args.concat(array_slice(arguments))
	        ]);
	    };
	};
	Promise.prototype.fbind = function (/*...args*/) {
	    var promise = this;
	    var args = array_slice(arguments);
	    return function fbound() {
	        return promise.dispatch("apply", [
	            this,
	            args.concat(array_slice(arguments))
	        ]);
	    };
	};
	
	/**
	 * Requests the names of the owned properties of a promised
	 * object in a future turn.
	 * @param object    promise or immediate reference for target object
	 * @return promise for the keys of the eventually settled object
	 */
	Q.keys = function (object) {
	    return Q(object).dispatch("keys", []);
	};
	
	Promise.prototype.keys = function () {
	    return this.dispatch("keys", []);
	};
	
	/**
	 * Turns an array of promises into a promise for an array.  If any of
	 * the promises gets rejected, the whole array is rejected immediately.
	 * @param {Array*} an array (or promise for an array) of values (or
	 * promises for values)
	 * @returns a promise for an array of the corresponding values
	 */
	// By Mark Miller
	// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
	Q.all = all;
	function all(promises) {
	    return when(promises, function (promises) {
	        var countDown = 0;
	        var deferred = defer();
	        array_reduce(promises, function (undefined, promise, index) {
	            var snapshot;
	            if (
	                isPromise(promise) &&
	                (snapshot = promise.inspect()).state === "fulfilled"
	            ) {
	                promises[index] = snapshot.value;
	            } else {
	                ++countDown;
	                when(
	                    promise,
	                    function (value) {
	                        promises[index] = value;
	                        if (--countDown === 0) {
	                            deferred.resolve(promises);
	                        }
	                    },
	                    deferred.reject,
	                    function (progress) {
	                        deferred.notify({ index: index, value: progress });
	                    }
	                );
	            }
	        }, void 0);
	        if (countDown === 0) {
	            deferred.resolve(promises);
	        }
	        return deferred.promise;
	    });
	}
	
	Promise.prototype.all = function () {
	    return all(this);
	};
	
	/**
	 * Waits for all promises to be settled, either fulfilled or
	 * rejected.  This is distinct from `all` since that would stop
	 * waiting at the first rejection.  The promise returned by
	 * `allResolved` will never be rejected.
	 * @param promises a promise for an array (or an array) of promises
	 * (or values)
	 * @return a promise for an array of promises
	 */
	Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
	function allResolved(promises) {
	    return when(promises, function (promises) {
	        promises = array_map(promises, Q);
	        return when(all(array_map(promises, function (promise) {
	            return when(promise, noop, noop);
	        })), function () {
	            return promises;
	        });
	    });
	}
	
	Promise.prototype.allResolved = function () {
	    return allResolved(this);
	};
	
	/**
	 * @see Promise#allSettled
	 */
	Q.allSettled = allSettled;
	function allSettled(promises) {
	    return Q(promises).allSettled();
	}
	
	/**
	 * Turns an array of promises into a promise for an array of their states (as
	 * returned by `inspect`) when they have all settled.
	 * @param {Array[Any*]} values an array (or promise for an array) of values (or
	 * promises for values)
	 * @returns {Array[State]} an array of states for the respective values.
	 */
	Promise.prototype.allSettled = function () {
	    return this.then(function (promises) {
	        return all(array_map(promises, function (promise) {
	            promise = Q(promise);
	            function regardless() {
	                return promise.inspect();
	            }
	            return promise.then(regardless, regardless);
	        }));
	    });
	};
	
	/**
	 * Captures the failure of a promise, giving an oportunity to recover
	 * with a callback.  If the given promise is fulfilled, the returned
	 * promise is fulfilled.
	 * @param {Any*} promise for something
	 * @param {Function} callback to fulfill the returned promise if the
	 * given promise is rejected
	 * @returns a promise for the return value of the callback
	 */
	Q.fail = // XXX legacy
	Q["catch"] = function (object, rejected) {
	    return Q(object).then(void 0, rejected);
	};
	
	Promise.prototype.fail = // XXX legacy
	Promise.prototype["catch"] = function (rejected) {
	    return this.then(void 0, rejected);
	};
	
	/**
	 * Attaches a listener that can respond to progress notifications from a
	 * promise's originating deferred. This listener receives the exact arguments
	 * passed to ``deferred.notify``.
	 * @param {Any*} promise for something
	 * @param {Function} callback to receive any progress notifications
	 * @returns the given promise, unchanged
	 */
	Q.progress = progress;
	function progress(object, progressed) {
	    return Q(object).then(void 0, void 0, progressed);
	}
	
	Promise.prototype.progress = function (progressed) {
	    return this.then(void 0, void 0, progressed);
	};
	
	/**
	 * Provides an opportunity to observe the settling of a promise,
	 * regardless of whether the promise is fulfilled or rejected.  Forwards
	 * the resolution to the returned promise when the callback is done.
	 * The callback can return a promise to defer completion.
	 * @param {Any*} promise
	 * @param {Function} callback to observe the resolution of the given
	 * promise, takes no arguments.
	 * @returns a promise for the resolution of the given promise when
	 * ``fin`` is done.
	 */
	Q.fin = // XXX legacy
	Q["finally"] = function (object, callback) {
	    return Q(object)["finally"](callback);
	};
	
	Promise.prototype.fin = // XXX legacy
	Promise.prototype["finally"] = function (callback) {
	    callback = Q(callback);
	    return this.then(function (value) {
	        return callback.fcall().then(function () {
	            return value;
	        });
	    }, function (reason) {
	        // TODO attempt to recycle the rejection with "this".
	        return callback.fcall().then(function () {
	            throw reason;
	        });
	    });
	};
	
	/**
	 * Terminates a chain of promises, forcing rejections to be
	 * thrown as exceptions.
	 * @param {Any*} promise at the end of a chain of promises
	 * @returns nothing
	 */
	Q.done = function (object, fulfilled, rejected, progress) {
	    return Q(object).done(fulfilled, rejected, progress);
	};
	
	Promise.prototype.done = function (fulfilled, rejected, progress) {
	    var onUnhandledError = function (error) {
	        // forward to a future turn so that ``when``
	        // does not catch it and turn it into a rejection.
	        nextTick(function () {
	            makeStackTraceLong(error, promise);
	            if (Q.onerror) {
	                Q.onerror(error);
	            } else {
	                throw error;
	            }
	        });
	    };
	
	    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
	    var promise = fulfilled || rejected || progress ?
	        this.then(fulfilled, rejected, progress) :
	        this;
	
	    if (typeof process === "object" && process && process.domain) {
	        onUnhandledError = process.domain.bind(onUnhandledError);
	    }
	
	    promise.then(void 0, onUnhandledError);
	};
	
	/**
	 * Causes a promise to be rejected if it does not get fulfilled before
	 * some milliseconds time out.
	 * @param {Any*} promise
	 * @param {Number} milliseconds timeout
	 * @param {String} custom error message (optional)
	 * @returns a promise for the resolution of the given promise if it is
	 * fulfilled before the timeout, otherwise rejected.
	 */
	Q.timeout = function (object, ms, message) {
	    return Q(object).timeout(ms, message);
	};
	
	Promise.prototype.timeout = function (ms, message) {
	    var deferred = defer();
	    var timeoutId = setTimeout(function () {
	        deferred.reject(new Error(message || "Timed out after " + ms + " ms"));
	    }, ms);
	
	    this.then(function (value) {
	        clearTimeout(timeoutId);
	        deferred.resolve(value);
	    }, function (exception) {
	        clearTimeout(timeoutId);
	        deferred.reject(exception);
	    }, deferred.notify);
	
	    return deferred.promise;
	};
	
	/**
	 * Returns a promise for the given value (or promised value), some
	 * milliseconds after it resolved. Passes rejections immediately.
	 * @param {Any*} promise
	 * @param {Number} milliseconds
	 * @returns a promise for the resolution of the given promise after milliseconds
	 * time has elapsed since the resolution of the given promise.
	 * If the given promise rejects, that is passed immediately.
	 */
	Q.delay = function (object, timeout) {
	    if (timeout === void 0) {
	        timeout = object;
	        object = void 0;
	    }
	    return Q(object).delay(timeout);
	};
	
	Promise.prototype.delay = function (timeout) {
	    return this.then(function (value) {
	        var deferred = defer();
	        setTimeout(function () {
	            deferred.resolve(value);
	        }, timeout);
	        return deferred.promise;
	    });
	};
	
	/**
	 * Passes a continuation to a Node function, which is called with the given
	 * arguments provided as an array, and returns a promise.
	 *
	 *      Q.nfapply(FS.readFile, [__filename])
	 *      .then(function (content) {
	 *      })
	 *
	 */
	Q.nfapply = function (callback, args) {
	    return Q(callback).nfapply(args);
	};
	
	Promise.prototype.nfapply = function (args) {
	    var deferred = defer();
	    var nodeArgs = array_slice(args);
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.fapply(nodeArgs).fail(deferred.reject);
	    return deferred.promise;
	};
	
	/**
	 * Passes a continuation to a Node function, which is called with the given
	 * arguments provided individually, and returns a promise.
	 * @example
	 * Q.nfcall(FS.readFile, __filename)
	 * .then(function (content) {
	 * })
	 *
	 */
	Q.nfcall = function (callback /*...args*/) {
	    var args = array_slice(arguments, 1);
	    return Q(callback).nfapply(args);
	};
	
	Promise.prototype.nfcall = function (/*...args*/) {
	    var nodeArgs = array_slice(arguments);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.fapply(nodeArgs).fail(deferred.reject);
	    return deferred.promise;
	};
	
	/**
	 * Wraps a NodeJS continuation passing function and returns an equivalent
	 * version that returns a promise.
	 * @example
	 * Q.nfbind(FS.readFile, __filename)("utf-8")
	 * .then(console.log)
	 * .done()
	 */
	Q.nfbind =
	Q.denodeify = function (callback /*...args*/) {
	    var baseArgs = array_slice(arguments, 1);
	    return function () {
	        var nodeArgs = baseArgs.concat(array_slice(arguments));
	        var deferred = defer();
	        nodeArgs.push(deferred.makeNodeResolver());
	        Q(callback).fapply(nodeArgs).fail(deferred.reject);
	        return deferred.promise;
	    };
	};
	
	Promise.prototype.nfbind =
	Promise.prototype.denodeify = function (/*...args*/) {
	    var args = array_slice(arguments);
	    args.unshift(this);
	    return Q.denodeify.apply(void 0, args);
	};
	
	Q.nbind = function (callback, thisp /*...args*/) {
	    var baseArgs = array_slice(arguments, 2);
	    return function () {
	        var nodeArgs = baseArgs.concat(array_slice(arguments));
	        var deferred = defer();
	        nodeArgs.push(deferred.makeNodeResolver());
	        function bound() {
	            return callback.apply(thisp, arguments);
	        }
	        Q(bound).fapply(nodeArgs).fail(deferred.reject);
	        return deferred.promise;
	    };
	};
	
	Promise.prototype.nbind = function (/*thisp, ...args*/) {
	    var args = array_slice(arguments, 0);
	    args.unshift(this);
	    return Q.nbind.apply(void 0, args);
	};
	
	/**
	 * Calls a method of a Node-style object that accepts a Node-style
	 * callback with a given array of arguments, plus a provided callback.
	 * @param object an object that has the named method
	 * @param {String} name name of the method of object
	 * @param {Array} args arguments to pass to the method; the callback
	 * will be provided by Q and appended to these arguments.
	 * @returns a promise for the value or error
	 */
	Q.nmapply = // XXX As proposed by "Redsandro"
	Q.npost = function (object, name, args) {
	    return Q(object).npost(name, args);
	};
	
	Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
	Promise.prototype.npost = function (name, args) {
	    var nodeArgs = array_slice(args || []);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
	    return deferred.promise;
	};
	
	/**
	 * Calls a method of a Node-style object that accepts a Node-style
	 * callback, forwarding the given variadic arguments, plus a provided
	 * callback argument.
	 * @param object an object that has the named method
	 * @param {String} name name of the method of object
	 * @param ...args arguments to pass to the method; the callback will
	 * be provided by Q and appended to these arguments.
	 * @returns a promise for the value or error
	 */
	Q.nsend = // XXX Based on Mark Miller's proposed "send"
	Q.nmcall = // XXX Based on "Redsandro's" proposal
	Q.ninvoke = function (object, name /*...args*/) {
	    var nodeArgs = array_slice(arguments, 2);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
	    return deferred.promise;
	};
	
	Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
	Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
	Promise.prototype.ninvoke = function (name /*...args*/) {
	    var nodeArgs = array_slice(arguments, 1);
	    var deferred = defer();
	    nodeArgs.push(deferred.makeNodeResolver());
	    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
	    return deferred.promise;
	};
	
	/**
	 * If a function would like to support both Node continuation-passing-style and
	 * promise-returning-style, it can end its internal promise chain with
	 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
	 * elects to use a nodeback, the result will be sent there.  If they do not
	 * pass a nodeback, they will receive the result promise.
	 * @param object a result (or a promise for a result)
	 * @param {Function} nodeback a Node.js-style callback
	 * @returns either the promise or nothing
	 */
	Q.nodeify = nodeify;
	function nodeify(object, nodeback) {
	    return Q(object).nodeify(nodeback);
	}
	
	Promise.prototype.nodeify = function (nodeback) {
	    if (nodeback) {
	        this.then(function (value) {
	            nextTick(function () {
	                nodeback(null, value);
	            });
	        }, function (error) {
	            nextTick(function () {
	                nodeback(error);
	            });
	        });
	    } else {
	        return this;
	    }
	};
	
	// All code before this point will be filtered from stack traces.
	var qEndingLine = captureLine();
	
	return Q;
	
	});
	
	/* WEBPACK VAR INJECTION */}.call(exports, __triton_require__(24)))

/***/ },
/* 9 */
/***/ function(module, exports, __triton_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {
	
	
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
			var debug = __triton_require__(19)('rf:PageObject');
			debug("WARNING: PageObject implementor doesn't override " + functionName, instance);
		}
	}
	
	module.exports = PageObject;
	module.exports.MetaTag = MetaTag;
	/* WEBPACK VAR INJECTION */}.call(exports, __triton_require__(24)))

/***/ },
/* 10 */
/***/ function(module, exports, __triton_require__) {

	
	var React = __triton_require__(1);
	
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
/* 11 */
/***/ function(module, exports, __triton_require__) {

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
/* 12 */
/***/ function(module, exports, __triton_require__) {

	
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
/***/ function(module, exports, __triton_require__) {

	/**
	 * Copyright 2014, Yahoo! Inc.
	 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
	 * 
	 * converted to ES6 syntax by Redfin; dropped interaction with dispatcher.
	 */
	// 'use strict';
	
	var debug = __triton_require__(19)('rf:BaseStore'),
		EventEmitter = __triton_require__(25).EventEmitter,
		Q = __triton_require__(8),
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
/* 14 */
/***/ function(module, exports, __triton_require__) {

	
	var EventEmitter = __triton_require__(25).EventEmitter;
	
	for(var EventEmitter____Key in EventEmitter){if(EventEmitter.hasOwnProperty(EventEmitter____Key)){Action[EventEmitter____Key]=EventEmitter[EventEmitter____Key];}}var ____SuperProtoOfEventEmitter=EventEmitter===null?null:EventEmitter.prototype;Action.prototype=Object.create(____SuperProtoOfEventEmitter);Action.prototype.constructor=Action;Action.__superConstructor__=EventEmitter;function Action(){"use strict";if(EventEmitter!==null){EventEmitter.apply(this,arguments);}}
	
		Action.prototype.trigger=function(payload) {"use strict";
			if (false) {
				throw "Can't trigger events server-side!";
			}
			this.emit('trigger', payload);
		};
	
		Action.prototype.triggerAsync=function(payload) {"use strict";
			if (false) {
				throw "Can't trigger events server-side!";
			}
			setTimeout( function()  {
				this.trigger(payload);
			}.bind(this), 0);
		};
	
		Action.prototype.onTrigger=function(callback) {"use strict";
			if (false) {
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
/***/ function(module, exports, __triton_require__) {

	var debug = __triton_require__(19)('rf:SuperAgentWrapperPlugin'),
		superagent = __triton_require__(21);
	
	
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
/* 16 */
/***/ function(module, exports, __triton_require__) {

	
	var Q = __triton_require__(8),
		debug = __triton_require__(19)('rf:Loader'),
		config = __triton_require__(4);
	
	
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
	
				if (false) {
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
					if (false) {
						this.dataCache[actualUrl].loaded = true;
						this.dataCache[actualUrl].data = res.body;
					}
					dfd.resolve(res.body);
				}.bind(this));
			
			if (false) {
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
	
			if (false) {
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
/* 17 */
/***/ function(module, exports, __triton_require__) {

	
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
/* 18 */
/***/ function(module, exports, __triton_require__) {

	
	var EventEmitter = __triton_require__(25).EventEmitter,
		Router = __triton_require__(26),
		Q = __triton_require__(8);
	
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
/* 19 */
/***/ function(module, exports, __triton_require__) {

	
	/**
	 * This is the web browser implementation of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */
	
	exports = module.exports = __triton_require__(23);
	exports.log = log;
	exports.formatArgs = formatArgs;
	exports.save = save;
	exports.load = load;
	exports.useColors = useColors;
	
	/**
	 * Colors.
	 */
	
	exports.colors = [
	  'lightseagreen',
	  'forestgreen',
	  'goldenrod',
	  'dodgerblue',
	  'darkorchid',
	  'crimson'
	];
	
	/**
	 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
	 * and the Firebug extension (any Firefox version) are known
	 * to support "%c" CSS customizations.
	 *
	 * TODO: add a `localStorage` variable to explicitly enable/disable colors
	 */
	
	function useColors() {
	  // is webkit? http://stackoverflow.com/a/16459606/376773
	  return ('WebkitAppearance' in document.documentElement.style) ||
	    // is firebug? http://stackoverflow.com/a/398120/376773
	    (window.console && (console.firebug || (console.exception && console.table))) ||
	    // is firefox >= v31?
	    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
	    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
	}
	
	/**
	 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
	 */
	
	exports.formatters.j = function(v) {
	  return JSON.stringify(v);
	};
	
	
	/**
	 * Colorize log arguments if enabled.
	 *
	 * @api public
	 */
	
	function formatArgs() {
	  var args = arguments;
	  var useColors = this.useColors;
	
	  args[0] = (useColors ? '%c' : '')
	    + this.namespace
	    + (useColors ? ' %c' : ' ')
	    + args[0]
	    + (useColors ? '%c ' : ' ')
	    + '+' + exports.humanize(this.diff);
	
	  if (!useColors) return args;
	
	  var c = 'color: ' + this.color;
	  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));
	
	  // the final "%c" is somewhat tricky, because there could be other
	  // arguments passed either before or after the %c, so we need to
	  // figure out the correct index to insert the CSS into
	  var index = 0;
	  var lastC = 0;
	  args[0].replace(/%[a-z%]/g, function(match) {
	    if ('%%' === match) return;
	    index++;
	    if ('%c' === match) {
	      // we only are interested in the *last* %c
	      // (the user may have provided their own)
	      lastC = index;
	    }
	  });
	
	  args.splice(lastC, 0, c);
	  return args;
	}
	
	/**
	 * Invokes `console.log()` when available.
	 * No-op when `console.log` is not a "function".
	 *
	 * @api public
	 */
	
	function log() {
	  // This hackery is required for IE8,
	  // where the `console.log` function doesn't have 'apply'
	  return 'object' == typeof console
	    && 'function' == typeof console.log
	    && Function.prototype.apply.call(console.log, console, arguments);
	}
	
	/**
	 * Save `namespaces`.
	 *
	 * @param {String} namespaces
	 * @api private
	 */
	
	function save(namespaces) {
	  try {
	    if (null == namespaces) {
	      localStorage.removeItem('debug');
	    } else {
	      localStorage.debug = namespaces;
	    }
	  } catch(e) {}
	}
	
	/**
	 * Load `namespaces`.
	 *
	 * @return {String} returns the previously persisted debug modes
	 * @api private
	 */
	
	function load() {
	  var r;
	  try {
	    r = localStorage.debug;
	  } catch(e) {}
	  return r;
	}
	
	/**
	 * Enable namespaces listed in `localStorage.debug` initially.
	 */
	
	exports.enable(load());


/***/ },
/* 20 */
/***/ function(module, exports, __triton_require__) {

	/**
	 * Copyright 2014, Yahoo! Inc.
	 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
	 */
	 /**
	  * Redfin: converted to not use a dispatcher or navigateAction, and to use a different
	  * form for triggering navigation. Removed setImmediate?
	  */
	'use strict';
	
	var History = __triton_require__(22),
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
/* 21 */
/***/ function(module, exports, __triton_require__) {

	/**
	 * Module dependencies.
	 */
	
	var Emitter = __triton_require__(27);
	var reduce = __triton_require__(28);
	
	/**
	 * Root reference for iframes.
	 */
	
	var root = 'undefined' == typeof window
	  ? this
	  : window;
	
	/**
	 * Noop.
	 */
	
	function noop(){};
	
	/**
	 * Check if `obj` is a host object,
	 * we don't want to serialize these :)
	 *
	 * TODO: future proof, move to compoent land
	 *
	 * @param {Object} obj
	 * @return {Boolean}
	 * @api private
	 */
	
	function isHost(obj) {
	  var str = {}.toString.call(obj);
	
	  switch (str) {
	    case '[object File]':
	    case '[object Blob]':
	    case '[object FormData]':
	      return true;
	    default:
	      return false;
	  }
	}
	
	/**
	 * Determine XHR.
	 */
	
	function getXHR() {
	  if (root.XMLHttpRequest
	    && ('file:' != root.location.protocol || !root.ActiveXObject)) {
	    return new XMLHttpRequest;
	  } else {
	    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
	  }
	  return false;
	}
	
	/**
	 * Removes leading and trailing whitespace, added to support IE.
	 *
	 * @param {String} s
	 * @return {String}
	 * @api private
	 */
	
	var trim = ''.trim
	  ? function(s) { return s.trim(); }
	  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };
	
	/**
	 * Check if `obj` is an object.
	 *
	 * @param {Object} obj
	 * @return {Boolean}
	 * @api private
	 */
	
	function isObject(obj) {
	  return obj === Object(obj);
	}
	
	/**
	 * Serialize the given `obj`.
	 *
	 * @param {Object} obj
	 * @return {String}
	 * @api private
	 */
	
	function serialize(obj) {
	  if (!isObject(obj)) return obj;
	  var pairs = [];
	  for (var key in obj) {
	    if (null != obj[key]) {
	      pairs.push(encodeURIComponent(key)
	        + '=' + encodeURIComponent(obj[key]));
	    }
	  }
	  return pairs.join('&');
	}
	
	/**
	 * Expose serialization method.
	 */
	
	 request.serializeObject = serialize;
	
	 /**
	  * Parse the given x-www-form-urlencoded `str`.
	  *
	  * @param {String} str
	  * @return {Object}
	  * @api private
	  */
	
	function parseString(str) {
	  var obj = {};
	  var pairs = str.split('&');
	  var parts;
	  var pair;
	
	  for (var i = 0, len = pairs.length; i < len; ++i) {
	    pair = pairs[i];
	    parts = pair.split('=');
	    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
	  }
	
	  return obj;
	}
	
	/**
	 * Expose parser.
	 */
	
	request.parseString = parseString;
	
	/**
	 * Default MIME type map.
	 *
	 *     superagent.types.xml = 'application/xml';
	 *
	 */
	
	request.types = {
	  html: 'text/html',
	  json: 'application/json',
	  xml: 'application/xml',
	  urlencoded: 'application/x-www-form-urlencoded',
	  'form': 'application/x-www-form-urlencoded',
	  'form-data': 'application/x-www-form-urlencoded'
	};
	
	/**
	 * Default serialization map.
	 *
	 *     superagent.serialize['application/xml'] = function(obj){
	 *       return 'generated xml here';
	 *     };
	 *
	 */
	
	 request.serialize = {
	   'application/x-www-form-urlencoded': serialize,
	   'application/json': JSON.stringify
	 };
	
	 /**
	  * Default parsers.
	  *
	  *     superagent.parse['application/xml'] = function(str){
	  *       return { object parsed from str };
	  *     };
	  *
	  */
	
	request.parse = {
	  'application/x-www-form-urlencoded': parseString,
	  'application/json': JSON.parse
	};
	
	/**
	 * Parse the given header `str` into
	 * an object containing the mapped fields.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */
	
	function parseHeader(str) {
	  var lines = str.split(/\r?\n/);
	  var fields = {};
	  var index;
	  var line;
	  var field;
	  var val;
	
	  lines.pop(); // trailing CRLF
	
	  for (var i = 0, len = lines.length; i < len; ++i) {
	    line = lines[i];
	    index = line.indexOf(':');
	    field = line.slice(0, index).toLowerCase();
	    val = trim(line.slice(index + 1));
	    fields[field] = val;
	  }
	
	  return fields;
	}
	
	/**
	 * Return the mime type for the given `str`.
	 *
	 * @param {String} str
	 * @return {String}
	 * @api private
	 */
	
	function type(str){
	  return str.split(/ *; */).shift();
	};
	
	/**
	 * Return header field parameters.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */
	
	function params(str){
	  return reduce(str.split(/ *; */), function(obj, str){
	    var parts = str.split(/ *= */)
	      , key = parts.shift()
	      , val = parts.shift();
	
	    if (key && val) obj[key] = val;
	    return obj;
	  }, {});
	};
	
	/**
	 * Initialize a new `Response` with the given `xhr`.
	 *
	 *  - set flags (.ok, .error, etc)
	 *  - parse header
	 *
	 * Examples:
	 *
	 *  Aliasing `superagent` as `request` is nice:
	 *
	 *      request = superagent;
	 *
	 *  We can use the promise-like API, or pass callbacks:
	 *
	 *      request.get('/').end(function(res){});
	 *      request.get('/', function(res){});
	 *
	 *  Sending data can be chained:
	 *
	 *      request
	 *        .post('/user')
	 *        .send({ name: 'tj' })
	 *        .end(function(res){});
	 *
	 *  Or passed to `.send()`:
	 *
	 *      request
	 *        .post('/user')
	 *        .send({ name: 'tj' }, function(res){});
	 *
	 *  Or passed to `.post()`:
	 *
	 *      request
	 *        .post('/user', { name: 'tj' })
	 *        .end(function(res){});
	 *
	 * Or further reduced to a single call for simple cases:
	 *
	 *      request
	 *        .post('/user', { name: 'tj' }, function(res){});
	 *
	 * @param {XMLHTTPRequest} xhr
	 * @param {Object} options
	 * @api private
	 */
	
	function Response(req, options) {
	  options = options || {};
	  this.req = req;
	  this.xhr = this.req.xhr;
	  this.text = this.req.method !='HEAD' 
	     ? this.xhr.responseText 
	     : null;
	  this.setStatusProperties(this.xhr.status);
	  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
	  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
	  // getResponseHeader still works. so we get content-type even if getting
	  // other headers fails.
	  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
	  this.setHeaderProperties(this.header);
	  this.body = this.req.method != 'HEAD'
	    ? this.parseBody(this.text)
	    : null;
	}
	
	/**
	 * Get case-insensitive `field` value.
	 *
	 * @param {String} field
	 * @return {String}
	 * @api public
	 */
	
	Response.prototype.get = function(field){
	  return this.header[field.toLowerCase()];
	};
	
	/**
	 * Set header related properties:
	 *
	 *   - `.type` the content type without params
	 *
	 * A response of "Content-Type: text/plain; charset=utf-8"
	 * will provide you with a `.type` of "text/plain".
	 *
	 * @param {Object} header
	 * @api private
	 */
	
	Response.prototype.setHeaderProperties = function(header){
	  // content-type
	  var ct = this.header['content-type'] || '';
	  this.type = type(ct);
	
	  // params
	  var obj = params(ct);
	  for (var key in obj) this[key] = obj[key];
	};
	
	/**
	 * Parse the given body `str`.
	 *
	 * Used for auto-parsing of bodies. Parsers
	 * are defined on the `superagent.parse` object.
	 *
	 * @param {String} str
	 * @return {Mixed}
	 * @api private
	 */
	
	Response.prototype.parseBody = function(str){
	  var parse = request.parse[this.type];
	  return parse && str && str.length
	    ? parse(str)
	    : null;
	};
	
	/**
	 * Set flags such as `.ok` based on `status`.
	 *
	 * For example a 2xx response will give you a `.ok` of __true__
	 * whereas 5xx will be __false__ and `.error` will be __true__. The
	 * `.clientError` and `.serverError` are also available to be more
	 * specific, and `.statusType` is the class of error ranging from 1..5
	 * sometimes useful for mapping respond colors etc.
	 *
	 * "sugar" properties are also defined for common cases. Currently providing:
	 *
	 *   - .noContent
	 *   - .badRequest
	 *   - .unauthorized
	 *   - .notAcceptable
	 *   - .notFound
	 *
	 * @param {Number} status
	 * @api private
	 */
	
	Response.prototype.setStatusProperties = function(status){
	  var type = status / 100 | 0;
	
	  // status / class
	  this.status = status;
	  this.statusType = type;
	
	  // basics
	  this.info = 1 == type;
	  this.ok = 2 == type;
	  this.clientError = 4 == type;
	  this.serverError = 5 == type;
	  this.error = (4 == type || 5 == type)
	    ? this.toError()
	    : false;
	
	  // sugar
	  this.accepted = 202 == status;
	  this.noContent = 204 == status || 1223 == status;
	  this.badRequest = 400 == status;
	  this.unauthorized = 401 == status;
	  this.notAcceptable = 406 == status;
	  this.notFound = 404 == status;
	  this.forbidden = 403 == status;
	};
	
	/**
	 * Return an `Error` representative of this response.
	 *
	 * @return {Error}
	 * @api public
	 */
	
	Response.prototype.toError = function(){
	  var req = this.req;
	  var method = req.method;
	  var url = req.url;
	
	  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
	  var err = new Error(msg);
	  err.status = this.status;
	  err.method = method;
	  err.url = url;
	
	  return err;
	};
	
	/**
	 * Expose `Response`.
	 */
	
	request.Response = Response;
	
	/**
	 * Initialize a new `Request` with the given `method` and `url`.
	 *
	 * @param {String} method
	 * @param {String} url
	 * @api public
	 */
	
	function Request(method, url) {
	  var self = this;
	  Emitter.call(this);
	  this._query = this._query || [];
	  this.method = method;
	  this.url = url;
	  this.header = {};
	  this._header = {};
	  this.on('end', function(){
	    var err = null;
	    var res = null;
	
	    try {
	      res = new Response(self); 
	    } catch(e) {
	      err = new Error('Parser is unable to parse the response');
	      err.parse = true;
	      err.original = e;
	    }
	
	    self.callback(err, res);
	  });
	}
	
	/**
	 * Mixin `Emitter`.
	 */
	
	Emitter(Request.prototype);
	
	/**
	 * Allow for extension
	 */
	
	Request.prototype.use = function(fn) {
	  fn(this);
	  return this;
	}
	
	/**
	 * Set timeout to `ms`.
	 *
	 * @param {Number} ms
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.timeout = function(ms){
	  this._timeout = ms;
	  return this;
	};
	
	/**
	 * Clear previous timeout.
	 *
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.clearTimeout = function(){
	  this._timeout = 0;
	  clearTimeout(this._timer);
	  return this;
	};
	
	/**
	 * Abort the request, and clear potential timeout.
	 *
	 * @return {Request}
	 * @api public
	 */
	
	Request.prototype.abort = function(){
	  if (this.aborted) return;
	  this.aborted = true;
	  this.xhr.abort();
	  this.clearTimeout();
	  this.emit('abort');
	  return this;
	};
	
	/**
	 * Set header `field` to `val`, or multiple fields with one object.
	 *
	 * Examples:
	 *
	 *      req.get('/')
	 *        .set('Accept', 'application/json')
	 *        .set('X-API-Key', 'foobar')
	 *        .end(callback);
	 *
	 *      req.get('/')
	 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
	 *        .end(callback);
	 *
	 * @param {String|Object} field
	 * @param {String} val
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.set = function(field, val){
	  if (isObject(field)) {
	    for (var key in field) {
	      this.set(key, field[key]);
	    }
	    return this;
	  }
	  this._header[field.toLowerCase()] = val;
	  this.header[field] = val;
	  return this;
	};
	
	/**
	 * Remove header `field`.
	 *
	 * Example:
	 *
	 *      req.get('/')
	 *        .unset('User-Agent')
	 *        .end(callback);
	 *
	 * @param {String} field
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.unset = function(field){
	  delete this._header[field.toLowerCase()];
	  delete this.header[field];
	  return this;
	};
	
	/**
	 * Get case-insensitive header `field` value.
	 *
	 * @param {String} field
	 * @return {String}
	 * @api private
	 */
	
	Request.prototype.getHeader = function(field){
	  return this._header[field.toLowerCase()];
	};
	
	/**
	 * Set Content-Type to `type`, mapping values from `request.types`.
	 *
	 * Examples:
	 *
	 *      superagent.types.xml = 'application/xml';
	 *
	 *      request.post('/')
	 *        .type('xml')
	 *        .send(xmlstring)
	 *        .end(callback);
	 *
	 *      request.post('/')
	 *        .type('application/xml')
	 *        .send(xmlstring)
	 *        .end(callback);
	 *
	 * @param {String} type
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.type = function(type){
	  this.set('Content-Type', request.types[type] || type);
	  return this;
	};
	
	/**
	 * Set Accept to `type`, mapping values from `request.types`.
	 *
	 * Examples:
	 *
	 *      superagent.types.json = 'application/json';
	 *
	 *      request.get('/agent')
	 *        .accept('json')
	 *        .end(callback);
	 *
	 *      request.get('/agent')
	 *        .accept('application/json')
	 *        .end(callback);
	 *
	 * @param {String} accept
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.accept = function(type){
	  this.set('Accept', request.types[type] || type);
	  return this;
	};
	
	/**
	 * Set Authorization field value with `user` and `pass`.
	 *
	 * @param {String} user
	 * @param {String} pass
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.auth = function(user, pass){
	  var str = btoa(user + ':' + pass);
	  this.set('Authorization', 'Basic ' + str);
	  return this;
	};
	
	/**
	* Add query-string `val`.
	*
	* Examples:
	*
	*   request.get('/shoes')
	*     .query('size=10')
	*     .query({ color: 'blue' })
	*
	* @param {Object|String} val
	* @return {Request} for chaining
	* @api public
	*/
	
	Request.prototype.query = function(val){
	  if ('string' != typeof val) val = serialize(val);
	  if (val) this._query.push(val);
	  return this;
	};
	
	/**
	 * Write the field `name` and `val` for "multipart/form-data"
	 * request bodies.
	 *
	 * ``` js
	 * request.post('/upload')
	 *   .field('foo', 'bar')
	 *   .end(callback);
	 * ```
	 *
	 * @param {String} name
	 * @param {String|Blob|File} val
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.field = function(name, val){
	  if (!this._formData) this._formData = new FormData();
	  this._formData.append(name, val);
	  return this;
	};
	
	/**
	 * Queue the given `file` as an attachment to the specified `field`,
	 * with optional `filename`.
	 *
	 * ``` js
	 * request.post('/upload')
	 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
	 *   .end(callback);
	 * ```
	 *
	 * @param {String} field
	 * @param {Blob|File} file
	 * @param {String} filename
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.attach = function(field, file, filename){
	  if (!this._formData) this._formData = new FormData();
	  this._formData.append(field, file, filename);
	  return this;
	};
	
	/**
	 * Send `data`, defaulting the `.type()` to "json" when
	 * an object is given.
	 *
	 * Examples:
	 *
	 *       // querystring
	 *       request.get('/search')
	 *         .end(callback)
	 *
	 *       // multiple data "writes"
	 *       request.get('/search')
	 *         .send({ search: 'query' })
	 *         .send({ range: '1..5' })
	 *         .send({ order: 'desc' })
	 *         .end(callback)
	 *
	 *       // manual json
	 *       request.post('/user')
	 *         .type('json')
	 *         .send('{"name":"tj"})
	 *         .end(callback)
	 *
	 *       // auto json
	 *       request.post('/user')
	 *         .send({ name: 'tj' })
	 *         .end(callback)
	 *
	 *       // manual x-www-form-urlencoded
	 *       request.post('/user')
	 *         .type('form')
	 *         .send('name=tj')
	 *         .end(callback)
	 *
	 *       // auto x-www-form-urlencoded
	 *       request.post('/user')
	 *         .type('form')
	 *         .send({ name: 'tj' })
	 *         .end(callback)
	 *
	 *       // defaults to x-www-form-urlencoded
	  *      request.post('/user')
	  *        .send('name=tobi')
	  *        .send('species=ferret')
	  *        .end(callback)
	 *
	 * @param {String|Object} data
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.send = function(data){
	  var obj = isObject(data);
	  var type = this.getHeader('Content-Type');
	
	  // merge
	  if (obj && isObject(this._data)) {
	    for (var key in data) {
	      this._data[key] = data[key];
	    }
	  } else if ('string' == typeof data) {
	    if (!type) this.type('form');
	    type = this.getHeader('Content-Type');
	    if ('application/x-www-form-urlencoded' == type) {
	      this._data = this._data
	        ? this._data + '&' + data
	        : data;
	    } else {
	      this._data = (this._data || '') + data;
	    }
	  } else {
	    this._data = data;
	  }
	
	  if (!obj) return this;
	  if (!type) this.type('json');
	  return this;
	};
	
	/**
	 * Invoke the callback with `err` and `res`
	 * and handle arity check.
	 *
	 * @param {Error} err
	 * @param {Response} res
	 * @api private
	 */
	
	Request.prototype.callback = function(err, res){
	  var fn = this._callback;
	  this.clearTimeout();
	  if (2 == fn.length) return fn(err, res);
	  if (err) return this.emit('error', err);
	  fn(res);
	};
	
	/**
	 * Invoke callback with x-domain error.
	 *
	 * @api private
	 */
	
	Request.prototype.crossDomainError = function(){
	  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
	  err.crossDomain = true;
	  this.callback(err);
	};
	
	/**
	 * Invoke callback with timeout error.
	 *
	 * @api private
	 */
	
	Request.prototype.timeoutError = function(){
	  var timeout = this._timeout;
	  var err = new Error('timeout of ' + timeout + 'ms exceeded');
	  err.timeout = timeout;
	  this.callback(err);
	};
	
	/**
	 * Enable transmission of cookies with x-domain requests.
	 *
	 * Note that for this to work the origin must not be
	 * using "Access-Control-Allow-Origin" with a wildcard,
	 * and also must set "Access-Control-Allow-Credentials"
	 * to "true".
	 *
	 * @api public
	 */
	
	Request.prototype.withCredentials = function(){
	  this._withCredentials = true;
	  return this;
	};
	
	/**
	 * Initiate request, invoking callback `fn(res)`
	 * with an instanceof `Response`.
	 *
	 * @param {Function} fn
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.end = function(fn){
	  var self = this;
	  var xhr = this.xhr = getXHR();
	  var query = this._query.join('&');
	  var timeout = this._timeout;
	  var data = this._formData || this._data;
	
	  // store callback
	  this._callback = fn || noop;
	
	  // state change
	  xhr.onreadystatechange = function(){
	    if (4 != xhr.readyState) return;
	    if (0 == xhr.status) {
	      if (self.aborted) return self.timeoutError();
	      return self.crossDomainError();
	    }
	    self.emit('end');
	  };
	
	  // progress
	  if (xhr.upload) {
	    xhr.upload.onprogress = function(e){
	      e.percent = e.loaded / e.total * 100;
	      self.emit('progress', e);
	    };
	  }
	
	  // timeout
	  if (timeout && !this._timer) {
	    this._timer = setTimeout(function(){
	      self.abort();
	    }, timeout);
	  }
	
	  // querystring
	  if (query) {
	    query = request.serializeObject(query);
	    this.url += ~this.url.indexOf('?')
	      ? '&' + query
	      : '?' + query;
	  }
	
	  // initiate request
	  xhr.open(this.method, this.url, true);
	
	  // CORS
	  if (this._withCredentials) xhr.withCredentials = true;
	
	  // body
	  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
	    // serialize stuff
	    var serialize = request.serialize[this.getHeader('Content-Type')];
	    if (serialize) data = serialize(data);
	  }
	
	  // set header fields
	  for (var field in this.header) {
	    if (null == this.header[field]) continue;
	    xhr.setRequestHeader(field, this.header[field]);
	  }
	
	  // send stuff
	  this.emit('request', this);
	  xhr.send(data);
	  return this;
	};
	
	/**
	 * Expose `Request`.
	 */
	
	request.Request = Request;
	
	/**
	 * Issue a request:
	 *
	 * Examples:
	 *
	 *    request('GET', '/users').end(callback)
	 *    request('/users').end(callback)
	 *    request('/users', callback)
	 *
	 * @param {String} method
	 * @param {String|Function} url or callback
	 * @return {Request}
	 * @api public
	 */
	
	function request(method, url) {
	  // callback
	  if ('function' == typeof url) {
	    return new Request('GET', method).end(url);
	  }
	
	  // url first
	  if (1 == arguments.length) {
	    return new Request('GET', method);
	  }
	
	  return new Request(method, url);
	}
	
	/**
	 * GET `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} data or fn
	 * @param {Function} fn
	 * @return {Request}
	 * @api public
	 */
	
	request.get = function(url, data, fn){
	  var req = request('GET', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.query(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * HEAD `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} data or fn
	 * @param {Function} fn
	 * @return {Request}
	 * @api public
	 */
	
	request.head = function(url, data, fn){
	  var req = request('HEAD', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * DELETE `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Function} fn
	 * @return {Request}
	 * @api public
	 */
	
	request.del = function(url, fn){
	  var req = request('DELETE', url);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * PATCH `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed} data
	 * @param {Function} fn
	 * @return {Request}
	 * @api public
	 */
	
	request.patch = function(url, data, fn){
	  var req = request('PATCH', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * POST `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed} data
	 * @param {Function} fn
	 * @return {Request}
	 * @api public
	 */
	
	request.post = function(url, data, fn){
	  var req = request('POST', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * PUT `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} data or fn
	 * @param {Function} fn
	 * @return {Request}
	 * @api public
	 */
	
	request.put = function(url, data, fn){
	  var req = request('PUT', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * Expose `request`.
	 */
	
	module.exports = request;


/***/ },
/* 22 */
/***/ function(module, exports, __triton_require__) {

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


/***/ },
/* 23 */
/***/ function(module, exports, __triton_require__) {

	
	/**
	 * This is the common logic for both the Node.js and web browser
	 * implementations of `debug()`.
	 *
	 * Expose `debug()` as the module.
	 */
	
	exports = module.exports = debug;
	exports.coerce = coerce;
	exports.disable = disable;
	exports.enable = enable;
	exports.enabled = enabled;
	exports.humanize = __triton_require__(29);
	
	/**
	 * The currently active debug mode names, and names to skip.
	 */
	
	exports.names = [];
	exports.skips = [];
	
	/**
	 * Map of special "%n" handling functions, for the debug "format" argument.
	 *
	 * Valid key names are a single, lowercased letter, i.e. "n".
	 */
	
	exports.formatters = {};
	
	/**
	 * Previously assigned color.
	 */
	
	var prevColor = 0;
	
	/**
	 * Previous log timestamp.
	 */
	
	var prevTime;
	
	/**
	 * Select a color.
	 *
	 * @return {Number}
	 * @api private
	 */
	
	function selectColor() {
	  return exports.colors[prevColor++ % exports.colors.length];
	}
	
	/**
	 * Create a debugger with the given `namespace`.
	 *
	 * @param {String} namespace
	 * @return {Function}
	 * @api public
	 */
	
	function debug(namespace) {
	
	  // define the `disabled` version
	  function disabled() {
	  }
	  disabled.enabled = false;
	
	  // define the `enabled` version
	  function enabled() {
	
	    var self = enabled;
	
	    // set `diff` timestamp
	    var curr = +new Date();
	    var ms = curr - (prevTime || curr);
	    self.diff = ms;
	    self.prev = prevTime;
	    self.curr = curr;
	    prevTime = curr;
	
	    // add the `color` if not set
	    if (null == self.useColors) self.useColors = exports.useColors();
	    if (null == self.color && self.useColors) self.color = selectColor();
	
	    var args = Array.prototype.slice.call(arguments);
	
	    args[0] = exports.coerce(args[0]);
	
	    if ('string' !== typeof args[0]) {
	      // anything else let's inspect with %o
	      args = ['%o'].concat(args);
	    }
	
	    // apply any `formatters` transformations
	    var index = 0;
	    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
	      // if we encounter an escaped % then don't increase the array index
	      if (match === '%%') return match;
	      index++;
	      var formatter = exports.formatters[format];
	      if ('function' === typeof formatter) {
	        var val = args[index];
	        match = formatter.call(self, val);
	
	        // now we need to remove `args[index]` since it's inlined in the `format`
	        args.splice(index, 1);
	        index--;
	      }
	      return match;
	    });
	
	    if ('function' === typeof exports.formatArgs) {
	      args = exports.formatArgs.apply(self, args);
	    }
	    var logFn = enabled.log || exports.log || console.log.bind(console);
	    logFn.apply(self, args);
	  }
	  enabled.enabled = true;
	
	  var fn = exports.enabled(namespace) ? enabled : disabled;
	
	  fn.namespace = namespace;
	
	  return fn;
	}
	
	/**
	 * Enables a debug mode by namespaces. This can include modes
	 * separated by a colon and wildcards.
	 *
	 * @param {String} namespaces
	 * @api public
	 */
	
	function enable(namespaces) {
	  exports.save(namespaces);
	
	  var split = (namespaces || '').split(/[\s,]+/);
	  var len = split.length;
	
	  for (var i = 0; i < len; i++) {
	    if (!split[i]) continue; // ignore empty strings
	    namespaces = split[i].replace(/\*/g, '.*?');
	    if (namespaces[0] === '-') {
	      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
	    } else {
	      exports.names.push(new RegExp('^' + namespaces + '$'));
	    }
	  }
	}
	
	/**
	 * Disable debug output.
	 *
	 * @api public
	 */
	
	function disable() {
	  exports.enable('');
	}
	
	/**
	 * Returns true if the given mode name is enabled, false otherwise.
	 *
	 * @param {String} name
	 * @return {Boolean}
	 * @api public
	 */
	
	function enabled(name) {
	  var i, len;
	  for (i = 0, len = exports.skips.length; i < len; i++) {
	    if (exports.skips[i].test(name)) {
	      return false;
	    }
	  }
	  for (i = 0, len = exports.names.length; i < len; i++) {
	    if (exports.names[i].test(name)) {
	      return true;
	    }
	  }
	  return false;
	}
	
	/**
	 * Coerce `val`.
	 *
	 * @param {Mixed} val
	 * @return {Mixed}
	 * @api private
	 */
	
	function coerce(val) {
	  if (val instanceof Error) return val.stack || val.message;
	  return val;
	}


/***/ },
/* 24 */
/***/ function(module, exports, __triton_require__) {

	// shim for using process in browser
	
	var process = module.exports = {};
	
	process.nextTick = (function () {
	    var canSetImmediate = typeof window !== 'undefined'
	    && window.setImmediate;
	    var canMutationObserver = typeof window !== 'undefined'
	    && window.MutationObserver;
	    var canPost = typeof window !== 'undefined'
	    && window.postMessage && window.addEventListener
	    ;
	
	    if (canSetImmediate) {
	        return function (f) { return window.setImmediate(f) };
	    }
	
	    var queue = [];
	
	    if (canMutationObserver) {
	        var hiddenDiv = document.createElement("div");
	        var observer = new MutationObserver(function () {
	            var queueList = queue.slice();
	            queue.length = 0;
	            queueList.forEach(function (fn) {
	                fn();
	            });
	        });
	
	        observer.observe(hiddenDiv, { attributes: true });
	
	        return function nextTick(fn) {
	            if (!queue.length) {
	                hiddenDiv.setAttribute('yes', 'no');
	            }
	            queue.push(fn);
	        };
	    }
	
	    if (canPost) {
	        window.addEventListener('message', function (ev) {
	            var source = ev.source;
	            if ((source === window || source === null) && ev.data === 'process-tick') {
	                ev.stopPropagation();
	                if (queue.length > 0) {
	                    var fn = queue.shift();
	                    fn();
	                }
	            }
	        }, true);
	
	        return function nextTick(fn) {
	            queue.push(fn);
	            window.postMessage('process-tick', '*');
	        };
	    }
	
	    return function nextTick(fn) {
	        setTimeout(fn, 0);
	    };
	})();
	
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	// TODO(shtylman)
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};


/***/ },
/* 25 */
/***/ function(module, exports, __triton_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	
	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;
	
	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;
	
	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;
	
	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;
	
	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};
	
	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;
	
	  if (!this._events)
	    this._events = {};
	
	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      }
	      throw TypeError('Uncaught, unspecified "error" event.');
	    }
	  }
	
	  handler = this._events[type];
	
	  if (isUndefined(handler))
	    return false;
	
	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        len = arguments.length;
	        args = new Array(len - 1);
	        for (i = 1; i < len; i++)
	          args[i - 1] = arguments[i];
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    len = arguments.length;
	    args = new Array(len - 1);
	    for (i = 1; i < len; i++)
	      args[i - 1] = arguments[i];
	
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }
	
	  return true;
	};
	
	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events)
	    this._events = {};
	
	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);
	
	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];
	
	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    var m;
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }
	
	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.on = EventEmitter.prototype.addListener;
	
	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  var fired = false;
	
	  function g() {
	    this.removeListener(type, g);
	
	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }
	
	  g.listener = listener;
	  this.on(type, g);
	
	  return this;
	};
	
	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;
	
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');
	
	  if (!this._events || !this._events[type])
	    return this;
	
	  list = this._events[type];
	  length = list.length;
	  position = -1;
	
	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	
	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }
	
	    if (position < 0)
	      return this;
	
	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }
	
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }
	
	  return this;
	};
	
	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;
	
	  if (!this._events)
	    return this;
	
	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }
	
	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }
	
	  listeners = this._events[type];
	
	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];
	
	  return this;
	};
	
	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};
	
	EventEmitter.listenerCount = function(emitter, type) {
	  var ret;
	  if (!emitter._events || !emitter._events[type])
	    ret = 0;
	  else if (isFunction(emitter._events[type]))
	    ret = 1;
	  else
	    ret = emitter._events[type].length;
	  return ret;
	};
	
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	
	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	
	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ },
/* 26 */
/***/ function(module, exports, __triton_require__) {

	/**
	 * Copyright 2014, Yahoo! Inc.
	 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
	 */
	module.exports = __triton_require__(30);


/***/ },
/* 27 */
/***/ function(module, exports, __triton_require__) {

	
	/**
	 * Expose `Emitter`.
	 */
	
	module.exports = Emitter;
	
	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */
	
	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};
	
	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */
	
	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}
	
	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks[event] = this._callbacks[event] || [])
	    .push(fn);
	  return this;
	};
	
	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.once = function(event, fn){
	  var self = this;
	  this._callbacks = this._callbacks || {};
	
	  function on() {
	    self.off(event, on);
	    fn.apply(this, arguments);
	  }
	
	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};
	
	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	
	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }
	
	  // specific event
	  var callbacks = this._callbacks[event];
	  if (!callbacks) return this;
	
	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks[event];
	    return this;
	  }
	
	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};
	
	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */
	
	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks[event];
	
	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }
	
	  return this;
	};
	
	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */
	
	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks[event] || [];
	};
	
	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */
	
	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};


/***/ },
/* 28 */
/***/ function(module, exports, __triton_require__) {

	
	/**
	 * Reduce `arr` with `fn`.
	 *
	 * @param {Array} arr
	 * @param {Function} fn
	 * @param {Mixed} initial
	 *
	 * TODO: combatible error handling?
	 */
	
	module.exports = function(arr, fn, initial){  
	  var idx = 0;
	  var len = arr.length;
	  var curr = arguments.length == 3
	    ? initial
	    : arr[idx++];
	
	  while (idx < len) {
	    curr = fn.call(null, curr, arr[idx], ++idx, arr);
	  }
	  
	  return curr;
	};

/***/ },
/* 29 */
/***/ function(module, exports, __triton_require__) {

	/**
	 * Helpers.
	 */
	
	var s = 1000;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var y = d * 365.25;
	
	/**
	 * Parse or format the given `val`.
	 *
	 * Options:
	 *
	 *  - `long` verbose formatting [false]
	 *
	 * @param {String|Number} val
	 * @param {Object} options
	 * @return {String|Number}
	 * @api public
	 */
	
	module.exports = function(val, options){
	  options = options || {};
	  if ('string' == typeof val) return parse(val);
	  return options.long
	    ? long(val)
	    : short(val);
	};
	
	/**
	 * Parse the given `str` and return milliseconds.
	 *
	 * @param {String} str
	 * @return {Number}
	 * @api private
	 */
	
	function parse(str) {
	  var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
	  if (!match) return;
	  var n = parseFloat(match[1]);
	  var type = (match[2] || 'ms').toLowerCase();
	  switch (type) {
	    case 'years':
	    case 'year':
	    case 'y':
	      return n * y;
	    case 'days':
	    case 'day':
	    case 'd':
	      return n * d;
	    case 'hours':
	    case 'hour':
	    case 'h':
	      return n * h;
	    case 'minutes':
	    case 'minute':
	    case 'm':
	      return n * m;
	    case 'seconds':
	    case 'second':
	    case 's':
	      return n * s;
	    case 'ms':
	      return n;
	  }
	}
	
	/**
	 * Short format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */
	
	function short(ms) {
	  if (ms >= d) return Math.round(ms / d) + 'd';
	  if (ms >= h) return Math.round(ms / h) + 'h';
	  if (ms >= m) return Math.round(ms / m) + 'm';
	  if (ms >= s) return Math.round(ms / s) + 's';
	  return ms + 'ms';
	}
	
	/**
	 * Long format for `ms`.
	 *
	 * @param {Number} ms
	 * @return {String}
	 * @api private
	 */
	
	function long(ms) {
	  return plural(ms, d, 'day')
	    || plural(ms, h, 'hour')
	    || plural(ms, m, 'minute')
	    || plural(ms, s, 'second')
	    || ms + ' ms';
	}
	
	/**
	 * Pluralization helper.
	 */
	
	function plural(ms, n, name) {
	  if (ms < n) return;
	  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
	  return Math.ceil(ms / n) + ' ' + name + 's';
	}


/***/ },
/* 30 */
/***/ function(module, exports, __triton_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/**
	 * Copyright 2014, Yahoo! Inc.
	 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
	 */
	'use strict';
	/*global process:true */
	
	var debug = __triton_require__(19)('Routr:router'),
	    pathToRegexp = __triton_require__(31),
	    reverend = __triton_require__(32),
	    METHODS = {
	        GET: 'get'
	    };
	
	/**
	 * @class Route
	 * @param {String} name  The name of the route
	 * @param {Object} config  The configuration for this route.
	 * @param {String} config.path  The path of the route.
	 * @constructor
	 */
	function Route(name, config) {
	    this.name = name;
	    this.config = config || {};
	    this.keys = [];
	    this.regexp = pathToRegexp(this.config.path, this.keys);
	}
	
	/**
	 * Whether the given method is accepted by this route.
	 * @method acceptMethod
	 * @param {String} method  The HTTP VERB string.
	 * @return true if the method is accepted; false otherwise.
	 * @for Route
	 */
	Route.prototype.acceptMethod = function (method) {
	    //TODO support array for method, ['get', 'post']
	    return method === this.config.method;
	};
	
	/**
	 * Checkes whether this route matches the given path, method (GET as default) and optionally navigation related criteria.
	 * @method match
	 * @param {String} path   The url path to be matched to this route.  Query strings are **not** considered
	 *                        when performing the match.  E.g. /some_path?foo=bar would match to the same route
	 *                        as /some_path
	 * @param {Object} [options]
	 * @param {String} [options.method=get] The case-insensitive HTTP method string.  Defaults to 'get'.
	 * @param {Object} [options.navigate] The navigation info.
	 * @param {Object} [options.navigate.type] The navigation type: 'pageload', 'click', 'popstate'.
	 * @param {Object} [options.navigate.params] The navigation params (that are not part of the path).
	 * @return {Object|null} The matched route params if path/method/navParams matches to this route; null otherwise.
	 * @for Route
	 */
	Route.prototype.match = function (path, options) {
	    if (!path) {
	        return null;
	    }
	
	    var self = this,
	        method,
	        navParams,
	        navParamsConfig,
	        navParamConfigKeys,
	        navParamMatched,
	        pathMatches,
	        routeParams,
	        key,
	        i,
	        len,
	        pos,
	        pattern;
	
	    // remove query string from path
	    pos = path.indexOf('?');
	    if (pos >= 0) {
	        path = path.substring(0, pos);
	    }
	
	    options = options || {};
	
	    // 1. check method
	    method = (options.method && options.method.toLowerCase()) || METHODS.GET;
	    if (!self.acceptMethod(method)) {
	        return null;
	    }
	
	    // 2. check path
	    pathMatches = self.regexp.exec(path);
	    if (!pathMatches) {
	        return null;
	    }
	
	    // 3. check navParams, if this route has match requirements defined for navParams
	    navParamsConfig = (self.config.navigate && self.config.navigate.params);
	    if (navParamsConfig) {
	        navParamConfigKeys = Object.keys(navParamsConfig);
	        navParams = (options.navigate && options.navigate.params) || {};
	        for (i = 0, len = navParamConfigKeys.length; i < len; i++) {
	            // for each navParam defined in the route config, make sure
	            // the param passed in matches the defined pattern
	            key = navParamConfigKeys[i];
	            pattern = navParamsConfig[key];
	            if (pattern instanceof RegExp) {
	                navParamMatched = navParams[key] !== undefined && pattern.test(navParams[key]);
	            } else {
	                navParamMatched = (navParams[key] === pattern);
	            }
	            if (!navParamMatched) {
	                // found a non-matching navParam -> this route does not match
	                return null;
	            }
	        }
	    }
	
	    // 4. method/path/navParams all matched, extract the matched path params
	    routeParams = {};
	    for (i = 0, len = self.keys.length; i < len; i++) {
	        routeParams[self.keys[i].name] = pathMatches[i+1];
	    }
	
	    return routeParams;
	};
	
	/**
	 * Generates a path string with this route, using the specified params.
	 * @method makePath
	 * @param {Object} params  The route parameters to be used to create the path string
	 * @return {String} The generated path string.
	 * @for Route
	 */
	Route.prototype.makePath = function (params) {
	    try {
	        return reverend(this.config.path, params);
	    } catch (e) {
	        debug('Route.makePath failed, e = ', e);
	        return null;
	    }
	};
	
	/**
	 * A Router class that provides route matching and route generation functionalities.
	 * @class Router
	 * @param {Object} routes  Route table, which is a name to router config map.
	 * @constructor
	 * @example
	    var Router = require('routr'),
	        router,
	        route;
	
	    var router = new Router({
	        view_user: {
	            path: '/user/:id',
	            method: 'get',
	            foo: {
	                bar: 'baz'
	            }
	        }
	    });
	
	    route = router.getRoute('/user/garfield');
	    if (route) {
	        // this will output:
	        //   - "view_user" for route.name
	        //   - {id: "garfield"} for route.params
	        //   - {path: "/user/:id", method: "get", foo: { bar: "baz"}} for route.config
	        console.log('[Route found]: name=', route.name, 'params=', route.params, 'config=', route.config);
	    }
	 */
	function Router(routes) {
	    var self = this;
	    self._routes = {};
	    debug('new Router, routes = ', routes);
	    if (routes) {
	        Object.keys(routes).forEach(function createRoute(name) {
	            self._routes[name] = new Route(name, routes[name]);
	        });
	    }
	    if (process.env.NODE_ENV !== 'production') {
	        if ('function' === typeof Object.freeze) {
	            Object.keys(self._routes).forEach(function freezeRoute(name) {
	                var route = self._routes[name];
	                Object.freeze(route.config);
	                Object.freeze(route.keys);
	                Object.freeze(route);
	            });
	            Object.freeze(self._routes);
	        }
	    }
	}
	
	/**
	 * @method getRoute
	 * @param {String} path   The url path to be used for route matching.  Query strings are **not** considered
	 *                        when performing the match.  E.g. /some_path?foo=bar would match to the same route
	 *                        as /some_path
	 * @param {Object} [options]
	 * @param {String} [options.method=get] The case-insensitive HTTP method string.
	 * @param {Object} [options.navigate] The navigation info.
	 * @param {Object} [options.navigate.type] The navigation type: 'pageload', 'click', 'popstate'.
	 * @param {Object} [options.navigate.params] The navigation params (that are not part of the path).
	 * @return {Object|null} The matched route info if path/method/navigate.params matches to a route; null otherwise.
	 */
	Router.prototype.getRoute = function (path, options) {
	    var self = this,
	        keys = Object.keys(self._routes),
	        i,
	        len = keys.length,
	        route,
	        match;
	
	    for (i = 0; i < len; i++) {
	        route = self._routes[keys[i]];
	        match = route.match(path, options);
	        if (match) {
	            return {
	                name: keys[i],
	                path: path,
	                params: match,
	                config: route.config,
	                navigate: options && options.navigate
	            };
	        }
	    }
	    return null;
	};
	
	/**
	 * Generates a path string with the route with the given name, using the specified params.
	 * @method makePath
	 * @param {String} name  The route name
	 * @param {Object} params  The route parameters to be used to create the path string
	 * @return {String} The generated path string, null if there is no route with the given name.
	 */
	Router.prototype.makePath = function (name, params) {
	    return (name && this._routes[name] && this._routes[name].makePath(params)) || null;
	};
	
	module.exports = Router;
	/* WEBPACK VAR INJECTION */}.call(exports, __triton_require__(24)))

/***/ },
/* 31 */
/***/ function(module, exports, __triton_require__) {

	/**
	 * Expose `pathtoRegexp`.
	 */
	module.exports = pathtoRegexp;
	
	/**
	 * The main path matching regexp utility.
	 *
	 * @type {RegExp}
	 */
	var PATH_REGEXP = new RegExp([
	  // Match already escaped characters that would otherwise incorrectly appear
	  // in future matches. This allows the user to escape special characters that
	  // shouldn't be transformed.
	  '(\\\\.)',
	  // Match Express-style parameters and un-named parameters with a prefix
	  // and optional suffixes. Matches appear as:
	  //
	  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
	  // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
	  '([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?',
	  // Match regexp special characters that should always be escaped.
	  '([.+*?=^!:${}()[\\]|\\/])'
	].join('|'), 'g');
	
	/**
	 * Escape the capturing group by escaping special characters and meaning.
	 *
	 * @param  {String} group
	 * @return {String}
	 */
	function escapeGroup (group) {
	  return group.replace(/([=!:$\/()])/g, '\\$1');
	}
	
	/**
	 * Attach the keys as a property of the regexp.
	 *
	 * @param  {RegExp} re
	 * @param  {Array}  keys
	 * @return {RegExp}
	 */
	var attachKeys = function (re, keys) {
	  re.keys = keys;
	
	  return re;
	};
	
	/**
	 * Normalize the given path string, returning a regular expression.
	 *
	 * An empty array should be passed in, which will contain the placeholder key
	 * names. For example `/user/:id` will then contain `["id"]`.
	 *
	 * @param  {(String|RegExp|Array)} path
	 * @param  {Array}                 keys
	 * @param  {Object}                options
	 * @return {RegExp}
	 */
	function pathtoRegexp (path, keys, options) {
	  if (keys && !Array.isArray(keys)) {
	    options = keys;
	    keys = null;
	  }
	
	  keys = keys || [];
	  options = options || {};
	
	  var strict = options.strict;
	  var end = options.end !== false;
	  var flags = options.sensitive ? '' : 'i';
	  var index = 0;
	
	  if (path instanceof RegExp) {
	    // Match all capturing groups of a regexp.
	    var groups = path.source.match(/\((?!\?)/g) || [];
	
	    // Map all the matches to their numeric keys and push into the keys.
	    keys.push.apply(keys, groups.map(function (match, index) {
	      return {
	        name:      index,
	        delimiter: null,
	        optional:  false,
	        repeat:    false
	      };
	    }));
	
	    // Return the source back to the user.
	    return attachKeys(path, keys);
	  }
	
	  if (Array.isArray(path)) {
	    // Map array parts into regexps and return their source. We also pass
	    // the same keys and options instance into every generation to get
	    // consistent matching groups before we join the sources together.
	    path = path.map(function (value) {
	      return pathtoRegexp(value, keys, options).source;
	    });
	
	    // Generate a new regexp instance by joining all the parts together.
	    return attachKeys(new RegExp('(?:' + path.join('|') + ')', flags), keys);
	  }
	
	  // Alter the path string into a usable regexp.
	  path = path.replace(PATH_REGEXP, function (match, escaped, prefix, key, capture, group, suffix, escape) {
	    // Avoiding re-escaping escaped characters.
	    if (escaped) {
	      return escaped;
	    }
	
	    // Escape regexp special characters.
	    if (escape) {
	      return '\\' + escape;
	    }
	
	    var repeat   = suffix === '+' || suffix === '*';
	    var optional = suffix === '?' || suffix === '*';
	
	    keys.push({
	      name:      key || index++,
	      delimiter: prefix || '/',
	      optional:  optional,
	      repeat:    repeat
	    });
	
	    // Escape the prefix character.
	    prefix = prefix ? '\\' + prefix : '';
	
	    // Match using the custom capturing group, or fallback to capturing
	    // everything up to the next slash (or next period if the param was
	    // prefixed with a period).
	    capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');
	
	    // Allow parameters to be repeated more than once.
	    if (repeat) {
	      capture = capture + '(?:' + prefix + capture + ')*';
	    }
	
	    // Allow a parameter to be optional.
	    if (optional) {
	      return '(?:' + prefix + '(' + capture + '))?';
	    }
	
	    // Basic parameter support.
	    return prefix + '(' + capture + ')';
	  });
	
	  // Check whether the path ends in a slash as it alters some match behaviour.
	  var endsWithSlash = path[path.length - 1] === '/';
	
	  // In non-strict mode we allow an optional trailing slash in the match. If
	  // the path to match already ended with a slash, we need to remove it for
	  // consistency. The slash is only valid at the very end of a path match, not
	  // anywhere in the middle. This is important for non-ending mode, otherwise
	  // "/test/" will match "/test//route".
	  if (!strict) {
	    path = (endsWithSlash ? path.slice(0, -2) : path) + '(?:\\/(?=$))?';
	  }
	
	  // In non-ending mode, we need prompt the capturing groups to match as much
	  // as possible by using a positive lookahead for the end or next path segment.
	  if (!end) {
	    path += strict && endsWithSlash ? '' : '(?=\\/|$)';
	  }
	
	  return attachKeys(new RegExp('^' + path + (end ? '$' : ''), flags), keys);
	};


/***/ },
/* 32 */
/***/ function(module, exports, __triton_require__) {

	/*───────────────────────────────────────────────────────────────────────────*\
	 │  Copyright (C) 2014 eBay Software Foundation                               │
	 │                                                                            │
	 │  Licensed under the Apache License, Version 2.0 (the "License");           │
	 │  you may not use this file except in compliance with the License.          │
	 │  You may obtain a copy of the License at                                   │
	 │                                                                            │
	 │    http://www.apache.org/licenses/LICENSE-2.0                              │
	 │                                                                            │
	 │  Unless required by applicable law or agreed to in writing, software       │
	 │  distributed under the License is distributed on an "AS IS" BASIS,         │
	 │  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
	 │  See the License for the specific language governing permissions and       │
	 │  limitations under the License.                                            │
	 \*───────────────────────────────────────────────────────────────────────────*/
	 // RegExp patterns used from: https://github.com/component/path-to-regexp (MIT)
	'use strict';
	
	var path2regex = __triton_require__(33);
	
	
	module.exports = function reverend(route, obj) {
	    var keys, path, routeRegex;
	
	    // Support `route` being an array (which path-to-regexp supports), and
	    // prefer the first item because we want the best-fit URL.
	    if (Array.isArray(route)) {
	        route = route[0];
	    }
	
	    // Restrict `route` to Strings since a RegExp route can't be used to
	    // generate a path (path-to-regexp supports RegExp route paths).
	    if (typeof route !== 'string') {
	        throw new TypeError('route must be a String path');
	    }
	
	    keys = [];
	    path = route;
	    routeRegex = path2regex(route, keys);
	
	    keys.forEach(function (key) {
	        var value, regex;
	
	        value = obj[key.name];
	
	        // Enforce required keys having a value.
	        if (!key.optional && value === undefined) {
	            throw new RangeError('A value must be provided for: ' + key.name);
	        }
	
	        // Pattern used in both unnamed (e.g., "/posts/(.*)") and custom match
	        // parameters (e.g., "/posts/:id(\\d+)").
	        regex = '\\(((?:\\\\.|[^)])*)\\)';
	
	        // A key's `name` will be a String for named parameters, and a Number
	        // for unnamed parameters. This prefixes the base regexp pattern with
	        // the name, and makes the custom-matching part optional (which follows
	        // what path-to-regexp does.)
	        if (typeof key.name === 'string') {
	            regex = '\\:' + key.name + '(?:' + regex + ')?';
	        }
	
	        // Append suffix pattern.
	        regex += '([+*?])?';
	
	        if (key.optional && value === undefined) {
	            // No value so remove potential trailing '/'
	            // since the path segment is optional.
	            value = '';
	            regex += '\\/?';
	        }
	
	        value = encodeURIComponent(value);
	        path = path.replace(new RegExp(regex), value);
	    });
	
	
	    // Make sure the `path` produced will actually be matched by the `route`.
	    if (!routeRegex.test(path)) {
	        throw new RangeError('"' + path + '" will not match: "' + route + '"');
	    }
	
	    return path;
	};


/***/ },
/* 33 */
31
/******/ ])))
//# sourceMappingURL=triton-client.js.map
