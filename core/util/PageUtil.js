var Q = require("q"), 
	logger = require("../logging").getLogger(__LOGGER__),
	RLS = require("./RequestLocalStorage").getNamespace(),
	PromiseUtil = require("./PromiseUtil");

// This data structure defines the page interface.
//
// Each item represents a method that page objects (and middleware) may override.
//
// The keys here are method names.
//
// The values are tuples containing:
//   - Number of arguments to the method.
//   - Default implementation of the method.
//   - Normalization function applied to method output.
//
// Note that each of these methods also receives an additional argument,
// which is the next implementation of the method in the call chain.
//     - Middleware implementations _should_ call this in most cases.*
//     - Page implementations _may_ call this (it will be the default implementation).
//
// * Consider carefully before deciding not to call `next()` in middleware.
// Other middleware (and the page itself) may exhibit undefined behavior if a
// given method is not called.  Generally, only skip calling `next()` for
// short-circuit responses (e.g. a redirect from `handleRoute`).
//
var PAGE_METHODS = {
	handleRoute        : [1, () => ({code: 200}), Q],
	getTitle           : [0, () => "", Q],
	getScripts         : [0, () => [], standardizeScripts],
	getSystemScripts   : [0, () => [], standardizeScripts],
	getHeadStylesheets : [0, () => [], standardizeStyles],
	getMetaTags        : [0, () => [], standardizeMetaTags],
	getLinkTags        : [0, () => [], standardizeLinkTags],
	getBase            : [0, () => null, Q],
	getBodyClasses     : [0, () => [], Q],
	getElements        : [0, () => [], standardizeElements],
	getResponseData    : [0, () => "", Q],
};

// These are similar to `PAGE_METHODS`, but are not chained.
//
// Each page and middleware that implements a page hook will have its hook
// called in turn.  Hooks do not receive a `next()` method, and are not
// responsible for merging return values.
//
// Keys here are method names.
//
// The values are empty placeholder tuples.

var PAGE_HOOKS = {
	addConfig      : [],
	getConfig      : [],
	handleComplete : [],
};

// These methods will be made available on your page/middleware object.
//
// A method of the same name defined directly on your class will generate a warning.
//
var PAGE_MIXIN = {
	getRequest: makeGetter('request'),
	setRequest: makeSetter('request'),
}

function makeGetter(key){
	return () => (RLS()._PageUtilMixin||{})[key];
}

function makeSetter(key){
	return val => {
		(RLS()._PageUtilMixin||(RLS()._PageUtilMixin={}))[key] = val;
	}
}

function lazyMixinPageUtilMethods(page){
	var proto = Object.getPrototypeOf(page);
	if (proto._haveMixedInPageUtilMethods) return;

	proto._haveMixedInPageUtilMethods = true;

	Object.keys(PAGE_MIXIN).forEach(method => {
		if (proto[method]){
			logger.error(`PAGE_MIXINS method override: ${
				(proto.constructor||{}).name
			}.${method}`);
		}
		proto[method] = PAGE_MIXIN[method];
	});
}

// These `standardize*` functions show what will happen to the output of your
// page methods.
//
// For middleware authors: Be aware that these standardization functions will
// have been applied to the output of `next()` before you get access to it.
//
// These functions are also exposed via `PageUtil.standardize*`.

/**
 * This method takes in anything returned from a Page.getElements call and
 * returns the elements in a standardized format: an array of EarlyPromises of
 * ReactElements.
 */
function standardizeElements(elements) {

	// The return value could be a single element or an array.
	// First, let's make sure that it's an array.
	// Then, ensure that all elements are EarlyPromises.
	return PageUtil
		.makeArray(elements)
		.map(element => PromiseUtil.early(Q(element)));
}

function standardizeMetaTags(metaTags) {
	return PageUtil.makeArray(metaTags).map(metaTag => Q(metaTag));
}

function standardizeLinkTags(linkTags) {
	return PageUtil.makeArray(linkTags).map(linkTag => Q(linkTag));
}

function standardizeScripts(scripts) {
	return PageUtil.makeArray(scripts).map((script) => {
		if (script.href || script.text) {
			if (!script.type) script.type = "text/javascript";
			return script;
		}

		// if the answer was a string, let's make a script object
		return {href:script, type:"text/javascript"};
	})
}

function standardizeStyles(styles) {
	return PageUtil.makeArray(styles).map((style) => {
		if (style.href || style.text) {
			if (!style.type) style.type = "text/css";
			if (!style.media) style.media = "";

			return style;
		}

		// if the answer was a string, let's make a script object
		return {href:style, type:"text/css", media:""};
	})
}

var PageConfig = (function(){
	var logger = require("../logging").getLogger(__LOGGER__({label: 'PageConfig'}));

	// This gets bound to the outer `PageConfig`.
	//
	// Only `PageConfig.get(key)` is generally useful.
	//
	var PageConfig = {

		get(key) {

			// No access until all `Page.addConfig()` and
			// `Page.getConfig()` methods are complete.
			if (!RLS.PageConfigFinalized){
				throw new Error(`Premature access: "${key}"`);
			}

			// The key _must_ exist.
			if (!_obj().hasOwnProperty(key)){
				throw new Error(`Invalid key: "${key}"`);
			}

			return _obj()[key];
		},


		// Don't call this.  It's called for you.
		initFromPageWithDefaults(page, defaults) {

			// First set all defaults.  Then set all values.
			_setDefaults(defaults);
			page.addConfig().forEach(_setDefaults);
			page.getConfig().forEach(_setValues);

			logger.debug('Final', _obj());

			RLS.PageConfigFinalized = true;
		},
	}

	// Below here are helpers. They are hidden from outside callers.

	var _set = function(isDefault, obj) {

		// Get the current mutable config.
		var config = _obj();

		// Copy input values into it.
		Object.keys(obj||{}).forEach(key => {
			var keyExists = config.hasOwnProperty(key);
			if (isDefault && keyExists){
				// Can't make this fatal, because request
				// forwarding uses a dirty RLS() context.
				logger.warning(`Duplicate PageConfig default: "${key}"`);
			} else if (!isDefault && !keyExists) {
				throw new Error(`Missing PageConfig default: "${key}"`);
			}

			logger.debug(`${isDefault?"Default":"Set"} "${key}" => "${obj[key]}"`);

			config[key] = obj[key];
		});
	};

	var _setDefaults = _set.bind({}, true);
	var _setValues   = _set.bind({}, false);

	var _obj = function(){

		// Return the current mutable config.
		return RLS().PageConfig || (RLS().PageConfig = {});
	}

	return PageConfig;
})();

var logInvocation = function(name, func){
	return function(){
		logger.debug(`Call ${name}`);
		return func.apply(this, [].slice.call(arguments));
	}
}

var PageUtil = module.exports = {
	PAGE_METHODS,

	standardizeElements,
	standardizeMetaTags,
	standardizeScripts,
	standardizeStyles,

	PageConfig,

	/**
	 * Given an array of page instances, return an object that implements the page interface. This returned object's
	 * methods delegate to the first page in the pages array, passing the second page's implementation as the next
	 * variable (and the second page's implementation gets the third page's next, and so on). 
	 */
	createPageChain(pages) {

		// This will be our return value.  It will be a mapping of
		// method names on page objects to chained function calls.
		var pageChain = {};

		pages.forEach(lazyMixinPageUtilMethods);

		Object.keys(PAGE_MIXIN).forEach(method => {
			pageChain[method] = logInvocation(method, PAGE_MIXIN[method]);
		});

		for (var method in PAGE_METHODS){

			if (PAGE_METHODS.hasOwnProperty(method)){

				var [
					argumentCount,
					defaultImpl,
					standardizeReturnValue
				] = PAGE_METHODS[method];

				pageChain[method] = logInvocation(method,
					PageUtil.createObjectFunctionChain(
						pages,
						method,
						argumentCount,
						defaultImpl,
						standardizeReturnValue
					)
				);
			}
		}

		Object.keys(PAGE_HOOKS).forEach(method => {

			// Grab a list of pages that implement this method.
			var implementors = pages.filter(page => page[method]);

			// The resulting method calls each implementor's method
			// in turn and returns an array containg in their
			// return values.
			pageChain[method] = logInvocation(method, function(){
				var args = [].slice.call(arguments);
				return implementors.map(
					page => page[method].apply(page, args)
				)
			});
		});

		return pageChain;
	},

	/**
	 * Given an array of objects and a function name, this returns a function that will call functionName on the first
	 * object, adding a next parameter to the end that is a function to call to the next object's implementation of functionName, and so on
	 * down the line. It is a way to make a middleware-like chain of functions, but the functions will be bound to the object in 
	 * question from objects.
	 * 
	 * The last object in the array will also receive a next parameter, which will call defaultImpl.
	 * 
	 * standardizeReturnValue will be called on every return value from functionName so that next will always return the same type. This
	 * is useful when a function can return one of many different types.
	 */
	createObjectFunctionChain(objects, functionName, argumentCount, defaultImpl, standardizeReturnValue) {
		// our first order of business is to get an array of pure functions to chain; this involves finding
		// which objects have implementations for functionName, binding those implementations to the object
		// in question, and standardizing the return values.
		var functionsToChain = [];
		objects.forEach((object) => {
			if (object[functionName]) {
				functionsToChain.push(function() { 
					return standardizeReturnValue(object[functionName].apply(object, arguments));
				});
			}
		});
		// the innermost implementation calls the default implementation and standardizes the result.
		functionsToChain.push(function() { 
			return standardizeReturnValue(defaultImpl.apply(null, arguments));
		});

		// now we have an array of pure functions to chain.
		return PageUtil.createFunctionChain(functionsToChain, argumentCount);
	},

	createFunctionChain(functions, argumentCount) {
		if (functions.length === 0 ) {
			throw new Error("createFunctionChain cannot be called with zero-length array.");
		}

		// we start from the innermost implementation (i.e. the last in the array) and move outward. nextImpl holds 
		// the function that will be used as the next argument for the function before it in the array.
		var nextImpl = functions[functions.length - 1];
		// now let's chain together the other implementations.
		for (var i = functions.length - 2; i >= 0; i--) {
			// 
			nextImpl = PageUtil._addArgumentToFunction(functions[i], nextImpl, argumentCount);
		}
		return nextImpl;
	},

	// takes in a function fn and returns a function that calls fn with argument bound at the end of the argument list.
	_addArgumentToFunction(fn, argument, argumentCount) {
		if (argumentCount > 6) {
			throw new Error("_addArgumentToFunction only supports methods with up to 6 arguments");
		}
		return function(a, b, c, d, e, f) {
			var args = [a, b, c, d, e, f];
			args = args.slice(0, argumentCount);
			args.push(argument);
			return fn.apply(null, args);
		}
	},

	makeArray(valueOrArray) {
		if (!Array.isArray(valueOrArray)) {
			return [valueOrArray];
		}
		return valueOrArray;
	}
}