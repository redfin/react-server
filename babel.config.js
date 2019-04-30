module.exports = function (api) {
	api.cache(true);

	const presets = [
		'react-server'
	];

	return {
		presets,
	};
}
