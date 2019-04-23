import webpack from "webpack"
import callerDependency from "../callerDependency"
import path from "path"

const ExtractCssChunks = require("extract-css-chunks-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
import StatsPlugin from "webpack-stats-plugin";

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
				hot && {
					test: /\.(js|jsx)$/,
					use: ["react-hot-loader/webpack"],
					exclude: /node_modules/,
				},
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
							loader: ExtractCssChunks.loader,
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
			minimizer: clean([
				minify && new TerserPlugin(),
				minify && new OptimizeCSSAssetsPlugin(),
			]),
		},
		plugins: clean([
			new ExtractCssChunks({
				// Options similar to the same options in webpackOptions.output
				// both options are optional
				filename: `[name]${longTermCaching ? ".[contenthash]" : ""}.css`,
				chunkFilename: `[id]${longTermCaching ? ".[contenthash]" : ""}.css`,
			}),

			stats && new StatsPlugin.StatsWriterPlugin({
				fields: ["assets", "assetsByChunkName", "chunks", "errors", "warnings", "version", "hash", "time", "filteredModules", "children", "modules"],
			}),

			!minify && new webpack.SourceMapDevToolPlugin(),

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
