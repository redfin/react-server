// these are the default options for startServer.
export default {
	port:3000,
	jsPort: 3001,
	hot: true,
	minify: false,
	compileOnly: false,
	logLevel: "debug",
	timingLogLevel: "fast",
	gaugeLogLevel: "ok",
	env: {
		production: {
			hot: false,
			minify: true,
			logLevel: "notice",
			timingLogLevel: "none",
			gaugeLogLevel: "no",
		},
	},
}
