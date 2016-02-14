import yargs from "yargs"

export default (isProduction, args = process.argv) => {
	return yargs(args)
		.usage('Usage: $0 [options]')
		.option("routes", {
			default: "./routes.js",
			describe: "The routes file to load.",
		})
		.option("p", {
			alias: "port",
			default: 3000,
			describe: "Port to start listening for react-server",
			type: "number",
		})
		.option("jsPort", {
			default: 3001,
			describe: "Port to start listening for react-server's JavaScript",
			type: "number",
		})
		.option("h", {
			alias: "hot",
			default: !isProduction,
			describe: "Load the app so that it can be hot reloaded in the browser. Default is false in production mode, true otherwise.",
			type: "boolean",
		})
		.option("m", {
			alias: "minify",
			default: isProduction,
			describe: "Optimize client JS when option is present. Takes a bit longer to compile. Default is true in production mode, false otherwise.",
			type: "boolean",
		})
		.option("loglevel", {
			default: isProduction ? "notice" : "debug",
			describe: "Set the severity level for the logs being reported. Values are, in ascending order of severity: 'debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'. Default is 'notice' in production mode, 'debug' otherwise.",
			type: "string",
		})
		.option("compileonly", {
			default: false,
			describe: "Compile the client JavaScript only, and don't start any servers. This is what you want to do if you are building the client JavaScript to be hosted on a CDN. Unless you have a very specific reason, it's almost alway a good idea to only do this in production mode. Defaults to false.",
			type: "boolean",
		})
		.option("jsurl", {
			describe: "A URL base for the pre-compiled client JavaScript. Setting a value for jsurl means that react-server-cli will not compile the client JavaScript at all, and it will not serve up any JavaScript. Obviously, this means that --jsurl overrides all of the options related to JavaScript compilation: --hot, --minify, and --bundleperroute.",
			type: "string",
		})
		.option("production", {
			default: false,
			describe: "Forces production mode. If this is not set (or set to false), the CLI falls back to NODE_ENV to determine what mode we are in. Note that production mode only affects the default settings for other options; individual options can still be overridden by setting them directly.",
			type: "boolean",
		})
		.help('?')
		.alias('?', 'help')
		.demand(0)
		.argv;
}
