
var ecmaScriptTransforms = [
	"es6.arrowFunctions",
	"es6.blockScoping",
	"es6.classes",
	"es6.constants",
	"es6.destructuring",
	// "es6.forOf",
	"es6.modules",
	"es6.parameters",
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
	stage:1,
	whitelist:ecmaScriptTransforms,
	modules: "common",
}
