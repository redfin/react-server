const fs = require('fs');

require.extensions['.css'] =
require.extensions['.less'] =
function(module, filename) {
	return module._compile("", filename);
};

require.extensions['.html'] =
require.extensions['.md'] =
	function(module, filename) {
		const text = fs.readFileSync(filename, { encoding: 'utf-8' });
		return module._compile("module.exports = " + JSON.stringify(text), filename);
	};

module.exports = {
	start: require("./startServer").default,
	parseCliArgs: require("./parseCliArgs").default,
};
