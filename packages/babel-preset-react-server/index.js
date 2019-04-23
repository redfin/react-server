module.exports = function () {
	return {
		presets: [
			require('@babel/preset-env'),
			require('@babel/preset-react'),
		],
		plugins: [
			require('babel-plugin-react-server'),
			require('@babel/plugin-proposal-function-bind'),
			require('@babel/plugin-transform-runtime'),
		],
	};
};
