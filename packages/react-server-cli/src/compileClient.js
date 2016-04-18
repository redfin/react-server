import webpack from "webpack"
import path from "path"
import mkdirp from "mkdirp"
import fs from "fs"
import ExtractTextPlugin from "extract-text-webpack-plugin"
import crypto from "crypto"

// commented out to please eslint, but re-add if logging is needed in this file.
//import {logging} from "react-server"
//const logger = logging.getLogger(__LOGGER__);

// compiles the routes file for browser clients using webpack.
// returns a tuple of { compiler, serverRoutes }. compiler is a webpack compiler
// that is ready to have run called, and serverRoutes is a path to the transpiled
// server routes file, which can be required and passed in to
// reactServer.middleware().
// TODO: add options for sourcemaps.
export default (routes,{
	workingDir = "./__clientTemp",
	routesDir = ".",
	outputDir = workingDir + "/build",
	outputUrl = "/static/",
	hot = true,
	minify = false,
} = {}) => {
	const workingDirAbsolute = path.resolve(process.cwd(), workingDir);
	mkdirp.sync(workingDirAbsolute);
	const outputDirAbsolute = path.resolve(process.cwd(), outputDir);
	mkdirp.sync(outputDirAbsolute);

	const routesDirAbsolute = path.resolve(process.cwd(), routesDir);

	// for each route, let's create an entrypoint file that includes the page file and the routes file
	let bootstrapFile = writeClientBootstrapFile(workingDirAbsolute);
	const entrypointBase = hot ? [`webpack-dev-server/client?${outputUrl}`,"webpack/hot/only-dev-server"] : [];
	let entrypoints = {};
	for (let routeName of Object.keys(routes.routes)) {
		let route = routes.routes[routeName];
		let formats = normalizeRoutesPage(route.page);
		for (let format of Object.keys(formats)) {
			const absolutePathToPage = path.resolve(routesDirAbsolute, formats[format]);

			entrypoints[`${routeName}${format !== "default" ? "-" + format : ""}`] = [
				...entrypointBase,
				bootstrapFile,
				absolutePathToPage,
			];
		}
	}

	// now rewrite the routes file out in a webpack-compatible way.
	const serverRoutes = writeWebpackCompatibleRoutesFile(routes, routesDir, workingDirAbsolute, outputUrl, false);
	writeWebpackCompatibleRoutesFile(routes, routesDir, workingDirAbsolute, outputUrl, true);

	// finally, let's pack this up with webpack.
	return {
		serverRoutes,
		compiler: webpack(packageCodeForBrowser(entrypoints, outputDirAbsolute, outputUrl, hot, minify)),
	};
}

const packageCodeForBrowser = (entrypoints, outputDir, outputUrl, hot, minify) => {
	const extractTextLoader = require.resolve("./NonCachingExtractTextLoader") + "?{remove:true}!css-loader";
	let webpackConfig = {
		entry: entrypoints,
		output: {
			path: outputDir,
			publicPath: outputUrl,
			filename: "[name].bundle.js",
			chunkFilename: "[id].bundle.js",
		},
		module: {
			loaders: [
				{
					test: /\.jsx?$/,
					loader: "babel",
					exclude: /node_modules/,
				},
				{
					test: /.css$/,
					loader: extractTextLoader,
					exclude: /node_modules/,
				},
			],
		},
		resolve: {
			root: [
				path.resolve("./node_modules/react-server-cli/node_modules"),
			],
		},
		resolveLoader: {
			root: [
				path.resolve("./node_modules/react-server-cli/node_modules"),
			],
		},
		plugins: [
			new ExtractTextPlugin("[name].css"),
			new webpack.optimize.CommonsChunkPlugin({
				name:"common",
				filename: "common.js",
			}),
		],
	};

	if (minify) {
		webpackConfig.plugins = [
			...webpackConfig.plugins,
			new webpack.DefinePlugin({
				'process.env': {NODE_ENV: '"production"'},
			}),
			// TODO: should this be done as babel plugin?
			new webpack.optimize.UglifyJsPlugin(),
		];
	} else {
		webpackConfig.devtool = "#cheap-module-eval-source-map";
	}

	if (hot) {
		webpackConfig.module.loaders = [
			{
				test: /\.jsx?$/,
				loader: "react-hot",
				exclude: /node_modules/,
			},
			...webpackConfig.module.loaders,
		];
		webpackConfig.plugins = [
			...webpackConfig.plugins,
			new webpack.HotModuleReplacementPlugin(),
			new webpack.NoErrorsPlugin(),
		];
	}

	return webpackConfig;
};

// writes out a routes file that can be used at runtime.
const writeWebpackCompatibleRoutesFile = (routes, routesDir, workingDirAbsolute, staticUrl, isClient) => {
	let routesOutput = [];

	const existingMiddleware = routes.middleware ? routes.middleware.map((middlewareRelativePath) => {
		return `unwrapEs6Module(require("${path.relative(workingDirAbsolute, path.resolve(routesDir, middlewareRelativePath))}"))`
	}) : [];
	routesOutput.push(`
function unwrapEs6Module(module) { return module.__esModule ? module.default : module }
var coreJsMiddleware = unwrapEs6Module(require('react-server-cli/target/coreJsMiddleware'));
var coreCssMiddleware = unwrapEs6Module(require('react-server-cli/target/coreCssMiddleware'));
module.exports = {
	middleware:[
		coreJsMiddleware(${JSON.stringify(staticUrl)}),
		coreCssMiddleware(${JSON.stringify(staticUrl)}),
		${existingMiddleware.join(",")}
	],
	routes:{`);

	for (let routeName of Object.keys(routes.routes)) {
		let route = routes.routes[routeName];

		routesOutput.push(`
		${routeName}: {`);
		for (let name of ["path", "method"]) {
			routesOutput.push(`
			${name}: "${route[name]}",`);
		}

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
							cb(unwrapEs6Module(require("${relativePathToPage}")));`);
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
	const routesFilePath = `${workingDirAbsolute}/routes_${isClient ? "client" : "server_" + routesMD5}.js`;
	fs.writeFileSync(routesFilePath, routesContent);

	return routesFilePath;
};


// the page value for routes.routes["SomeRoute"] can either be a string for the default
// module name or an object mapping format names to module names. This method normalizes
// the value to an object.
const normalizeRoutesPage = (page) => {
	if (typeof page === "string") {
		return {default: page};
	}
	return page;
}

// writes out a bootstrap file for the client which in turn includes the client
// routes file. note that outputDir must be the same directory as the client routes
// file, which must be named "routes_client".
const writeClientBootstrapFile = (outputDir) => {
	var outputFile = outputDir + "/entry.js";
	fs.writeFileSync(outputFile, `
		if (typeof window !== "undefined") {
			window.__setReactServerBase = function(path) {
				// according to http://webpack.github.io/docs/configuration.html#output-publicpath
				// we should never set __webpack_public_path__ when hot module replacement is on.
				if (!module.hot) {
					__webpack_public_path__ = path;
					window.__reactServerBase = path;
				}
			}
		}
		var reactServer = require("react-server");
		window.rfBootstrap = function() {
			new reactServer.ClientController({routes: require("./routes_client")}).init();
		}`
	);
	return outputFile;
};
