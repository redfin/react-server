import webpack from "webpack"
import path from "path"
import mkdirp from "mkdirp"
import fs from "fs"
import serverSideHotModuleReload from "./serverSideHotModuleReload"


export default (opts = {}) => {
	const {
		routes,
		webpackConfig,
		workingDir = "./__clientTemp",
		routesDir = ".",
		outputDir = workingDir + "/build",
		outputUrl = "/static/",
		hot = true,
		minify = false,
		stats = false,
		longTermCaching = false,
	} = opts;

	if (longTermCaching && hot) {
		throw new Error("Hot reload cannot be used with long-term caching. Please disable either long-term caching or hot reload.");
	}

	const workingDirAbsolute = path.resolve(process.cwd(), workingDir);
	mkdirp.sync(workingDirAbsolute);
	const outputDirAbsolute = path.resolve(process.cwd(), outputDir);
	mkdirp.sync(outputDirAbsolute);

	const routesDirAbsolute = path.resolve(process.cwd(), routesDir);

	let bootstrapFile = writeClientBootstrapFile(workingDirAbsolute, opts);
	const entrypointBase = hot ? [
		require.resolve("webpack-hot-middleware/client") + '?path=/__react_server_hmr__&timeout=20000&reload=true',
	] : [];
	let entrypoints = {};
	for (let routeName of Object.keys(routes.routes)) {
		let route = routes.routes[routeName];
		let formats = normalizeRoutesPage(route.page);
		for (let format of Object.keys(formats)) {
			const absolutePathToPage = require.resolve(path.resolve(routesDirAbsolute, formats[format]));

			entrypoints[`${routeName}${format !== "default" ? "-" + format : ""}`] = [
				...entrypointBase,
				bootstrapFile,
				absolutePathToPage,
			];
		}
	}

	writeWebpackCompatibleRoutesFile(routes, routesDir, workingDirAbsolute, null, true);

	const userWebpackConfigOpt = webpackConfig || opts['webpack-config'];

	const config = getWebpackConfig(userWebpackConfigOpt, {
		isServer: false,
		outputDir: outputDirAbsolute,
		entrypoints,
		outputUrl,
		hot,
		minify,
		longTermCaching,
		stats,
	});
	const compiler = webpack(config);

	const serverRoutes = new Promise((resolve) => {
		compiler.hooks.done.tap("ReactServer", (stats) => {
			const manifest = statsToManifest(stats);
			fs.writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest));

			const routesFilePath = writeWebpackCompatibleRoutesFile(routes, routesDir, workingDirAbsolute, outputUrl, false, manifest);

			if (hot) {
				serverSideHotModuleReload(stats);
			}

			resolve(routesFilePath);
		});
	});

	return {
		serverRoutes,
		compiler,
		config,
	};
}

function getWebpackConfig(userWebpackConfigOpt, wpAffectingOpts) {

	let extend = (data) => { return data }
	if (userWebpackConfigOpt) {
		const userWebpackConfigPath = path.resolve(process.cwd(), userWebpackConfigOpt);
		const userWebpackConfigFunc = require(userWebpackConfigPath);
		extend = userWebpackConfigFunc.default;
	}

	const baseConfig = require(path.join(__dirname, "webpack/webpack4.config.fn.js")).default(wpAffectingOpts);
	return extend(baseConfig);
}

function statsToManifest(stats) {
	const jsChunksByName = {};
	const cssChunksByName = {};
	const jsChunksById = {};
	const cssChunksById = {};
	let file;
	for (const chunk of stats.compilation.chunks) {
		for (let i = 0; i < chunk.files.length; i++) {
			file = chunk.files[i];
			if (/\.css$/.test(file)) {
				cssChunksById[chunk.id] = file;
				if (chunk.name) {
					cssChunksByName[chunk.name] = file;
				}
			} else if (/^((?!hot-update).)*\.js$/.test(file)) {
				jsChunksById[chunk.id] = file;
				if (chunk.name) {
					jsChunksByName[chunk.name] = file;
				}
			}
		}
	}
	return {
		jsChunksByName,
		jsChunksById,
		cssChunksByName,
		cssChunksById,
		hash: stats.hash,
	};
}

export function writeWebpackCompatibleRoutesFile(routes, routesDir, workingDirAbsolute, staticUrl, isClient, manifest) {
	let routesOutput = [];

	const coreMiddleware = JSON.stringify(require.resolve("react-server-core-middleware"));
	const existingMiddleware = routes.middleware ? routes.middleware.map((middlewareRelativePath) => {
		return `unwrapEs6Module(require(${JSON.stringify(path.relative(workingDirAbsolute, path.resolve(routesDir, middlewareRelativePath)))}))`
	}) : [];
	routesOutput.push(`
var manifest = ${manifest ? JSON.stringify(manifest) : "undefined"};
function unwrapEs6Module(module) { return module.__esModule ? module.default : module }
var coreJsMiddleware = require(${coreMiddleware}).coreJsMiddleware;
var coreCssMiddleware = require(${coreMiddleware}).coreCssMiddleware;
module.exports = {
	middleware:[
		coreJsMiddleware(${JSON.stringify(staticUrl)}, manifest),
		coreCssMiddleware(${JSON.stringify(staticUrl)}, manifest),
		${existingMiddleware.join(",")}
	],
	routes:{`);

	for (let routeName of Object.keys(routes.routes)) {
		let route = routes.routes[routeName];

		let method = route.method;

		if (method === undefined || method === null || method === {} || method.length === 0) {
			method = undefined; // 'undefined' is the value that routr needs to accept any method
		}

		routesOutput.push(`
		${routeName}: {
			path: ${JSON.stringify(route.path)},
			method: ${JSON.stringify(method)},`);

		let formats = normalizeRoutesPage(route.page);
		routesOutput.push(`
			page: {`);
		for (let format of Object.keys(formats)) {
			const formatModule = formats[format];
			const relativePathToPage = JSON.stringify(path.relative(workingDirAbsolute, path.resolve(routesDir, formatModule)));
			routesOutput.push(`
				${format}: function() {
					return {
						done: function(cb) {`);
			if (isClient) {
							require.ensure(${relativePathToPage}, function() {
								cb(unwrapEs6Module(require(${relativePathToPage})));
							});`);
			} else {
				routesOutput.push(`
							try {
								cb(unwrapEs6Module(require(${relativePathToPage})));
							} catch (e) {
								console.error('Failed to load page at ${relativePathToPage}', e.stack);
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

function writeClientBootstrapFile(outputDir, opts) {
	const outputFile = outputDir + "/entry.js";
	fs.writeFileSync(outputFile, `
		import reactServer from "react-server";
	    import routes from "./routes_client";
	    
		if (typeof window !== "undefined") {
			window.__setReactServerBase = (path) => {
				__webpack_public_path__ = path;
				window.__reactServerBase = path;
			}
		}
		window.rfBootstrap = () => {
			reactServer.logging.setLevel('main',  ${JSON.stringify(opts.logLevel)});
			reactServer.logging.setLevel('time',  ${JSON.stringify(opts.timingLogLevel)});
			reactServer.logging.setLevel('gauge', ${JSON.stringify(opts.gaugeLogLevel)});
			new reactServer.ClientController({routes}).init();
		}`
	);
	return outputFile;
}
