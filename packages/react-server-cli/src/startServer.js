import reactServer, { logging } from "react-server"
import http from "http"
import https from "https"
import express from "express"
import path from "path"
import pem from "pem"
import compression from "compression"
import defaultOptions from "./defaultOptions"
import WebpackDevServer from "webpack-dev-server"
import compileClient from "./compileClient"
import mergeOptions from "./mergeOptions"
import findOptionsInFiles from "./findOptionsInFiles"

const logger = logging.getLogger(__LOGGER__);

// if used to start a server, returns an object with two properties, started and
// stop. started is a promise that resolves when all necessary servers have been
// started. stop is a method to stop all servers. It takes no arguments and
// returns a promise that resolves when the server has stopped.
export default (routesRelativePath, options = {}) => {
	// for the option properties that weren't sent in, look for a config file
	// (either .reactserverrc or a reactServer section in a package.json). for
	// options neither passed in nor in a config file, use the defaults.
	options = mergeOptions(defaultOptions, findOptionsInFiles() || {}, options);

	setupLogging(options.logLevel, options.timingLogLevel, options.gaugeLogLevel);
	logProductionWarnings(options);

	return startImpl(routesRelativePath, options);
}

const startImpl = (routesRelativePath, {
		host,
		port,
		jsPort,
		hot,
		minify,
		compileOnly,
		jsUrl,
		https: httpsOptions,
		longTermCaching,
}) => {
	if ((httpsOptions.key || httpsOptions.cert || httpsOptions.ca) && httpsOptions.pfx) {
		throw new Error("If you set https.pfx, you can't set https.key, https.cert, or https.ca.");
	}

	const routesPath = path.resolve(process.cwd(), routesRelativePath);
	const routes = require(routesPath);

	const outputUrl = jsUrl || `${httpsOptions ? "https" : "http"}://${host}:${jsPort}/`;

	const {serverRoutes, compiler} = compileClient(routes, {
		routesDir: path.dirname(routesPath),
		hot,
		minify,
		outputUrl,
		longTermCaching,
	});

	if (compileOnly) {
		logger.notice("Starting compilation of client JavaScript...");
		compiler.run((err, stats) => {
			const error = handleCompilationErrors(err, stats);
			if (!error) {
				logger.notice("Successfully compiled client JavaScript.");
			} else {
				logger.error(error);
			}
		});
		// TODO: it's odd that this returns something different than the other branch;
		// should probably separate compile and start into two different exported functions.
		return null;
	} else {
		const startServers = (keys) => {
			// if jsUrl is set, we need to run the compiler, but we don't want to start a JS
			// server.
			let startJsServer = startDummyJsServer;

			if (!jsUrl) {
				// if jsUrl is not set, we need to start up a JS server, either hot load
				// or static.
				startJsServer = hot ? startHotLoadJsServer : startStaticJsServer;
			}

			logger.notice("Starting servers...")

			const jsServer = startJsServer(compiler, jsPort, longTermCaching, keys);
			const htmlServerPromise = serverRoutes.then(serverRoutesFile => startHtmlServer(serverRoutesFile, port, keys));

			return {
				stop: () => Promise.all([jsServer.stop(), htmlServerPromise.then(server => server.stop())]),
				started: Promise.all([jsServer.started, htmlServerPromise.then(server => server.started)])
					.then(() => logger.notice(`Ready for requests on port ${port}.`)),
			};
		}

		if (httpsOptions === true) {
			// if httpsOptions was true (and so didn't send in keys), generate keys.
			pem.createCertificate({days:1, selfSigned:true}, (err, keys) => {
				if (err) throw err;
				return startServers({key: keys.serviceKey, cert:keys.certificate});
			});
		} else if (httpsOptions) {
			// in this case, we assume that httpOptions is an object that can be passed
			// in to https.createServer as options.
			return startServers(httpsOptions);
		} else {
			// use http.
			return startServers();
		}
	}
	return null; // For eslint. :p
}

// given the server routes file and a port, start a react-server HTML server at
// http://localhost:port/. returns an object with two properties, started and stop;
// see the default function doc for explanation.
const startHtmlServer = (serverRoutes, port, httpsOptions) => {
	const server = express();
	const httpServer = httpsOptions ? https.createServer(httpsOptions, server) : http.createServer(server);
	return {
		stop: serverToStopPromise(httpServer),
		started: new Promise((resolve, reject) => {
			logger.info("Starting HTML server...");

			server.use(compression());
			reactServer.middleware(server, require(serverRoutes));

			httpServer.on('error', (e) => {
				console.error("Error starting up HTML server");
				console.error(e);
				reject(e);
			});
			httpServer.listen(port, (e) => {
				if (e) {
					reject(e);
					return;
				}
				logger.info(`Started HTML server over ${httpsOptions ? "HTTPS" : "HTTP"} on port ${port}`);
				resolve();
			});
		}),
	};
};

// given a webpack compiler and a port, compile the JavaScript code to static
// files and start up a web server at http://localhost:port/ that serves the
// static compiled JavaScript. returns an object with two properties, started and stop;
// see the default function doc for explanation.
const startStaticJsServer = (compiler, port, longTermCaching, httpsOptions) => {
	const server = express();
	const httpServer = httpsOptions ? https.createServer(httpsOptions, server) : http.createServer(server);
	return {
		stop: serverToStopPromise(httpServer),
		started: new Promise((resolve, reject) => {
			compiler.run((err, stats) => {
				const error = handleCompilationErrors(err, stats);
				if (error) {
					reject(error);
					return;
				}

				logger.debug("Successfully compiled static JavaScript.");
				// TODO: make this parameterized based on what is returned from compileClient
				server.use('/', compression(), express.static(`__clientTemp/build`, {
					maxage: longTermCaching ? '365d' : '0s',
				}));
				logger.info("Starting static JavaScript server...");

				httpServer.on('error', (e) => {
					console.error("Error starting up JS server");
					console.error(e);
					reject(e)
				});
				httpServer.listen(port, (e) => {
					if (e) {
						reject(e);
						return;
					}

					logger.info(`Started static JavaScript server over ${httpsOptions ? "HTTPS" : "HTTP"} on port ${port}`);
					resolve();
				});
			});
		}),
	};
};

// given a webpack compiler and a port, start a webpack dev server that is ready
// for hot reloading at http://localhost:port/. note that the webpack compiler
// must have been configured correctly for hot reloading. returns an object with
// two properties, started and stop; see the default function doc for explanation.
const startHotLoadJsServer = (compiler, port, longTermCaching, httpsOptions) => {
	logger.info("Starting hot reload JavaScript server...");
	const compiledPromise = new Promise((resolve) => compiler.plugin("done", () => resolve()));
	const jsServer = new WebpackDevServer(compiler, {
		noInfo: true,
		hot: true,
		headers: { 'Access-Control-Allow-Origin': '*' },
		https: !!httpsOptions,
		key: httpsOptions ? httpsOptions.key : undefined,
		cert: httpsOptions ? httpsOptions.cert : undefined,
		ca: httpsOptions ? httpsOptions.ca : undefined,
	});
	const serverStartedPromise = new Promise((resolve, reject) => {
		jsServer.listen(port, (e) => {
			if (e) {
				reject(e);
				return;
			}
			resolve();
		});
	});
	return {
		stop: serverToStopPromise(jsServer),
		started: Promise.all([compiledPromise, serverStartedPromise])
			.then(() => logger.info(`Started hot reload JavaScript server over ${httpsOptions ? "HTTPS" : "HTTP"} on port ${port}`)),
	};
};

// for when you need to run the JavaScript compiler (in order to get the chunk file
// names for the server routes file) but don't really want to actually up a JavaScript
// server. Supports the same signature as startStaticJsServer and startHotLoadJsServer,
// returning the same {stop, started} object.
const startDummyJsServer = (compiler /*, port, longTermCaching, httpsOptions*/) => {
	return {
		stop: () => Promise.resolve(),
		started: new Promise((resolve, reject) => compiler.run((err, stats)=> {
		// even though we aren't using the compiled code (we're pointing at jsUrl),
		// we still need to run the compilation to get the chunk file names.
			try {
				handleCompilationErrors(err, stats);
			} catch (e) {
				logger.emergency("Failed to compile the local code.", e.stack);
				reject(e);
				return;
			}
			resolve();
		})),
	};
};

// takes in the err and stats object returned by a webpack compilation and returns
// an error object if something serious happened, or null if things are ok.
const handleCompilationErrors = (err, stats) => {
	if (err) {
		logger.error("Error during webpack build.");
		logger.error(err);
		return new Error(err);
		// TODO: inspect stats to see if there are errors -sra.
	} else if (stats.hasErrors()) {
		logger.error("There were errors in the JavaScript compilation.");
		stats.toJson().errors.forEach((error) => {
			logger.error(error);
		});
		return new Error("There were errors in the JavaScript compilation.");
	} else if (stats.hasWarnings()) {
		logger.warning("There were warnings in the JavaScript compilation. Note that this is normal if you are minifying your code.");
		// for now, don't enumerate warnings; they are absolutely useless in minification mode.
		// TODO: handle this more intelligently, perhaps with a --reportwarnings flag or with different
		// behavior based on whether or not --minify is set.
	}
	return null;
}

// returns a method that can be used to stop the server. the returned method
// returns a promise to indicate when the server is actually stopped.
const serverToStopPromise = (server) => {
	return () => {
		return new Promise((resolve, reject) => {
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

const setupLogging = (logLevel, timingLogLevel, gaugeLogLevel) => {
	logging.setLevel('main',  logLevel);
	logging.setLevel('time',  timingLogLevel);
	logging.setLevel('gauge', gaugeLogLevel);
}

const logProductionWarnings = ({hot, minify, jsUrl, longTermCaching}) => {
	// if the server is being launched with some bad practices for production mode, then we
	// should output a warning. if arg.jsurl is set, then hot and minify are moot, since
	// we aren't serving JavaScript & CSS at all.
	if ((!jsUrl && (hot || !minify)) ||  process.env.NODE_ENV !== "production" || !longTermCaching) { //eslint-disable-line no-process-env
		logger.warning("PRODUCTION WARNING: the following current settings are discouraged in production environments. (If you are developing, carry on!):");
		if (hot) {
			logger.warning("-- Hot reload is enabled. To disable, set hot to false (--hot=false at the command-line) or set NODE_ENV=production.");
		}

		if (!minify) {
			logger.warning("-- Minification is disabled. To enable, set minify to true (--minify at the command-line) or set NODE_ENV=production.");
		}

		if (!longTermCaching) {
			logger.warning("-- Long-term caching is disabled. To enable, set longTermCaching to true (--long-term-caching at the command-line) or set NODE_ENV=production to turn on.");
		}

		if (process.env.NODE_ENV !== "production") { //eslint-disable-line no-process-env
			logger.warning("-- NODE_ENV is not set to \"production\".");
		}
	}

}
