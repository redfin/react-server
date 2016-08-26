const fs = require('fs');
const run = require("./run").default;
const parseCliArgs = require("./parseCliArgs").default;

require.extensions['.css'] =
require.extensions['.less'] =
require.extensions['.scss'] =
require.extensions['.sass'] =
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
	parseCliArgs,
	run,
	defaultOptions,
};
