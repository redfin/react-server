var replace = require("gulp-replace"),
	forEach = require("gulp-foreach");

// returns a gulp-compatible stream processor that replaces our __LOGGER__ tokens.
function gulpLogging() {
	return forEach(function(stream, file){
			return stream
				.pipe(replace(/__LOGGER__(?:\(\s*(\{[\s\S]*?\})\s*\))?/g, function (match, optionString) {
					optionString = optionString || "";
					// The slash replacement here is so we don't choke on example
					// loggers in comments. We can't just use eval because the first line of the match generally
					// does not have a // before it, so it's not valid JS.
					optionString = optionString.replace(/^\/\//mg,'');

					// optionString now represents an expression that should be run to make an options object.
					var options = optionString ? new Function("return "+optionString)() : {};

					// we use dots instead of slashes because statsd likes dots as separators. we also attempt to 
					// strip the last segment, assuming it's a file extension.
					if (!options.name) options.name = "triton." + file.relative.replace("/", ".").replace(/\.[^\.]*$/, "") + (options.label ? "." + options.label : "");

					return JSON.stringify(options);
			}));
		})
}

module.exports = gulpLogging;