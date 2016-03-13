
/**
 * Perform a C-style "preprocessor" replace of __LAZY_REQUIRE__
 * with a function that returns a promise that is resolved when
 * the file reference by LAZY_REQUIRED is loaded. Allows code-splitting
 * for the browser for webpack users.
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
		if (process.env.IS_SERVER) {
			var component = require("${fileName}"); 
			dfd.resolve(component);
		} else {
			require.ensure([], function (require) {
				var component = require("${fileName}"); 
				dfd.resolve(component);
			});
		}
		return dfd.promise;
	}`.replace(/\s*\n\s*/g, '');
}


