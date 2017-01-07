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

const logger = reactServer.logging.getLogger(__LOGGER__);

// returns a method that can be used to stop the server. the returned method
// returns a promise to indicate when the server is actually stopped.
const serverToStopPromise = (httpServer) => {

	const sockets = [];

	// If we're testing then we want to be able to bail out quickly.  Zombie
	// (the test browser) makes keepalive connections to our static asset
	// server, and we don't need to be polite to it when we're tearing down.
	if (process.env.NODE_ENV === "test") { // eslint-disable-line no-process-env
		httpServer.on('connection', socket => sockets.push(socket));
	}

	return () => {
		return new Promise((resolve, reject) => {

			// This will only have anything if we're testing.  See above.
			sockets.forEach(socket => socket.destroy());

			httpServer.on('error', (e) => {
				logger.error('An error was emitted while shutting down the server');
				logger.error(e);
				reject(e);
			});
			httpServer.close((e) => {
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
};


// given the server routes file and a port, start a react-server server at
// http://host:port/. returns an object with two properties, started and stop;
// see the default function doc for explanation.
const startServer = (serverRoutes, options, compiler) => {
	const {
		port,
		bindIp,
		httpsOptions,
		customMiddlewarePath,
		hot,
		longTermCaching,
	} = options;

	let expressServer,
		httpServer;

	if (hot) {
		logger.notice("Enabling hot module reload with webpack-dev-server");
		const webpackDevServer = new WebpackDevServer(compiler, {
			noInfo: true,
			hot: true,
			headers: { 'Access-Control-Allow-Origin': '*' },
			https: !!httpsOptions,
			key: httpsOptions ? httpsOptions.key : undefined,
			cert: httpsOptions ? httpsOptions.cert : undefined,
			ca: httpsOptions ? httpsOptions.ca : undefined,

			// contentBase: false is required in order to prevent WebpackDevServer from trying to serve static directory
			// entries for the URL path '/'.  When WebpackDevServer does this, Express never calls react-server to attempt
			// to handle the request.
			contentBase: false,
		});
		expressServer = webpackDevServer.app;
		httpServer = webpackDevServer;
		// This allows us to attach our own bindings to the .on() events from http/https server and still use the
		// WebpackDevServer .listen() and .close(), which is required for the HMR websocket to be opened.
		httpServer.on = webpackDevServer.listeningApp.on;
	} else {
		// Only compile the webpack configs manually if we're not in hot mode
		logger.notice("Compiling Webpack bundle prior to starting server");
		compiler.run((err, stats) => {
			handleCompilationErrors(err, stats);
		});

		expressServer = express();
		expressServer.use('/', compression(), express.static(`__clientTemp/build`, {
			maxage: longTermCaching ? '365d' : '0s',
		}));
		httpServer = httpsOptions ? https.createServer(httpsOptions, expressServer) : http.createServer(expressServer);
	}

	let middlewareSetup = (server, rsMiddleware) => {
		server.use(compression());
		server.use(bodyParser.urlencoded({ extended: false }));
		server.use(bodyParser.json());
		rsMiddleware();
	};

	return {
		stop: serverToStopPromise(httpServer),
		started: new Promise((resolve, reject) => {
			serverRoutes.then((serverRoutesFile) => {
				logger.info("Starting react-server...");

				let rsMiddlewareCalled = false;
				const rsMiddleware = () => {
					rsMiddlewareCalled = true;
					reactServer.middleware(expressServer, require(serverRoutesFile));
				};

				if (customMiddlewarePath) {
					const customMiddlewareDirAb = path.resolve(process.cwd(), customMiddlewarePath);
					middlewareSetup = require(customMiddlewareDirAb).default;
				}

				middlewareSetup(expressServer, rsMiddleware);

				if (!rsMiddlewareCalled) {
					logger.error("Error react-server middleware was never setup in custom middleware function");
					reject("Custom middleware did not setup react-server middleware");
					return;
				}

				httpServer.on('error', (e) => {
					logger.error("Error starting up react-server");
					logger.error(e);
					reject(e);
				});
				httpServer.listen(port, bindIp, (e) => {
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


// if used to start a server, returns an object with two properties, started and
// stop. started is a promise that resolves when the server has been
// started. stop is a method to stop the server. It takes no arguments and
// returns a promise that resolves when the server has stopped.
export default function start(options) {
	setupLogging(options);
	logProductionWarnings(options);

	const {
		port,
		bindIp,
	} = options;

	const {serverRoutes, compiler, config} = compileClient(options);

	logger.notice("Starting server...");

	const serverPromises = startServer(serverRoutes, options, compiler, config);

	return {
		stop: () => Promise.all([serverPromises.stop()]),
		started: Promise.all([serverPromises.started])
			.catch(e => {
				logger.error(e);
				throw e
			})
			.then(() => logger.notice(`Ready for requests on ${bindIp}:${port}.`)),
	};
}
