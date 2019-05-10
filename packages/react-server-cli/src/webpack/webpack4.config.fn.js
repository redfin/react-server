import ExtractCssChunksPlugin from "extract-css-chunks-webpack-plugin";
import OptimizeCSSAssetsPlugin from "optimize-css-assets-webpack-plugin";
import StatsPlugin from "webpack-stats-plugin";
import callerDependency from "../callerDependency";
import path from "path";
import webpack from "webpack";


export default function ({entrypoints, outputDir, outputUrl, hot, minify, longTermCaching, stats}) {
	return {
		entry: entrypoints,
		output: {
			path: outputDir,
			// other than hot mode, the public path is set at runtime.
			publicPath: hot ? outputUrl : undefined,
			filename: `[name]${longTermCaching ? ".[chunkhash]" : ""}.bundle.js`,
			chunkFilename: `[id]${longTermCaching ? ".[chunkhash]" : ""}.bundle.js`,
		},
		//eslint-disable-next-line no-process-env
		mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
		module: {
			rules: clean([
				{
					test: /\.(js|jsx)$/,
					loader: "babel-loader",
					exclude: /node_modules/,
				},
				{
					test: /\.(eot|woff|woff2|ttf|ttc|png|svg|jpg|jpeg|gif|cgm|tiff|webp|bmp|ico)$/i,
					loader: "file-loader",
					exclude: /node_modules/,
				},
				{
					test: /\.json/,
					loader: "json-loader",
					exclude: /node_modules/,
				},
				{
					test: /\.less/,
					loader: [
						"less-loader",
					],
					exclude: /node_modules/,
				},
				{
					test: /\.(sa|sc|c)ss$/,
					use: [
						{
							loader: ExtractCssChunksPlugin.loader,
							options: {
								hot: hot,
							},
						},
						'css-loader',
						"sass-loader",
					],
				},
				{
					test: /\.md/,
					loader: "raw-loader",
					exclude: /node_modules/,
				},
			]),
		},
		resolve: {
			alias: {
				// These need to be singletons.
				"react": callerDependency("react"),
				"react-server": callerDependency("react-server"),
			},
		},
		resolveLoader: {
			modules: [
				path.resolve(path.join(path.dirname(require.resolve("webpack")), "../..")),
			],
		},
		optimization: {
			minimize: minify,
		},
		plugins: clean([
			new ExtractCssChunksPlugin({
				// Options similar to the same options in webpackOptions.output
				// both options are optional
				filename: `[name]${longTermCaching ? ".[contenthash]" : ""}.css`,
				chunkFilename: `[id]${longTermCaching ? ".[contenthash]" : ""}.css`,
			}),

			stats && new StatsPlugin.StatsWriterPlugin({
				fields: ["assets", "assetsByChunkName", "chunks", "errors", "warnings", "version", "hash", "time", "filteredModules", "children", "modules"],
			}),

			// We always like sourcemaps, so if we're minifying then put the sourcemaps in a separate file
			// in the sourcemaps/ directory, otherwise inline the sourcemap with the file.
			new webpack.SourceMapDevToolPlugin({
				filename: minify ? 'sourcemaps/[file].map' : false,
			}),

			minify && new OptimizeCSSAssetsPlugin(),

			hot && new webpack.HotModuleReplacementPlugin(),
		]),
	};
}

function clean(thing) {
	if (Array.isArray(thing)) {
		return thing.filter(v => Boolean(v));
	}
	return Object.keys(thing)
		.reduce((o, k) => thing[k] == null ? o : (o[k] = thing[k], o), {});
}
