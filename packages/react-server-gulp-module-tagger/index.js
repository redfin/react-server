var replace = require("gulp-replace")
,   forEach = require("gulp-foreach")
,   loggerSpec = require("react-server-module-tagger")

// This pattern matches either of these:
//   - "__LOGGER__"
//   - "__LOGGER__({ /* options */ })"
var isWindows = ('win32' === process.platform)
,   DEFAULT_REPLACE_TOKEN = tokenToRegExp("__LOGGER__|__CHANNEL__|__CACHE__")
,   THIS_MODULE   = isWindows
	? /(?:[^\\]+\\node_modules\\)?react-server-gulp-module-tagger\\index\.js$/
	: /(?:[^\/]+\/node_modules\/)?react-server-gulp-module-tagger\/index\.js$/

module.exports = function(config) {
	config || (config = {});
	var REPLACE_TOKEN;
	if (config.token) {
		REPLACE_TOKEN = tokenToRegExp(config.token);
	} else {
		REPLACE_TOKEN = DEFAULT_REPLACE_TOKEN;
	}
	config.basePath = module.filename.replace(THIS_MODULE,'');
	return forEach(function(stream, file){
		return stream.pipe(replace(REPLACE_TOKEN, (match, optString) => {
			const opts = optString ? {label: optString.replace(/.+label:\s?["|'](\w+)["|'].+/, "$1")} : undefined;
			return loggerSpec({
				filePath: file.path,
				basePath: config.basePath,
				trim: config.trim,
				prefix: config.prefix,
				opts,
			});
		}));
	});
}

function tokenToRegExp(token) {
	return new RegExp("(?:" + token + ")(?:\\(\\s*(\\{[\\s\\S]*?\\})\\s*\\))?", 'g');
}
