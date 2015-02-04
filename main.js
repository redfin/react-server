
/**
 * Perform a C-style "preprocessor" replace of __DEFAULT_ACTION_FUNCTION__
 * with a function that will trigger data loading via Component.loadData
 * if available, and in addition will perform lazy-loading of the component
 * file client-side, if it isn't already loaded.
 */

var replace = require("gulp-replace");

var REPLACE_REGEXP = /__LAZY_REQUIRE__\(['"]([^)]+)['"]\)/g;
var fs = require('fs');

module.exports = function () {
	return replace(REPLACE_REGEXP, doReplace);
}

function doReplace(match /* whole match */, fileName) {	
	// we replace fileName with the actual string containing the filename. 
	return `
		function () {
		var Q = require('q');
		var dfd = Q.defer();
		if (SERVER_SIDE) {
			var component = require("${fileName}"); 
			dfd.resolve(component);
		} else {
			require.ensure([], function (require) {
				var component = require("${fileName}"); 
				dfd.resolve(component);
			});
		}
		return dfd.promise;
	}`;
}


