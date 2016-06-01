require.extensions['.css'] = function(module, filename) {
	return module._compile("", filename);
};

module.exports = {
	start: require("./startServer").default,
};
