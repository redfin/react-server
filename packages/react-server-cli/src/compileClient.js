import webpack from "webpack"
import path from "path"
import mkdirp from "mkdirp"
import fs from "fs"
import ExtractTextPlugin from "extract-text-webpack-plugin"
import ChunkManifestPlugin from "chunk-manifest-webpack-plugin"
import crypto from "crypto"
import StatsPlugin from "webpack-stats-plugin"
import callerDependency from "./callerDependency"


// commented out to please eslint, but re-add if logging is needed in this file.
// import {logging} from "react-server"
// const logger = logging.getLogger(__LOGGER__);

// compiles the routes file for browser clients using webpack.
// returns a tuple of { compiler, serverRoutes }. compiler is a webpack compiler
// that is ready to have run called, and serverRoutes is a promise that resolve to
// a path to the transpiled server routes file path. The promise only resolves
// once the compiler has been run. The file path returned from the promise
// can be required and passed in to reactServer.middleware().
// TODO: add options for sourcemaps.
export default (opts = {}) => {
	const {
		routes,
		webpackConfig,
		workingDir = "./__clientTemp",
		outputDir = workingDir + "/build",
		serverWorkingDir = "./__serverTemp",
		serverOutputDir = serverWorkingDir + "/build",
		routesDir = ".",
		outputUrl = "/static/",
		hot = true,
		minify = false,
		stats = false,
		longTermCaching = false,
	} = opts;
	if (longTermCaching && hot) {
		// chunk hashes can't be used in hot mode, so we can't use long-term caching
		// and hot mode at the same time.
		throw new Error("Hot reload cannot be used with long-term caching. Please disable either long-term caching or hot reload.");
	}

	let webpackConfigFunc = (data) => { return data };
	if (webpackConfig) {
		const webpackDirAbsolute = path.resolve(process.cwd(), webpackConfig);
		const userWebpackConfigFunc = require(webpackDirAbsolute);
		webpackConfigFunc = userWebpackConfigFunc.default
	}


	const workingDirAbsolute = path.resolve(process.cwd(), workingDir);
	mkdirp.sync(workingDirAbsolute);
	const outputDirAbsolute = path.resolve(process.cwd(), outputDir);
	mkdirp.sync(outputDirAbsolute);

	const serverWorkingDirAbsolute = path.resolve(process.cwd(), serverWorkingDir);
	mkdirp.sync(serverWorkingDirAbsolute);
	const serverOutputDirAbsolute = path.resolve(process.cwd(), serverOutputDir);
	mkdirp.sync(serverOutputDirAbsolute);

	const routesDirAbsolute = path.resolve(process.cwd(), routesDir);

	// for each route, let's create an entrypoint file that includes the page file and the routes file
	let bootstrapFile = writeClientBootstrapFile(workingDirAbsolute, opts);
	let serverBootstrapFile = workingDirAbsolute + "/routes_server.js";
	const entrypointBase = hot ? [
		require.resolve("webpack-dev-server/client") + "?" + outputUrl,
		require.resolve("webpack/hot/only-dev-server"),
	] : [];
	let clientEntrypoints = {};
	let serverEntrypoints = {};
	for (let routeName of Object.keys(routes.routes)) {
		let route = routes.routes[routeName];
		let formats = normalizeRoutesPage(route.page);
		for (let format of Object.keys(formats)) {
			const absolutePathToPage = require.resolve(path.resolve(routesDirAbsolute, formats[format]));

			clientEntrypoints[`${routeName}${format !== "default" ? "-" + format : ""}`] = [
				...entrypointBase,
				bootstrapFile,
				absolutePathToPage,
			];
			serverEntrypoints[`${routeName}${format !== "default" ? "-" + format : ""}`] = [
				serverBootstrapFile,
			];
		}
	}

	// now rewrite the routes file out in a webpack-compatible way.
	writeWebpackCompatibleRoutesFile(routes, routesDir, workingDirAbsolute, null, true);

	// finally, let's pack this up with webpack.
	const clientWebpackConfig = webpackConfigFunc(packageCodeForBrowser(clientEntrypoints, outputDirAbsolute, outputUrl, hot, minify, longTermCaching, stats));
	const serverWebpackConfig = webpackConfigFunc(packageCodeForNode(serverEntrypoints, serverOutputDirAbsolute, outputUrl, false, false, false, false));

	// TODO: It seems that WebpackDevServer doesn't work properly with multiple compiler configs at this time.
	// https://github.com/webpack/webpack/issues/1849
	const compiler = webpack(clientWebpackConfig);
	const serverCompiler = webpack(serverWebpackConfig);

	const serverRoutes = new Promise((resolve) => {
		compiler.plugin("done", (stats) => {
			const manifest = statsToManifest(stats);
			fs.writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest));

			// this file is generated by the build in non-hot mode, but we don't need
			// it (we got the data ourselves from stats in statsToManifest()).
			if (!hot) {
				fs.unlinkSync(path.join(outputDir, "chunk-manifest.json"));
			}

			resolve(writeWebpackCompatibleRoutesFile(routes, routesDir, workingDirAbsolute, outputUrl, false, manifest));
		});
	});


	return {
		serverRoutes,
		compiler,
		serverCompiler,
	};
}

// takes in the stats object from a successful compilation and returns a manifest
// object that characterizes the results of the compilation for CSS/JS loading
// and integrity checking. the manifest has the following entries:
//   jsChunksByName: an object that maps chunk names to their JS entrypoint file.
//   cssChunksByName: an object that maps chunk names to their CSS file. Note that
//     not all named chunks necessarily have a CSS file, so not all names will
//     show up as a key in this object.
//   jsChunksById: an object that maps chunk ids to their JS entrypoint file.
//   hash: the overall hash of the build, which can be used to check integrity
//     with prebuilt sources.
function statsToManifest(stats) {
	const jsChunksByName = {};
	const cssChunksByName = {};
	const jsChunksById = {};
	for (const chunk of stats.compilation.chunks) {
		if (chunk.name) {
			jsChunksByName[chunk.name] = chunk.files[0];
			if (chunk.files.length > 1) {
				cssChunksByName[chunk.name] = chunk.files[1];
			}
		}
		jsChunksById[chunk.id] = chunk.files[0];
	}
	return {
		jsChunksByName,
		jsChunksById,
		cssChunksByName,
		hash: stats.hash,
	};
}

function getCommonWebpackConfig(hot, minify, longTermCaching, stats) {
	const NonCachingExtractTextLoader = path.join(__dirname, "./NonCachingExtractTextLoader");
	const extractTextLoader = require.resolve(NonCachingExtractTextLoader) + "?{remove:true}!css-loader";

	let commonWebpackConfig = {
		module: {
			loaders: [
				{
					test: /\.jsx?$/,
					loader: "babel",
					exclude: /node_modules/,
				},
				{
					test: /\.css$/,
					loader: extractTextLoader,
					exclude: /node_modules/,
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
			],
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
		plugins: [],
	};

	if (stats) {
		commonWebpackConfig.plugins.push(new StatsPlugin.StatsWriterPlugin({
			fields: ["assets", "assetsByChunkName", "chunks", "errors", "warnings", "version", "hash", "time", "filteredModules", "children", "modules"],
		}));
	}

	if (minify) {
		commonWebpackConfig.plugins = [
			...commonWebpackConfig.plugins,
			new webpack.DefinePlugin({
				'process.env': {NODE_ENV: '"production"'},
			}),
			// TODO: should this be done as babel plugin?
			new webpack.optimize.UglifyJsPlugin(),
		];
	} else {
		commonWebpackConfig.plugins.push(new webpack.SourceMapDevToolPlugin());
	}

	if (hot) {
		commonWebpackConfig.module.loaders = [
			{
				test: /\.jsx?$/,
				loader: "react-hot",
				exclude: /node_modules/,
			},
			...commonWebpackConfig.module.loaders,
		];
		commonWebpackConfig.plugins = [
			...commonWebpackConfig.plugins,
			new webpack.HotModuleReplacementPlugin(),
			new webpack.NoErrorsPlugin(),
		];
	}

	if (longTermCaching) {
		commonWebpackConfig.plugins = [
			new webpack.optimize.OccurenceOrderPlugin(),
			...commonWebpackConfig.plugins,
		];
	}

	return commonWebpackConfig;
}

function packageCodeForBrowser(entrypoints, outputDir, outputUrl, hot, minify, longTermCaching, stats) {
	const commonWebpackConfig = getCommonWebpackConfig(hot, minify, longTermCaching, stats);

	let clientWebpackConfig = Object.assign({}, commonWebpackConfig, {
		target: "web",
		entry: entrypoints,
		output: {
			path: outputDir,
			// other than hot mode, the public path is set at runtime.
			publicPath: hot ? outputUrl : undefined,
			filename: `[name]${longTermCaching ? ".[chunkhash]" : ""}.bundle.js`,
			chunkFilename: `[id]${longTermCaching ? ".[chunkhash]" : ""}.bundle.js`,
		},
		plugins: [
			...commonWebpackConfig.plugins,
			new ChunkManifestPlugin({
				filename: "chunk-manifest.json",
				manifestVariable: "webpackManifest",
			}),
			new ExtractTextPlugin(`[name]${longTermCaching ? ".[chunkhash]" : ""}.css`),
			new webpack.optimize.CommonsChunkPlugin({
				name:"common",
			}),
			new webpack.DefinePlugin({
				WEBPACK_COMPILER: '"client"',
			}),
		]
	});

	console.log("clientConfig: ", clientWebpackConfig);

	return clientWebpackConfig;
}

function packageCodeForNode(entrypoints, outputDir, outputUrl, hot, minify, longTermCaching, stats) {
	const commonWebpackConfig = getCommonWebpackConfig(hot, minify, longTermCaching, stats);

	let nodeModules = {};
	fs.readdirSync('node_modules')
		.filter(function(x) {
			return ['.bin'].indexOf(x) === -1;
		})
		.forEach(function(mod) {
			nodeModules[mod] = 'commonjs ' + mod;
		});

	let serverWebpackConfig = Object.assign({}, commonWebpackConfig, {
		target: "node",
		node: {
			__dirname  : false,
			__filename : false
		},
		entry: entrypoints,
		externals: nodeModules,
		output: {
			path: outputDir,
			filename: `server.bundle.js`,
			libraryTarget: 'commonjs2',
			pathinfo: true,
		},
		devtool: 'source-map',
		plugins: [
			...commonWebpackConfig.plugins,
			new webpack.IgnorePlugin(/\.(css|less|sass|scss)$/),
			new webpack.BannerPlugin('require("source-map-support").install();',
				{ raw: true, entryOnly: false }),
			new webpack.DefinePlugin({
				WEBPACK_COMPILER: '"server"',
			}),
			new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
		],
	});

	console.log("serverConfig: ", serverWebpackConfig);

	return serverWebpackConfig;
}

// writes out a routes file that can be used at runtime.
function writeWebpackCompatibleRoutesFile(routes, routesDir, workingDirAbsolute, staticUrl, isClient, manifest) {
	let routesOutput = [];

	const coreMiddleware = require.resolve("react-server-core-middleware");
	const existingMiddleware = routes.middleware ? routes.middleware.map((middlewareRelativePath) => {
		return `unwrapEs6Module(require("${path.relative(workingDirAbsolute, path.resolve(routesDir, middlewareRelativePath))}"))`
	}) : [];
	routesOutput.push(`
var manifest = ${manifest ? JSON.stringify(manifest) : "undefined"};
function unwrapEs6Module(module) { return module.__esModule ? module.default : module }
var coreJsMiddleware = require('${coreMiddleware}').coreJsMiddleware;
var coreCssMiddleware = require('${coreMiddleware}').coreCssMiddleware;
module.exports = {
	middleware:[
		coreJsMiddleware(${JSON.stringify(staticUrl)}, manifest),
		coreCssMiddleware(${JSON.stringify(staticUrl)}, manifest),
		${existingMiddleware.join(",")}
	],
	routes:{`);

	for (let routeName of Object.keys(routes.routes)) {
		let route = routes.routes[routeName];

		routesOutput.push(`
		${routeName}: {`);
		routesOutput.push(`
			path: ${JSON.stringify(route.path)},`);
		// if the route doesn't have a method, we'll assume it's "get". routr doesn't
		// have a default (method is required), so we set it here.
		routesOutput.push(`
			method: "${route.method || "get"}",`);

		let formats = normalizeRoutesPage(route.page);
		routesOutput.push(`
			page: {`);
		for (let format of Object.keys(formats)) {
			const formatModule = formats[format];
			var relativePathToPage = path.relative(workingDirAbsolute, path.resolve(routesDir, formatModule));
			routesOutput.push(`
				${format}: function() {
					return {
						done: function(cb) {`);
			if (isClient) {
				routesOutput.push(`
							require.ensure("${relativePathToPage}", function() {
								cb(unwrapEs6Module(require("${relativePathToPage}")));
							});`);
			} else {
				routesOutput.push(`
							try {
								cb(unwrapEs6Module(require("${relativePathToPage}")));
							} catch (e) {
								console.error('Failed to load page at "${relativePathToPage}"', e.stack);
							}`);
			}
			routesOutput.push(`
						}
					};
				},`);
		}
		routesOutput.push(`
			},
		},`);
	}
	routesOutput.push(`
	}
};`);

	const routesContent = routesOutput.join("");
	// make a unique file name so that when it is required, there are no collisions
	// in the module loader between different invocations.
	const routesMD5 = crypto.createHash('md5').update(routesContent).digest("hex");
	const routesFilePath = `${workingDirAbsolute}/routes_${isClient ? "client" : "server"}.js`;
	fs.writeFileSync(routesFilePath, routesContent);

	return routesFilePath;
}


// the page value for routes.routes["SomeRoute"] can either be a string for the default
// module name or an object mapping format names to module names. This method normalizes
// the value to an object.
function normalizeRoutesPage(page) {
	if (typeof page === "string") {
		return {default: page};
	}
	return page;
}

// writes out a bootstrap file for the client which in turn includes the client
// routes file. note that outputDir must be the same directory as the client routes
// file, which must be named "routes_client".
function writeClientBootstrapFile(outputDir, opts) {
	var outputFile = outputDir + "/entry.js";
	fs.writeFileSync(outputFile, `
		if (typeof window !== "undefined") {
			window.__setReactServerBase = function(path) {
				// according to http://webpack.github.io/docs/configuration.html#output-publicpath
				// we should never set __webpack_public_path__ when hot module replacement is on.
				if (!module.hot) {
					__webpack_public_path__ = path;
				}
				window.__reactServerBase = path;
			}
		}
		var reactServer = require("react-server");
		window.rfBootstrap = function() {
			reactServer.logging.setLevel('main',  ${JSON.stringify(opts.logLevel)});
			reactServer.logging.setLevel('time',  ${JSON.stringify(opts.timingLogLevel)});
			reactServer.logging.setLevel('gauge', ${JSON.stringify(opts.gaugeLogLevel)});
			new reactServer.ClientController({routes: require("./routes_client")}).init();
		}`
	);
	return outputFile;
}
