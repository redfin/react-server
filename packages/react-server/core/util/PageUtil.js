var Q = require("q"),
	React = require('react'),
	logger = require("../logging").getLogger(__LOGGER__),
	RLS = require("./RequestLocalStorage").getNamespace();

var {isRootContainer, flattenForRender} = require('../components/RootContainer');
var {ensureRootElement, scheduleRender} = require('../components/RootElement');
var {isTheFold, markTheFold} = require('../components/TheFold');


var PageConfig = (function(){
	var logger = require("../logging").getLogger(__LOGGER__({label: 'PageConfig'}));

	var _getCurrentConfigObject = function(){

		return RLS().pageConfig || (RLS().pageConfig = {});
	}

	var _set = function(isDefault, obj) {
		var config = _getCurrentConfigObject();

		Object.keys(obj||{}).forEach(key => {
			var keyExists = config.hasOwnProperty(key);
			if (isDefault && keyExists){
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

		var PageConfig = {

		get(key) {

			if (!RLS().pageConfigFinalized){
				throw new Error(`Premature access: "${key}"`);
			}
	if (!_getCurrentConfigObject().hasOwnProperty(key)){
				throw new Error(`Invalid key: "${key}"`);
			}

			return _getCurrentConfigObject()[key];
		},


		
		initFromPageWithDefaults(page, defaults) {

		
			_setDefaults(defaults);

			
			page.addConfigValues().forEach(_setDefaults);
			page.setConfigValues().forEach(_setValues);

			logger.debug('Final', _getCurrentConfigObject());

			RLS().pageConfigFinalized = true;
		},
	}

	return PageConfig;
})();



var PAGE_MIXIN = {
	getExpressRequest  : makeGetter('expressRequest'),  
	getExpressResponse : makeGetter('expressResponse'), 
	getRequest         : makeGetter('request'),
	getConfig          : key => PageConfig.get(key),
};


var PAGE_METHODS = {
	handleRoute        : [() => ({code: 200}), Q],
	getContentType     : [() => "text/html; charset=utf-8", _ => _],
	getHeaders         : [() => [], Q],
	getTitle           : [() => "", Q],
	getScripts         : [() => [], standardizeScripts],
	getSystemScripts   : [() => [], standardizeScripts],
	getBodyStartContent: [() => [], Q],
	getHeadStylesheets : [() => [], standardizeStyles],
	getDebugComments   : [() => [], standardizeDebugComments],
	getMetaTags        : [() => [], standardizeMetaTags],
	getLinkTags        : [() => [], standardizeLinkTags],
	getBase            : [() => null, Q],
	getBodyClasses     : [() => [], Q],
	getElements        : [() => [], standardizeElements],
	getResponseData    : [() => "", Q],
};


var PAGE_HOOKS = {
	addConfigValues : [], 
	setConfigValues : [], 
	handleComplete  : [], 
};



var PAGE_CHAIN_PROTOTYPE = {
	setExpressRequest  : makeSetter('expressRequest'),
	setExpressResponse : makeSetter('expressResponse'),
	setRequest         : makeSetter('request'),
	getRequest         : makeGetter('request'),

	
	getStatus          : makeGetter('status'),
	setStatus          : makeSetter('status'),
	getHasDocument     : makeGetter('hasDocument'),
	setHasDocument     : makeSetter('hasDocument'),
	getJsBelowTheFold  : makeGetter('jsBelowTheFold'),
	setJsBelowTheFold  : makeSetter('jsBelowTheFold'),
	getSplitJsLoad     : makeGetter('splitJsLoad'),
	setSplitJsLoad     : makeSetter('splitJsLoad'),
};

Object.keys(PAGE_CHAIN_PROTOTYPE).forEach(method => {
	PAGE_CHAIN_PROTOTYPE[method] = logInvocation(method, PAGE_CHAIN_PROTOTYPE[method]);
});


function makeGetter(key){
	return () => (RLS().mixinValues||{})[key];
}

function makeSetter(key){
	return val => {
		(RLS().mixinValues||(RLS().mixinValues={}))[key] = val;
	}
}


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


function standardizeElements(elements) {

	return makeArray(elements)
		.map(e => isRootContainer(e)?flattenForRender(e):e)
		.reduce((m, e) => m.concat(Array.isArray(e)?e:[e]), [])
		.map(e => isTheFold(e)?markTheFold():e)
		.map(ensureRootElement)
		.map(scheduleRender)
}

function standardizeDebugComments(debugComments) {
	return makeArray(debugComments);
}

function standardizeMetaTags(metaTags) {
	return makeArray(metaTags).map(metaTag => Q(metaTag));
}

function standardizeLinkTags(linkTags) {
	return makeArray(linkTags).map(linkTag => Q(linkTag));
}

function standardizeScripts(scripts) {
	return makeArray(scripts).map((script) => {
		if (!(script.href || script.text)) {
			script = { href:script }
		}

		if (!script.type) script.type = "text/javascript";

		if (!script.hasOwnProperty('strict')) script.strict = true;

		return script;
	})
}

function standardizeStyles(styles) {
	return makeArray(styles).map(styleOrP => {
		return Q(styleOrP).then(style => {
			if (!style) {
				return null;
			}
			if (style.href || style.text) {
				if (!style.type) style.type = "text/css";
				if (!style.media) style.media = "";

				return style;
			}

			return {href:style, type:"text/css", media:""};
		});
	})
}

function logInvocation(name, func){
	return function(){
		logger.debug(`Call ${name}`);
		return func.apply(this, [].slice.call(arguments));
	}
}

function makeStandard(standardize, fn){
	return function(){
		return standardize(fn.apply(null, [].slice.call(arguments)));
	}
}

function makeArray(valueOrArray) {
	if (!Array.isArray(valueOrArray)) {
		return [valueOrArray];
	}
	return valueOrArray;
}

var PageUtil = {
	PAGE_METHODS,

	standardizeElements,
	standardizeMetaTags,
	standardizeScripts,
	standardizeStyles,

	PageConfig,

	createPageChain(pages) {
		
		var pageChain = Object.create(PAGE_CHAIN_PROTOTYPE);

		pages.forEach(lazyMixinPageUtilMethods);

		for (var method in PAGE_METHODS){

			if (!PAGE_METHODS.hasOwnProperty(method)) continue;

			var [defaultImpl, standardize] = PAGE_METHODS[method];

			pageChain[method] = logInvocation(method, pages
				.filter      (page => page[method])
				.map         (page => page[method].bind(page))
				.concat      ([defaultImpl])
				.map         (makeStandard.bind(null, standardize))
				.reduceRight ((next, cur) => cur.bind(null, next))
			);
		}

		Object.keys(PAGE_HOOKS).forEach(method => {

			var implementors = pages.filter(page => page[method]);

			pageChain[method] = logInvocation(method, function(){

			
				var args = [].slice.call(arguments);

				return implementors.map(
					page => page[method].apply(page, args)
				)
			});
		});

		return pageChain;
		/* eslint-enable no-loop-func */
	},

	makeArray,

	getElementDisplayName(element){

		if (!(element && element.type && element.props)) return 'None';

		var name = element.type.displayName;

		if (!name) {

			if (React.Children.count(element.props.children) === 1){

				try {
					name = PageUtil.getElementDisplayName(
						React.Children.only(
							element.props.children
						)
					);
				} catch (e) { /* Pass. */ }
			}
		}

		return (name||'Unknown').split('.').pop();
	},

}

module.exports = PageUtil
