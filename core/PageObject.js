
class PageObject {

	constructor () {
	}

	getTitle () {
		warnDefaultImplementation(this, "getTitle");
		return "";
	}

	getHeadScriptFiles () {
		return [];
	}

	// singular, for now
	getHeadStylesheets () {
		return "";
	}

	getCanonicalUrl () {
		return "";
	}

	getMetaTags () {
		return [];
	}

}

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
class MetaTag {

	constructor (name, content, extraOpts) {
		this._name = name;
		this._content = content;
		this._extraOpts = extraOpts || {};
	}

	toString () {
		// TODO: escaping
		var tag = '<meta name="' + this._name + '" content="' + this._content + '"';
		Object.keys(this._extraOpts, (key) => {
			tag += ' ' + key + '="' + this._extraOpts[key] + '"';
		});
		tag += '>';
	}

}

function warnDefaultImplementation (instance, functionName) {
	if (process.env.NODE_ENV !== "production") {
		var debug = require('debug')('rf:PageObject');
		debug("WARNING: PageObject implementor doesn't override " + functionName, instance);
	}
}

module.exports = PageObject;
module.exports.MetaTag = MetaTag;