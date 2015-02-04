var es6to5 = require("gulp-6to5");

var ecmaScriptTransforms = [
	"es6.arrowFunctions",
	"es6.blockScoping",
	"es6.classes",
	// "es6.constants",
	"es6.destructuring",
	// "es6.forOf",
	// "es6.modules",
	"es6.parameters.default",
	"es6.parameters.rest",
	// "es6.properties.computed",
	"es6.properties.shorthand",
	"es6.spread",
	"es6.templateLiterals",
	// "es6.unicodeRegex", 
	"es7.objectRestSpread",
	// "es7.abstractReferences",
	// "es7.comprehensions",
	// "es7.exponentiationOperator",
	"react",
];

module.exports = {
	es6Transform: function() {
		return es6to5({experimental:true, whitelist:ecmaScriptTransforms});
	}
}