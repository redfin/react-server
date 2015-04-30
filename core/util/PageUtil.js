var Q = require("q"), 
	logger = require("../logging").getLogger(__LOGGER__),
	RLS = require("./RequestLocalStorage").getNamespace(),
	PromiseUtil = require("./PromiseUtil");


// There are three data structures defined here that are relevant for page and
// middleware authors:
//
//   - PAGE_MIXIN   : Methods that will be automatically defined on your class.
//   - PAGE_METHODS : Chained methods that may be overridden in your class.
//   - PAGE_HOOKS   : Non-chained methods that may be defined in your class.
//
// These three data structure define the page interface.



// These methods will be available on your page/middleware object.
//
// Accidental definition of a method with a conflicting name directly on your
// class will generate an error.
//
var PAGE_MIXIN = {
	getExpressResponse : makeGetter('expressResponse'), // Only available with `isRawResponse`.
	getRequest         : makeGetter('request'),
	getConfig          : key => PageConfig.get(key),
};

// Each item here represents a method that page/middleware objects may override.
//
// The keys here are method names.
//
// The values are tuples containing:
//   - Default implementation of the method.
//   - Normalization function applied to method output.
//
// Note that each of these methods receives an argument, which is the next
// implementation of the method in the call chain.
//     - Middleware implementations _should_ call this in most cases.*
//     - Page implementations _may_ call this (it will be the default implementation).
//
// * Consider carefully before deciding not to call `next()` in middleware.
// Other middleware (and the page itself) may exhibit undefined behavior if a
// given method is not called.  Generally, only skip calling `next()` for
// short-circuit responses (e.g. a redirect from `handleRoute`).
//
var PAGE_METHODS = {
	handleRoute        : [() => ({code: 200}), Q],
	getTitle           : [() => "", Q],
	getScripts         : [() => [], standardizeScripts],
	getSystemScripts   : [() => [], standardizeScripts],
	getHeadStylesheets : [() => [], standardizeStyles],
	getMetaTags        : [() => [], standardizeMetaTags],
	getLinkTags        : [() => [], standardizeLinkTags],
	getBase            : [() => null, Q],
	getBodyClasses     : [() => [], Q],
	getElements        : [() => [], standardizeElements],
	getResponseData    : [() => "", Q],
};

// These are similar to `PAGE_METHODS`, but differ as follows:
//
//   - They are not chained.
//   - They do not have default implementations.
//
// Each page and middleware that implements a page hook will have its hook
// called in turn.  Hooks do not receive a `next()` method, and are not
// responsible for merging return values.
//
// The keys here are method names.
//
// The values are empty placeholder tuples.
//
var PAGE_HOOKS = {
	addConfigValues : [], // Define new configuration values.
	setConfigValues : [], // Alter existing configuration values.
	handleComplete  : [], // Do stuff after the response has been sent.
};



// These methods are only defined on the page _chain_ which is used internally
// within triton.  Page/middleware authers can ignore this.
var PAGE_CHAIN_PROTOTYPE = {
	setExpressResponse : makeSetter('expressResponse'),
	setRequest         : makeSetter('request'),
};

// We log all method calls on the page chain for debugging purposes.
Object.keys(PAGE_CHAIN_PROTOTYPE).forEach(method => {
	PAGE_CHAIN_PROTOTYPE[method] = logInvocation(method, PAGE_CHAIN_PROTOTYPE[method]);
});

// These are helpers for `PAGE_MIXIN` and `PAGE_CHAIN_PROTOTYPE` methods.
//
// Note that getters and setters don't actually modify the page/middleware
// object directly, but rather stash values in request local storage.  Values
// are therefore shared between the page and all middleware.
//
function makeGetter(key){
	return () => (RLS().mixinValues||{})[key];
}

function makeSetter(key){
	return val => {
		(RLS().mixinValues||(RLS().mixinValues={}))[key] = val;
	}
}

// This attaches `PAGE_MIXIN` methods to page/middleware classes.
//
// It does this only _once_, and thereafter short-circuits.
//
function lazyMixinPageUtilMethods(page){
	var proto = Object.getPrototypeOf(page);
	if (proto._haveMixedInPageUtilMethods) return;

	proto._haveMixedInPageUtilMethods = true;

	Object.keys(PAGE_MIXIN).forEach(method => {
		if (proto[method]){
			throw new Error(`PAGE_MIXINS method override: ${
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

			// No access until all `Page.addConfigValues()` and
			// `Page.setConfigValues()` methods are complete.
			if (!RLS().pageConfigFinalized){
				throw new Error(`Premature access: "${key}"`);
			}

			// The key _must_ exist.
			if (!_getCurrentConfigObject().hasOwnProperty(key)){
				throw new Error(`Invalid key: "${key}"`);
			}

			return _getCurrentConfigObject()[key];
		},


		// Don't call this.  It's called for you.
		// The `page` here is a page chain.
		// It's called `page` in `Navigator` and `renderMiddleware`.
		initFromPageWithDefaults(page, defaults) {

			// First set the framework level defaults.
			_setDefaults(defaults);

			// Then let page/middleware define new config defaults,
			// and finally let page/middleware alter existing
			// config values.
			page.addConfigValues().forEach(_setDefaults);
			page.setConfigValues().forEach(_setValues);

			logger.debug('Final', _getCurrentConfigObject());

			RLS().pageConfigFinalized = true;
		},
	}

	// Below here are helpers. They are hidden from outside callers.

	var _set = function(isDefault, obj) {
		var config = _getCurrentConfigObject();

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

	var _getCurrentConfigObject = function(){

		// Return the current mutable config.
		return RLS().pageConfig || (RLS().pageConfig = {});
	}

	return PageConfig;
})();

// This is used to log method calls on the page _chain_.  Method calls on
// individual page/middleware objects are not automatically logged.
function logInvocation(name, func){
	return function(){
		logger.debug(`Call ${name}`);
		return func.apply(this, [].slice.call(arguments));
	}
}

// Return `fn` with a wrapper that puts its return value through `standardize`
// on the way out.
function makeStandard(standardize, fn){
	return function(){
		return standardize(fn.apply(null, [].slice.call(arguments)));
	}
}

var PageUtil = module.exports = {
	PAGE_METHODS,

	standardizeElements,
	standardizeMetaTags,
	standardizeScripts,
	standardizeStyles,

	PageConfig,

	// Given an array of page/middleware instances, return an object that
	// implements the interface defined by the union of:
	//
	//   - PAGE_CHAIN_PROTOTYPE
	//   - PAGE_METHODS
	//   - PAGE_HOOKS
	//
	createPageChain(pages) {

		// This will be our return value.
		//
		// This `Object.create()` call creates a new empty object
		// (`{}`) with `PAGE_CHAIN_PROTOTYPE` as its prototype.
		//
		var pageChain = Object.create(PAGE_CHAIN_PROTOTYPE);

		// Make sure all page classes have been augmented with the
		// methods provided by `PAGE_MIXIN`.
		pages.forEach(lazyMixinPageUtilMethods);

		// Wire up the chained methods.
		for (var method in PAGE_METHODS){

			if (!PAGE_METHODS.hasOwnProperty(method)) return;

			var [defaultImpl, standardize] = PAGE_METHODS[method];

			// Take bound methods for each page/middleware that
			// implements (plus the default implementation), and
			// chain them together so that each receives as an
			// argument the rest of the chain in the form of an
			// arity-zero function.
			pageChain[method] = logInvocation(method, pages
				.filter      (page => page[method])
				.map         (page => page[method].bind(page))
				.concat      ([defaultImpl])
				.map         (makeStandard.bind(null, standardize))
				.reduceRight ((next, cur) => cur.bind(null, next))
			);
		}

		// Wire up the un-chained methods.
		Object.keys(PAGE_HOOKS).forEach(method => {

			// Grab a list of pages that implement this method.
			var implementors = pages.filter(page => page[method]);

			// The resulting function calls each implementor's
			// method in turn and returns an array containing in
			// their return values.
			pageChain[method] = logInvocation(method, function(){

				// The `arguments` object isn't a real array.
				// Pre-es5 `Function.apply()` required a real
				// array.  This `[].slice.call(arguments)`
				// idiom creates a real array with the elements
				// of the `arguments` object.
				//
				// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
				//
				var args = [].slice.call(arguments);

				return implementors.map(
					page => page[method].apply(page, args)
				)
			});
		});

		return pageChain;
	},

	makeArray(valueOrArray) {
		if (!Array.isArray(valueOrArray)) {
			return [valueOrArray];
		}
		return valueOrArray;
	}
}