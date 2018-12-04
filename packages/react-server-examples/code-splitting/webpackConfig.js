import webpack from "webpack";

export default (webpackConfig) => {

	// Optional. This makes it so the child chunks receive a readable name versus
	// just the chunk id
	webpackConfig.output.chunkFilename = "[name]." + webpackConfig.output.chunkFilename;

	// This is to prevent webpack from running the code in these blocks
	// Needed because otherwise webpack will bundle in the async components
	// into the main page bundle
	webpackConfig.plugins.push(new webpack.DefinePlugin({
		"process.env.IS_SERVER": 'false',
	}));

	return webpackConfig;
};
