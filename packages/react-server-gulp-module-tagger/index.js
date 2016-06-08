var replace = require("gulp-replace")
,   forEach = require("gulp-foreach")
,   loggerSpec = require("react-server-module-tagger").default

// This pattern matches either of these:
//   - "__LOGGER__"
//   - "__LOGGER__({ /* options */ })"
var isWindows = ('win32' === process.platform)
,   REPLACE_TOKEN = /(?:__LOGGER__|__CHANNEL__|__CACHE__)(?:\(\s*(\{[\s\S]*?\})\s*\))?/g
,   THIS_MODULE   = isWindows
	? /(?:[^\\]+\\node_modules\\)?react-server-gulp-module-tagger\\index\.js$/
	: /(?:[^\/]+\/node_modules\/)?react-server-gulp-module-tagger\/index\.js$/

module.exports = function(config){
	config || (config = {});
	config.basePath = module.filename.replace(THIS_MODULE,'');
	return forEach(function(stream, file){
		return stream.pipe(replace(REPLACE_TOKEN, loggerSpec.bind({file, config})));
	})
}
