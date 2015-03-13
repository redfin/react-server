var replace = require("gulp-replace")
,   forEach = require("gulp-foreach")

// This pattern matches either of these:
//   - "__LOGGER__"
//   - "__LOGGER__({ /* options */ })"
var isWindows = ('win32' === process.platform)
,   REPLACE_TOKEN = /(?:__LOGGER__|__CHANNEL__)(?:\(\s*(\{[\s\S]*?\})\s*\))?/g
,   THIS_MODULE   = isWindows
						? /(?:[^\\]+\\node_modules\\)?triton\\buildutils\\logger-loader\.js$/
						: /(?:[^\/]+\/node_modules\/)?triton\/buildutils\/logger-loader\.js$/
,   BASE_PATH     = module.filename.replace(THIS_MODULE,'')

module.exports = function(){
	return forEach(function(stream, file){
		return stream.pipe(replace(REPLACE_TOKEN, loggerSpec.bind(file)));
	})
}

var loggerSpec = function(fullMatch, optString){
	var fn   = this.path
	,   opts = {}

	if (fn.indexOf(BASE_PATH) != 0)
		throw("Unable to handle "+REPLACE_TOKEN+" for "+fn);

	if (optString)
		// The slash replacement here is so we don't choke on example
		// loggers in comments.
		opts = new Function("return "+optString.replace(/^\/\//mg,''))();

	opts.name  = getName  (fn, opts);
	opts.color = getColor (fn, opts);

	return JSON.stringify(opts);
}

var getName = function(fn, opts){
	var slashPattern = isWindows
		?/\\/g
		:/\//g
	var name = fn.substring(BASE_PATH.length, fn.length)
		.replace(/\.jsx?$/, '')
		.replace(slashPattern,'.')
	if (opts.label)
		name += '.'+opts.label
	return name;
}

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
	for (var r = 1; r < 6; r+=2)
		for (var g = 1; g < 6; g+=2)
			for (var b = 1; b < 6; b+=2)
				if (r != g || g != b) // No gray.
					colors.push(makeColor(r,g,b));

	// Just want a fairly well distributed deterministic mapping.
	//
	// Adapted from:
	// http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
	var hash = function(str){
		var hash = 0, i, chr, len;
		if (str.length == 0) return hash;
		for (i = 0, len = str.length; i < len; i++) {
			chr   = str.charCodeAt(i);
			hash  = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}

		len = colors.length;

		// Positive mod.
		return (hash%len+len)%len;
	}

	return function(fn){
		return colors[hash(fn)];
	}
})();
