module.exports = function (api) {
	api.cache(true);

	const presets = [
		"react-server",
	];
	const plugins = [
		"react-require",
	];

	return {
		presets,
		plugins,
	};
};
