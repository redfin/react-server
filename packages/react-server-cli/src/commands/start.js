import http from "http"
import https from "https"
import path from "path"
import express from "express"
import compression from "compression"
import bodyParser from "body-parser"
import WebpackDevMiddleware from "webpack-dev-middleware"
import WebpackHotMiddleware from "webpack-hot-middleware"
import handleCompilationErrors from "../handleCompilationErrors";
import reactServer from "../react-server";
import setupLogging from "../setupLogging";
import logProductionWarnings from "../logProductionWarnings";
import expressState from 'express-state';
import cookieParser from 'cookie-parser';
import chokidar from 'chokidar';
import buildWebpackConfigs from "../buildWebpackConfigs";
import buildWebpackCompilers from "../buildWebpackCompilers";
import mergeOptions from "../mergeOptions";
import findOptionsInFiles from "../findOptionsInFiles";


const logger = reactServer.logging.getLogger(__LOGGER__);

// if used to start a server, returns an object with two properties, started and
// stop. started is a promise that resolves when all necessary servers have been
// started. stop is a method to stop all servers. It takes no arguments and
// returns a promise that resolves when the server has stopped.
export default function start(options){
	setupLogging(options);
	logProductionWarnings(options);

	const {
		port,
		bindIp,
		hot,
		compileOnStartup,
	} = options;

	const webpackInfo = buildWebpack(options);

	const allStartingPromises = [];

	if (hot || compileOnStartup) {
		allStartingPromises.push(webpackInfo.client.compiledPromise);
		allStartingPromises.push(webpackInfo.server.compiledPromise);
	}

	logger.notice("Starting server...");

	const htmlServerPromise = startHtmlServer(options, webpackInfo);
	allStartingPromises.push(htmlServerPromise.started);

	if (hot) {
		const configWatcher = watchConfigurationFiles(htmlServerPromise, options);
	}

	return {
		stop: () => Promise.all([htmlServerPromise.stop]),
		started: Promise.all(allStartingPromises)
			.catch(e => {
				logger.error(e);
				throw e
			})
			.then(() => logger.notice(`Ready for requests on ${bindIp}:${port}.`)),
	};
}


// given the server routes file and a port, start a react-server HTML server at
// http://host:port/. returns an object with two properties, started and stop;
// see the default function doc for explanation.
const startHtmlServer = (options, webpackInfo) => {
	const {
		port,
		bindIp,
		httpsOptions,
		customMiddlewarePath,
		hot,
		longTermCaching,
		compileOnStartup,
	} = options;

	let webpackDevMiddlewareInstance;
	const server = express();

	if (hot) {
		// We don't need to add the server compiler to anything because the clientCompiler runs the serverCompiler
		webpackDevMiddlewareInstance = WebpackDevMiddleware(webpackInfo.client.compiler, {
			//noInfo: (options.logLevel !== "debug"),
			noInfo: true,
			lazy: false,
			publicPath: webpackInfo.client.config.output.publicPath,
			log: logger.debug,
			warn: logger.warn,
			error: logger.error,
		});
		server.use(webpackDevMiddlewareInstance);
		server.use(WebpackHotMiddleware(webpackInfo.client.compiler, {
			log: logger.info,
			path: '/__react_server_hmr__',
		}));
	} else {
		if (compileOnStartup) {
			// Only compile the webpack configs manually if we're not in hot mode and compileOnStartup is true
			logger.notice("Compiling Webpack bundle prior to starting server...");
			webpackInfo.client.compiler.run((err, stats) => {
				const error = handleCompilationErrors(err, stats);
			});
		}

		server.use('/', compression(), express.static(`__clientTemp/build`, {
			maxage: longTermCaching ? '365d' : '0s',
		}));
	}

	let middlewareSetup = (server, rsMiddleware) => {
		server.use(compression());
		server.use(bodyParser.urlencoded({ extended: false }));
		server.use(bodyParser.json());

		expressState.extend(server);

		// parse cookies into req.cookies property
		server.use(cookieParser());

		// sets the namespace that data will be exposed into client-side
		// TODO: express-state doesn't do much for us until we're using a templating library
		server.set('state namespace', '__reactServerState');

		rsMiddleware();
	};

	const webServer = httpsOptions ? https.createServer(httpsOptions, server) : http.createServer(server);
	return {
		stop: serverToStopPromise(webServer, webpackDevMiddlewareInstance),
		started: new Promise((resolve, reject) => {
			webpackInfo.server.routesFile.then(() => {
				logger.info("Starting react-server...");

				let rsMiddlewareCalled = false;
				const rsMiddleware = () => {
					rsMiddlewareCalled = true;
					server.use((req, res, next) => {
						reactServer.middleware(req, res, next, require(webpackInfo.paths.serverEntryPoint));
					});
				};

				if (customMiddlewarePath) {
					const customMiddlewareDirAb = path.resolve(process.cwd(), customMiddlewarePath);
					middlewareSetup = require(customMiddlewareDirAb).default;
				}

				middlewareSetup(server, rsMiddleware);

				if (!rsMiddlewareCalled) {
					logger.error("Error react-server middleware was never setup in custom middleware function");
					reject("Custom middleware did not setup react-server middleware");
					return;
				}

				webServer.on('error', (e) => {
					logger.error("Error starting up react-server");
					logger.error(e);
					reject(e);
				});
				webServer.listen(port, bindIp, (e) => {
					if (e) {
						reject(e);
						return;
					}
					logger.info(`Started react-server over ${httpsOptions ? "HTTPS" : "HTTP"} on ${bindIp}:${port}`);
					resolve();
				});
			});
		}),
	};
};

// returns a method that can be used to stop the server. the returned method
// returns a promise to indicate when the server is actually stopped.
const serverToStopPromise = (server, webpackDevMiddlewareInstance) => {

	const sockets = [];

	// If we're testing then we want to be able to bail out quickly.  Zombie
	// (the test browser) makes keepalive connections to our static asset
	// server, and we don't need to be polite to it when we're tearing down.
	if (process.env.NODE_ENV === "test") { // eslint-disable-line no-process-env
		server.on('connection', socket => sockets.push(socket));
	}

	return () => {
		return new Promise((resolve, reject) => {

			// This will only have anything if we're testing.  See above.
			sockets.forEach(socket => socket.destroy());

			if (webpackDevMiddlewareInstance) {
				webpackDevMiddlewareInstance.close();
			}

			server.on('error', (e) => {
				logger.error('An error was emitted while shutting down the server');
				logger.error(e);
				reject(e);
			});
			server.close((e) => {
				if (e) {
					logger.error('The server was not started, so it cannot be stopped.');
					logger.error(e);
					reject(e);
					return;
				}
				logger.notice('The server stopped.');
				resolve();
			});
		});
	};
};

function buildWebpack(options) {
	let webpackInfo = buildWebpackConfigs(options);

	if (options.hot || options.compileOnStartup) {
		webpackInfo = buildWebpackCompilers(options, webpackInfo);
		webpackInfo.client.compiledPromise = new Promise((resolve) => webpackInfo.client.compiler.plugin("done", () => resolve()));
		webpackInfo.server.compiledPromise = new Promise((resolve) => webpackInfo.server.compiler.plugin("done", () => {
			if (options.hot && require.cache[webpackInfo.paths.serverEntryPoint]) {
				logger.notice('Hot reloading the webpack-compiled server code found at ', webpackInfo.paths.serverEntryPoint);
				delete require.cache[webpackInfo.paths.serverEntryPoint];
			}
			resolve();
		}));
	}

	return webpackInfo;
}

function watchConfigurationFiles(serverObj, options) {
	const cwd = process.cwd();
	const staticConfigFiles = [
		path.resolve(cwd, ".reactserverrc"),
		options.routesPath,
	];

	if (options.webpackConfig) {
		staticConfigFiles.push(path.resolve(cwd, options.webpackConfig));
	}
	if (options.webpackClientConfig) {
		staticConfigFiles.push(path.resolve(cwd, options.webpackClientConfig));
	}
	if (options.webpackServerConfig) {
		staticConfigFiles.push(path.resolve(cwd, options.webpackServerConfig));
	}

	staticConfigFiles.forEach((path) => delete require.cache[path]);

	logger.info("Watching react-server configuration files for changes: ", staticConfigFiles);
	const watcher = chokidar.watch(staticConfigFiles);

	watcher.on('change', (path) => {
		logger.info(`File ${path} has been changed, restarting server`);
		watcher.close();
		const newOptions = mergeOptions(options, findOptionsInFiles() || {});
		serverObj.stop().then(start(newOptions));
	});

	return watcher;
}
