import webpack from "webpack"
import callerDependency from "../callerDependency"
import path from "path"

import ExtractTextPlugin from "extract-text-webpack-plugin"
import ChunkManifestPlugin from "chunk-manifest-webpack-plugin"
import StatsPlugin from "webpack-stats-plugin"

const NonCachingExtractTextLoader = path.join(__dirname, "../NonCachingExtractTextLoader");
const extractTextLoader           = require.resolve(NonCachingExtractTextLoader) + "?{remove:true}!css-loader";

export default function ({ entrypoints, outputDir, outputUrl, hot, minify, longTermCaching, stats }) {

	return {
		entry: entrypoints,
		output: {
			path: outputDir,
			// other than hot mode, the public path is set at runtime.
			publicPath: hot ? outputUrl : undefined,
			filename: `[name]${longTermCaching ? ".[chunkhash]" : ""}.bundle.js`,
			chunkFilename: `[id]${longTermCaching ? ".[chunkhash]" : ""}.bundle.js`,
		},
		module: {
			loaders: clean([
				hot && {
					test: /\.jsx?$/,
					loader: "react-hot",
					exclude: /node_modules/,
				},
				{
					test: /\.jsx?$/,
					loader: "babel",
					exclude: /node_modules/,
				},
				{
					test: /\.css$/,
					loader: extractTextLoader,
				},
				{
					test: /\.(eot|woff|woff2|ttf|ttc|png|svg|jpg|jpeg|gif|cgm|tiff|webp|bmp|ico)$/i,
					loader: "file",
					exclude: /node_modules/,
				},
				{
					test: /\.json/,
					loader: "json",
					// exclude: /node_modules/,
				},
				{
					test: /\.less/,
					loader: extractTextLoader + "!less-loader",
					exclude: /node_modules/,
				},
				{
					test: /\.s(a|c)ss$/,
					loader: extractTextLoader + "!sass-loader",
					exclude: /node_modules/,
				},
				{
					test: /\.md/,
					loader: "raw",
					exclude: /node_modules/,
				},
			]),
		},
		resolve: {
			alias: {
				// These need to be singletons.
				"react"        : callerDependency("react"),
				"react-server" : callerDependency("react-server"),
			},
		},
		resolveLoader: {
			root: [
				path.resolve(path.join(path.dirname(require.resolve("webpack")), "../..")),
			],
		},
		plugins: clean([
			longTermCaching && new webpack.optimize.OccurenceOrderPlugin(),
			new ChunkManifestPlugin({
				filename: "chunk-manifest.json",
				manifestVariable: "webpackManifest",
			}),
			new ExtractTextPlugin(`[name]${longTermCaching ? ".[chunkhash]" : ""}.css`),
			new webpack.optimize.CommonsChunkPlugin({
				name:"common",
			}),
			stats && new StatsPlugin.StatsWriterPlugin({
				fields: ["assets", "assetsByChunkName", "chunks", "errors", "warnings", "version", "hash", "time", "filteredModules", "children", "modules"],
			}),
			minify && new webpack.DefinePlugin({
				'process.env': {NODE_ENV: '"production"'},
			}),
			// TODO: should this be done as babel plugin?
			minify && new webpack.optimize.UglifyJsPlugin(),
			!minify && new webpack.SourceMapDevToolPlugin(),
			hot && new webpack.HotModuleReplacementPlugin(),
			hot && new webpack.NoErrorsPlugin(),
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
