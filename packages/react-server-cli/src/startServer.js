"use strict";

import triton from "react-server"
import http from "http"
import express from "express"
import path from "path"
import compression from "compression"
import webpack from "webpack"
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
	} = {}) {

	const routesPath = path.join(process.cwd(), routesRelativePath);
	const routes = require(routesPath);
	const outputUrl = jsUrl || `http://localhost:${jsPort}/`;

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
		const startJsServer = hot ? startHotLoadJsServer : startStaticJsServer;

		logger.notice("Starting servers...")
		Promise.all([
			jsUrl ? Promise.resolve() : startJsServer(compiler, jsPort),
			startHtmlServer(serverRoutes, port)
		])
			.then(
				() => logger.notice(`Ready for requests on port ${port}.`),
				() => process.exit(1)
			);
	}
}

const startHtmlServer = (serverRoutes, port) => {
	logger.info("Starting HTML server...");

	const server = express();
	server.use(compression());
	triton.middleware(server, require(serverRoutes));

	http.createServer(server).listen(port, function () {
		logger.info(`Started HTML server on port ${port}`);
	});
};

const startStaticJsServer = (compiler, port) => {
	return new Promise((resolve, reject) => {
		compiler.run(function(err, stats) {
			handleCompilationErrors(err, stats);

		    logger.debug("Successfully compiled static JavaScript.");
    		// TODO: make this parameterized based on what is returned from compileClient
    		let server = express();
			server.use('/', compression(), express.static('__clientTemp/build'));
			logger.info("Starting static JavaScript server...");

			http.createServer(server).listen(port, function() {
				logger.info(`Started static JavaScript server on port ${port}`);
				resolve();
			});
		});
	});
};

const startHotLoadJsServer = (compiler, port) => {
	logger.info("Starting hot reload JavaScript server...");
	const compiledPromise = new Promise((resolve, reject) => compiler.plugin("done", () => resolve()));
	const jsServer = new WebpackDevServer(compiler, {
		noInfo: true,
		hot: true,
		headers: { 'Access-Control-Allow-Origin': '*' },
	});
	const serverStartedPromise = new Promise((resolve, reject) => {
		jsServer.listen(port, () => resolve() );
	});
	return Promise.all([compiledPromise, serverStartedPromise])
		.then(() => logger.info(`Started hot reload JavaScript server on port ${port}`));
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
