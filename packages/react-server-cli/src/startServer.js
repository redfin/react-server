import triton from "react-server"
import http from "http"
import https from "https"
import express from "express"
import path from "path"
import pem from "pem"
import compression from "compression"
import WebpackDevServer from "webpack-dev-server"
import compileClient from "./compileClient"

const logging = triton.logging;
// TODO: do we need a post-processor here?
const logger = logging.getLogger({name: "react-server-cli/startServer.js", color: {server: 9}});

export default function(routesRelativePath, {
		port = 3000,
		jsPort = 3001,
		hot = true,
		minify = false,
		compileOnly = false,
		jsUrl,
		httpsOptions = true,
	} = {}) {

	const routesPath = path.join(process.cwd(), routesRelativePath);
	const routes = require(routesPath);
	const outputUrl = jsUrl || `${httpsOptions ? "https" : "http"}://localhost:${jsPort}/`;

	const {serverRoutes, compiler} = compileClient(routes, {
		routesDir: path.dirname(routesPath),
		hot,
		minify,
		outputUrl: compileOnly ? null : outputUrl, // when compiling, never bind the resulting JS to a URL.
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
				startHtmlServer(serverRoutes, port, keys),
			])
			.then(
				() => logger.notice(`Ready for requests on port ${port}.`),
				(e) => {throw e}
			);
		}

		if (httpsOptions) {
			pem.createCertificate({days:1, selfSigned:true}, (err, keys) => {
				if (err) throw err;
				startServers({key: keys.serviceKey, cert:keys.certificate});
			});
		} else {
			startServers();
		}
	}
}

const startHtmlServer = (serverRoutes, port, {key, cert} = {}) => {
	return new Promise((resolve) => {
		logger.info("Starting HTML server...");

		const server = express();
		server.use(compression());
		triton.middleware(server, require(serverRoutes));

		if (key && cert) {
			https.createServer({key, cert}, server).listen(port, () => {
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

const startStaticJsServer = (compiler, port, {key, cert} = {}) => {
	return new Promise((resolve) => {
		compiler.run(function(err, stats) {
			handleCompilationErrors(err, stats);

			logger.debug("Successfully compiled static JavaScript.");
			// TODO: make this parameterized based on what is returned from compileClient
			let server = express();
			server.use('/', compression(), express.static('__clientTemp/build'));
			logger.info("Starting static JavaScript server...");

			if (key && cert) {
				https.createServer({key, cert}, server).listen(port, () => {
					logger.info(`Started static JavaScript server over HTTPS on port ${port}`);
					resolve();
				});
			} else {
				http.createServer(server).listen(port, function() {
					logger.info(`Started static JavaScript server over HTTP on port ${port}`);
					resolve();
				});
			}
		});
	});
};

const startHotLoadJsServer = (compiler, port, httpsOptions) => {
	logger.info("Starting hot reload JavaScript server...");
	const compiledPromise = new Promise((resolve) => compiler.plugin("done", () => resolve()));
	const jsServer = new WebpackDevServer(compiler, {
		noInfo: true,
		hot: true,
		headers: { 'Access-Control-Allow-Origin': '*' },
		https: httpsOptions,
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
