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

// start up a react-server instance.
export default (routesRelativePath, options = {}) => {
	// for the option properties that weren't sent in, look for a config file
	// (either .reactserverrc or a reactServer section in a package.json). for
	// options neither passed in nor in a config file, use the defaults.
	options = mergeOptions(defaultOptions, findOptionsInFiles() || {}, options);

	setupLogging(options.logLevel);
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

	const routesPath = path.join(process.cwd(), routesRelativePath);
	const routes = require(routesPath);
	const outputUrl = jsUrl || `${httpsOptions ? "https" : "http"}://${host}:${jsPort}/`;

	const {serverRoutes, compiler} = compileClient(routes, {
		routesDir: path.dirname(routesPath),
		hot,
		minify,
		outputUrl: compileOnly ? null : outputUrl, // when compiling, never bind the resulting JS to a URL.
		longTermCaching,
	});

	if (compileOnly) {
		logger.notice("Starting compilation of client JavaScript...");
		compiler.run((err, stats) => {
			handleCompilationErrors(err, stats);
			logger.notice("Successfully compiled client JavaScript.");
		});
	} else {
		const startServers = (keys) => {
			const startJsServer = hot ? startHotLoadJsServer : startStaticJsServer;

			logger.notice("Starting servers...")
			Promise.all([
				jsUrl ? Promise.resolve() : startJsServer(compiler, jsPort, keys),
				serverRoutes.then(serverRoutesFile => startHtmlServer(serverRoutesFile, port, keys)),
			])
			.then(
				() => logger.notice(`Ready for requests on port ${port}.`),
				(e) => { throw e; }
			);
		}

		if (httpsOptions === true) {
			// if httpsOptions was true (and so didn't send in keys), generate keys.
			pem.createCertificate({days:1, selfSigned:true}, (err, keys) => {
				if (err) throw err;
				startServers({key: keys.serviceKey, cert:keys.certificate});
			});
		} else if (httpsOptions) {
			// in this case, we assume that httpOptions is an object that can be passed
			// in to https.createServer as options.
			startServers(httpsOptions);
		} else {
			// use http.
			startServers();
		}
	}
}

// given the server routes file and a port, start a react-server HTML server at
// http://localhost:port/. returns a promise that resolves when the server has
// started.
const startHtmlServer = (serverRoutes, port, httpsOptions) => {
	return new Promise((resolve) => {
		logger.info("Starting HTML server...");

		const server = express();
		server.use(compression());
		reactServer.middleware(server, require(serverRoutes));

		if (httpsOptions) {
			https.createServer(httpsOptions, server).listen(port, () => {
				logger.info(`Started HTML server over HTTPS on port ${port}`);
				resolve();
			});
		} else {
			http.createServer(server).listen(port, () => {
				logger.info(`Started HTML server over HTTP on port ${port}`);
				resolve();
			});
		}
	});
};

// given a webpack compiler and a port, compile the JavaScript code to static
// files and start up a web server at http://localhost:port/ that serves the
// static compiled JavaScript. returns a promise that resolves when the server
// has started.
const startStaticJsServer = (compiler, port, httpsOptions) => {
	return new Promise((resolve) => {
		compiler.run((err, stats) => {
			handleCompilationErrors(err, stats);

			logger.debug("Successfully compiled static JavaScript.");
			// TODO: make this parameterized based on what is returned from compileClient
			let server = express();
			server.use('/', compression(), express.static('__clientTemp/build'));
			logger.info("Starting static JavaScript server...");

			if (httpsOptions) {
				https.createServer(httpsOptions, server).listen(port, () => {
					logger.info(`Started static JavaScript server over HTTPS on port ${port}`);
					resolve();
				});
			} else {
				http.createServer(server).listen(port, () => {
					logger.info(`Started static JavaScript server over HTTP on port ${port}`);
					resolve();
				});
			}
		});
	});
};

// given a webpack compiler and a port, start a webpack dev server that is ready
// for hot reloading at http://localhost:port/. note that the webpack compiler
// must have been configured correctly for hot reloading. returns a promise that
// resolves when the server has started.
const startHotLoadJsServer = (compiler, port, httpsOptions) => {
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
	const serverStartedPromise = new Promise((resolve) => {
		jsServer.listen(port, () => resolve() );
	});
	return Promise.all([compiledPromise, serverStartedPromise])
		.then(() => logger.info(`Started hot reload JavaScript server over ${httpsOptions ? "HTTPS" : "HTTP"} on port ${port}`));
};

const handleCompilationErrors = (err, stats) => {
	if(err) {
		logger.error("Error during webpack build.");
		logger.error(err);
		throw new Error(err);
		// TODO: inspect stats to see if there are errors -sra.
	} else if (stats.hasErrors()) {
		logger.error("There were errors in the JavaScript compilation.");
		stats.toJson().errors.forEach((error) => {
			logger.error(error);
		});
		throw new Error("There were errors in the JavaScript compilation.");
	} else if (stats.hasWarnings()) {
		logger.warning("There were warnings in the JavaScript compilation. Note that this is normal if you are minifying your code.");
		// for now, don't enumerate warnings; they are absolutely useless in minification mode.
		// TODO: handle this more intelligently, perhaps with a --reportwarnings flag or with different
		// behavior based on whether or not --minify is set.
	}
}

const setupLogging = (logLevel) => {
	logging.setLevel('main',  logLevel);
	// TODO: the time and gauge log levels should also be parameters.
	if (process.env.NODE_ENV !== "production") { //eslint-disable-line no-process-env
		logging.setLevel('time',  'fast');
		logging.setLevel('gauge', 'ok');
	}
}

const logProductionWarnings = ({hot, minify, jsUrl}) => {
	// if the server is being launched with some bad practices for production mode, then we
	// should output a warning. if arg.jsurl is set, then hot and minify are moot, since
	// we aren't serving JavaScript & CSS at all.
	if ((!jsUrl && (hot || !minify)) ||  process.env.NODE_ENV !== "production") { //eslint-disable-line no-process-env
		logger.warning("PRODUCTION WARNING: the following current settings are discouraged in production environments. (If you are developing, carry on!):");
		if (hot) {
			logger.warning("-- Hot reload is enabled. Set hot to false or set NODE_ENV=production to turn off.");
		}

		if (!minify) {
			logger.warning("-- Minification is disabled. Set minify to true or set NODE_ENV=production to turn on.");
		}

		if (process.env.NODE_ENV !== "production") { //eslint-disable-line no-process-env
			logger.warning("-- NODE_ENV is not set to \"production\".");
		}
	}

}
