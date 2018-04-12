
var JS_BUNDLE_SUFFIX = ".bundle.js";
var CSS_ROLLUP_SUFFIX = ".styles.css";

function getEntryPointNameFromRouteName(routeName) {
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
	},

}
