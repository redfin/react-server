import parseCliArgs from "./parseCliArgs"

// weirdly, we parse the args twice. the first time we are just looking for --production, which
// affects the default values for the other args.
const isProduction = parseCliArgs(false).production || (process.env.NODE_ENV === "production");
// now if production was sent in on the command line, let's set NODE_ENV if it's unset.
if (isProduction && !process.env.NODE_ENV) {
	process.env.NODE_ENV = "production";
}
const argv = parseCliArgs(isProduction);

// TODO: do we need a post-processor for logger here?
// these require calls are after the argument parsing because we want to set NODE_ENV
// before they get loaded.
const logging = require("react-server").logging,
	logger = logging.getLogger({name: "react-server-cli/index.js", color: {server: 9}}),
	startServer = require("./startServer").default;

// Logging setup. This typically wouldn't be handled here,
// but the application integration stuff isn't part of this project
logging.setLevel('main',  argv.loglevel);
if (!isProduction) {
	logging.setLevel('time',  'fast');
	logging.setLevel('gauge', 'ok');
}

// if the server is being launched with some bad practices for production mode, then we
// should output a warning. if arg.jsurl is set, then hot and minify are moot, since
// we aren't serving JavaScript & CSS at all.
if ((!argv.jsurl && (argv.hot || !argv.minify)) ||  process.env.NODE_ENV !== "production") {
	logger.warning("PRODUCTION WARNING: the following current settings are discouraged in production environments. (If you are developing, carry on!):");
	if (argv.hot) {
		logger.warning("-- Hot reload is enabled. Pass --hot=false, pass --production, or set NODE_ENV=production to turn off.");
	}

	if (!argv.minify) {
		logger.warning("-- Minification is disabled. Pass --minify, pass --production, or set NODE_ENV=production to turn on.");
	}

	if (process.env.NODE_ENV !== "production") {
		logger.warning("-- NODE_ENV is not set to \"production\".");
	}
}

startServer(argv.routes, {
	port: argv.port,
	jsPort: argv.jsPort,
	hot: argv.hot,
	minify: argv.minify,
	compileOnly: argv.compileonly,
	jsUrl: argv.jsurl,
});
