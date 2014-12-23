
/**
 * Perform a C-style "preprocessor" replace of __DEFAULT_ACTION_FUNCTION__
 * with a function that will trigger data loading via Component.loadData
 * if available, and in addition will perform lazy-loading of the component
 * file client-side, if it isn't already loaded.
 */

var REPLACE_REGEXP = /__LAZY_REQUIRE__\(['"]([^)]+)['"]\)/g;
var fs = require('fs');
var hydratedRouteFunctionTemplate = require("./HydratedRouteFunctionTemplate.bars");

module.exports = function (source) {
	this.cacheable && this.cacheable();
	source = source.replace(REPLACE_REGEXP, doReplace);

	return source;
}

function doReplace(match /* whole match */, fileName) {	
	// we replace /*fileName*/ with the actual string containing the filename. 
	return hydratedRouteFunctionTemplate({fileName:fileName});
}

