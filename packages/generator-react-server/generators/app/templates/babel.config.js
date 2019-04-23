module.exports = function (api) {
	api.cache(true);

	const presets = [
		"react-server",
	];
	const plugins = [
	];

	return {
		presets,
		plugins,
	};
};
