var isWindows = ('win32' === process.platform);

/**
 * Gets the name of a logger from its filepath.
 * @example
 *     getName(
 *         'my-component',
 *         { label: 'sub' },
 *         'my-project.src',
 *         'my-project/src/components/my-component.js'
 *     ) // returns "components.my-component"
 * @param  {String}   fn       filename
 * @param  {Object}   opts     { label: 'Optional logger label' }
 * @param  {String}   trim     The leading portion of the name to remove
 * @param  {String}   basePath The path to the file
 * @param  {String}   prefix   A prefix to prepend to the name
 * @return {String}            The logger name, e.g. my-project.components.my-component
 */
var getName = function(fn, opts, trim, basePath, prefix){
	var slashPattern = isWindows
		?/\\/g
		:/\//g
	var name = fn.substring(basePath.length+trim.length, fn.length)
		.replace(/\.jsx?$/, '')
		.replace(slashPattern,'.')
	if (opts.label) {
		name += '.'+opts.label
	}
	if (prefix) {
		name = prefix + name
	}
	return name;
}

/**
 * Gets isomorphic color objects from filenames.
 * @param  {String} filename
 * @return {Object} An isomorphic color object in the form {"color":{"server":147,"client":"rgb(127,127,212)"}}
 */
var getColor = (function(){

	// ANSI escape sequence on the server.
	// CSS rgb(...) color in the browser.
	var makeColor = function(r,g,b){
		return {
			server: 16 + r*36 + g*6 + b,
			client: "rgb("+[
				(r*42.5)|0,
				(g*42.5)|0,
				(b*42.5)|0,
			].join(',')+")",
		}
	}

	// This produces a list of 24 colors that are distant enough from each
	// other to be visually distinct.  It's also, conveniently, the same
	// palette client side and server side.
	var colors = [];
	for (var r = 1; r < 6; r+=2) {
		for (var g = 1; g < 6; g+=2) {
			for (var b = 1; b < 6; b+=2) {
				if (r !== g || g !== b) { // No gray.
					colors.push(makeColor(r,g,b));
				}
			}
		}
	}


	// Just want a fairly well distributed deterministic mapping.
	//
	// Adapted from:
	// http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
	var hash = function(str){
		var hash = 0, i, chr, len;
		if (!str || str.length === 0) return hash;
		for (i = 0, len = str.length; i < len; i++) {
			chr   = str.charCodeAt(i);
			hash  = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}

		len = colors.length;

		// Positive mod.
		return (hash%len+len)%len;
	}

	return function(opts){
		return colors[hash(opts.name)];
	}
})();


/**
 * A util function for tagging modules.
 * @example
 *     tagger({filePath: '/path/to/my/file.js', trim: 'path.to.', opts: {label: "foo"})
 *     // returns '{\"label\":\"foo\",\"name\":\"my.file\",\"color\":{\"server\":87,\"client\":\"rgb(42,212,212)\"}}'
 * @param  {String} filePath  The path to the file
 * @param  {String} opts      The options, including a label, to add to the module tag
 * @param  {String} trim      The prefix to remove from the logger name
 * @param  {String} basePath  The path to the root of the project
 * @param  {String} prefix    A prefix to prepend to the logger name
 * @return {String}           A json object containing a module identifier
 */
module.exports = function(arg){
	var opts = arg.opts || {}
		,   fn   = arg.filePath
		,   trim = arg.trim || ''
		,   basePath = arg.basePath || ''
		,   prefix = arg.prefix

	if (fn.indexOf(basePath) !== 0) {
		throw new Error("Unable to handle " + basePath + " for " + fn);
	}

	opts.name  = getName  (fn, opts, trim, basePath, prefix);
	opts.color = getColor (opts);

	return JSON.stringify(opts);
}
