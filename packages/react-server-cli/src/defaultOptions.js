// these are the default options for startServer.
// host: the hostname for the server.
// port: the port number for the server.
// jsPort: the port number for JavaScript and CSS on the server.
// hot: enable hot reloading. do not use in production.
// minify: minify the client-side JavaScript.
// compileOnStartup: start up a server without compiling the client-side JavaScript; this expects that you have already
//   run the compile command prior to starting (i.e. in a production environment where build and run times are separated).
// jsUrl: serve up the HTML, but don't serve up the JavaScript and CSS; instead point the
//   JS & CSS URLs at this URL.
// logLevel: the level of logging to use.
// https: if falsey, serve the content over HTTP. if true, serve the content over HTTPS
//   with a self-signed certificate. if an object, it can include any of the options that can
//   be passed to https.createServer.
export default {
	host: "0.0.0.0",
	port: 3000,
	jsPort: 3001,
	bindIp: "0.0.0.0",
	hot: true,
	minify: false,
	compileOnStartup: true,
	logLevel: "debug",
	timingLogLevel: "fast",
	gaugeLogLevel: "ok",
	https: false,
	longTermCaching: false,
	routesFile: "./routes.json",
	env: {
		production: {
			hot: false,
			minify: true,
			logLevel: "notice",
			longTermCaching: true,
			timingLogLevel: "none",
			gaugeLogLevel: "no",
		},
	},
}
