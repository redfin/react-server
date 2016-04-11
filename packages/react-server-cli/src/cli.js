import parseCliArgs from "./parseCliArgs"
import fs from "fs"

// weirdly, we parse the args twice. the first time we are just looking for --production, which
// affects the default values for the other args.
const isProduction = parseCliArgs(false).production || (process.env.NODE_ENV === "production"); //eslint-disable-line no-process-env
// now if production was sent in on the command line, let's set NODE_ENV if it's unset.
if (isProduction && !process.env.NODE_ENV) { //eslint-disable-line no-process-env
	process.env.NODE_ENV = "production"; //eslint-disable-line no-process-env
}
const argv = parseCliArgs(isProduction);

// these require calls are after the argument parsing because we want to set NODE_ENV
// before they get loaded.
const logging = require("react-server").logging,
	logger = logging.getLogger(__LOGGER__),
	start = require(".").start;

// Logging setup. This typically wouldn't be handled here,
// but the application integration stuff isn't part of this project
logging.setLevel('main',  argv.logLevel);
if (!isProduction) {
	logging.setLevel('time',  'fast');
	logging.setLevel('gauge', 'ok');
}

if (argv.https && (argv.httpsKey || argv.httpsCert || argv.httpsCa || argv.httpsPfx || argv.httpsPassphrase)) {
	throw new Error("If you set https to true, you must not set https-key, https-cert, https-ca, https-pfx, or https-passphrase.");
}
if ((argv.httpsKey || argv.httpsCert || argv.httpsCa) && argv.httpsPfx) {
	throw new Error("If you set https-pfx, you can't set https-key, https-cert, or https-ca.");
}

if (argv.httpsKey || argv.httpsCert || argv.httpsCa || argv.httpsPfx || argv.httpsPassphrase) {
	argv.https = {
		key: argv.httpsKey ? fs.readFileSync(argv.httpsKey) : undefined,
		cert: argv.httpsCert ? fs.readFileSync(argv.httpsCert) : undefined,
		ca: argv.httpsCa ? fs.readFileSync(argv.httpsCa) : undefined,
		pfx: argv.httpsPfx ? fs.readFileSync(argv.httpsPfx) : undefined,
		passphrase: argv.httpsPassphrase,
	}
}

// if the server is being launched with some bad practices for production mode, then we
// should output a warning. if arg.jsurl is set, then hot and minify are moot, since
// we aren't serving JavaScript & CSS at all.
if ((!argv.jsUrl && (argv.hot || !argv.minify)) ||  process.env.NODE_ENV !== "production") { //eslint-disable-line no-process-env
	logger.warning("PRODUCTION WARNING: the following current settings are discouraged in production environments. (If you are developing, carry on!):");
	if (argv.hot) {
		logger.warning("-- Hot reload is enabled. Pass --hot=false, pass --production, or set NODE_ENV=production to turn off.");
	}

	if (!argv.minify) {
		logger.warning("-- Minification is disabled. Pass --minify, pass --production, or set NODE_ENV=production to turn on.");
	}

	if (process.env.NODE_ENV !== "production") { //eslint-disable-line no-process-env
		logger.warning("-- NODE_ENV is not set to \"production\".");
	}
}

start(argv.routes, argv);
