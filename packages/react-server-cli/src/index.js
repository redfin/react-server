require.extensions['.css'] =
require.extensions['.less'] =
function(module, filename) {
	return module._compile("", filename);
};

module.exports = {
	start: require("./startServer").default,
};
