import webpack from "webpack"
import reactServer from "react-server"
import path from "path"
import mkdirp from "mkdirp"
import fs from "fs"
import Q from "Q"
import ExtractTextPlugin from "extract-text-webpack-plugin"

const logger = reactServer.logging.getLogger({name: "react-server-cli/compileClient.js", color: {server: 164}});
/**
 * Compiles the routes file in question for browser clients using webpack.
 */
 // TODO: add options for sourcemaps.
export default (routes,
		{
			workingDir = "./__clientTemp",
			routesDir = ".",
			outputDir = workingDir + "/build",
			outputUrl = "/static/",
			hot = true,
			minify = false,
		} = {}
	) => {
	const workingDirAbsolute = path.resolve(process.cwd(), workingDir);
	mkdirp.sync(workingDirAbsolute);
	const outputDirAbsolute = path.resolve(process.cwd(), outputDir);
	mkdirp.sync(outputDirAbsolute);

	const routesDirAbsolute = path.resolve(process.cwd(), routesDir);

	// for each route, let's create an entrypoint file that includes the page file and the routes file
	let bootstrapFile = writeClientBootstrapFile(workingDirAbsolute);
	const entrypointBase = hot ? [`webpack-dev-server/client?${outputUrl}`,"webpack/hot/only-dev-server"] : [];
	let entrypoints = {};
	for (let routeName in routes.routes) {
		let route = routes.routes[routeName];
		var absolutePathToPage = path.resolve(routesDirAbsolute, route.page);

		entrypoints[routeName] = [
			...entrypointBase,
			bootstrapFile,
			absolutePathToPage,
		];
	}

	// now rewrite the routes file out in a webpack-compatible way.
	const serverRoutes = writeWebpackCompatibleRoutesFile(routes, routesDir, workingDirAbsolute, outputUrl, false);
	const clientRoutes = writeWebpackCompatibleRoutesFile(routes, routesDir, workingDirAbsolute, outputUrl, true);

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
			loaders: [{
				test: /\.jsx?$/,
				loader: "babel",
				exclude: /node_modules/,
			},
			{
				test: /.css$/,
				loader: extractTextLoader,
				exclude: /node_modules/,
			}]
		},
		plugins: [
			new ExtractTextPlugin("[name].css")
		],
	};

	if (minify) {
		webpackConfig.plugins = [
			...webpackConfig.plugins,
			new webpack.DefinePlugin({
				'process.env': {NODE_ENV: '"production"'}
			}),
			// TODO: should this be done as babel plugin?
			new webpack.optimize.UglifyJsPlugin(),
		];
	} else {
		webpackConfig.devtool = "#cheap-module-eval-source-map";
	}

	if (hot) {
		webpackConfig.module.loaders.unshift({
				test: /\.jsx?$/,
				loader: "react-hot",
				exclude: /node_modules/,
		});
		webpackConfig.plugins = [
			...webpackConfig.plugins,
			new webpack.HotModuleReplacementPlugin(),
			new webpack.NoErrorsPlugin()
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

	for (let routeName in routes.routes) {
		let route = routes.routes[routeName];
		var relativePathToPage = path.relative(workingDirAbsolute, path.resolve(routesDir, route.page));

		routesOutput.push(`
		${routeName}: {`);
		for (let name of ["path", "method"]) {
			routesOutput.push(`
			${name}: "${route[name]}",`);
		}
		routesOutput.push(`
			page: function() {
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
			},
		},`);
	}
	routesOutput.push(`
	}
};`);

	const routesFilePath = `${workingDirAbsolute}/routes_${isClient ? "client" : "server"}.js`;
	fs.writeFileSync(routesFilePath, routesOutput.join(""));

	return routesFilePath;
};

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
