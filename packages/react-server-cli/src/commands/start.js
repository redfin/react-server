import http from "http"
import https from "https"
import path from "path"
import express from "express"
import compression from "compression"
import bodyParser from "body-parser"
import WebpackDevServer from "webpack-dev-server"
import compileClient from "../compileClient"
import handleCompilationErrors from "../handleCompilationErrors";
import reactServer from "../react-server";
import setupLogging from "../setupLogging";
import logProductionWarnings from "../logProductionWarnings";
import expressState from 'express-state';
import cookieParser from 'cookie-parser';

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
		jsPort,
		hot,
		jsUrl,
		httpsOptions,
		longTermCaching,
		customMiddlewarePath,
	} = options;

	const {serverRoutes, compiler, serverCompiler} = compileClient(options);

	const startServers = () => {
		logger.notice("Starting servers...");

		const compiledPromise = new Promise((resolve) => compiler.plugin("done", () => resolve()));

		const htmlServerPromise =
			startHtmlServer(serverRoutes, port, bindIp, httpsOptions, customMiddlewarePath, serverCompiler, compiler, hot, longTermCaching);

		return {
			stop: () => Promise.all([htmlServerPromise.stop]),
			started: Promise.all([compiledPromise, htmlServerPromise.started])
				.catch(e => {logger.error(e); throw e})
				.then(() => logger.notice(`Ready for requests on ${bindIp}:${port}.`)),
		};
	}

	return startServers();
}


// given the server routes file and a port, start a react-server HTML server at
// http://host:port/. returns an object with two properties, started and stop;
// see the default function doc for explanation.
const startHtmlServer = (serverRoutes, port, bindIp, httpsOptions, customMiddlewarePath, serverCompiler, compiler, hot, longTermCaching) => {
	const serverBuildLocation = path.resolve(process.cwd(), '__serverTemp/build/server.bundle.js');

	let webServer,
		server;

	if (hot) {
		logger.info("using webpack dev server");
		webServer = new WebpackDevServer(compiler, {
			noInfo: true,
			hot: true,
			headers: {'Access-Control-Allow-Origin': '*'},
			https: !!httpsOptions,
			key: httpsOptions ? httpsOptions.key : undefined,
			cert: httpsOptions ? httpsOptions.cert : undefined,
			ca: httpsOptions ? httpsOptions.ca : undefined,
			proxy: [
				{
					path: [
						'!/__webpack_dev_server__/**',
						'!/webpack-dev-server/**',
						'!/webpack-dev-server.js',
						'!/webpack-dev-server',
						'/**',
					],  //catch all requests except WebpackDevServer
					target: '/index.html',  //default target
					secure: false,
					bypass: function (req, res, next) {
						logger.info("looking for a file: ", req.url);
			 			reactServer.middleware(req, res, next, require(serverBuildLocation));
					}
				}
			]
		});
		server = webServer.app;
	} else {
		logger.info("using plain express server");
		server = express();
		webServer = httpsOptions ? https.createServer(httpsOptions, server) : http.createServer(server);
		server.use('/', compression(), express.static(`__clientTemp/build`, {
			maxage: longTermCaching ? '365d' : '0s',
		}));
		server.use((req, res, next) => {
			reactServer.middleware(req, res, next, require(serverBuildLocation));
		});
		compiler.run((err, stats) => {
			const error = handleCompilationErrors(err, stats);
		});
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

	return {
		stop: serverToStopPromise(webServer),
		started: new Promise((resolve, reject) => {
			serverRoutes.then(() => {
				serverCompiler.run((err, stats) => {
					const error = handleCompilationErrors(err, stats);
					if (error) {
						reject(error);
						return;
					}

					logger.debug("Successfully compiled server side static JavaScript.");


					logger.info("Starting HTML server...");

					let rsMiddlewareCalled = false;
					const rsMiddleware = () => {
						rsMiddlewareCalled = true;
						//reactServer.middleware(server, require(serverBuildLocation));
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

					if (typeof webServer.on === "function") {
						webServer.on('error', (e) => {
							logger.error("Error starting up HTML server");
							logger.error(e);
							reject(e);
						});
					}
					webServer.listen(port, bindIp, (e) => {
						if (e) {
							reject(e);
							return;
						}
						logger.info(`Started HTML server over ${httpsOptions ? "HTTPS" : "HTTP"} on ${bindIp}:${port}`);
						resolve();
					});
				});
			});
		}),
	};
};

// returns a method that can be used to stop the server. the returned method
// returns a promise to indicate when the server is actually stopped.
const serverToStopPromise = (server) => {

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

			server.on('error', (e) => {
				logger.error('An error was emitted while shutting down the server');
				logger.error(e);
				reject(e);
			})
			server.close((e) => {
				if (e) {
					logger.error('The server was not started, so it cannot be stopped.');
					logger.error(e);
					reject(e);
					return;
				}
				resolve();
			});
		});
	};
}
