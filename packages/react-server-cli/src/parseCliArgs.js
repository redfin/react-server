import yargs from "yargs"

export default (args = process.argv) => {
	var parsedArgs = yargs(args)
		.usage('Usage: $0 [options]')
		.option("routes", {
			default: "./routes.js",
			describe: "The routes file to load.",
		})
		.option("p", {
			alias: "port",
			describe: "Port to start listening for react-server. Default is 3000.",
			type: "number",
		})
		.option("js-port", {
			describe: "Port to start listening for react-server's JavaScript. Default is 3001.",
			type: "number",
		})
		.option("h", {
			alias: "hot",
			describe: "Load the app so that it can be hot reloaded in the browser. Default is false in production mode, true otherwise.",
			// we use undefined as the default because unlike other types, booleans
			// default to "false", making it impossible to distinguish between not
			// setting the option at the command line and setting --option=false.
			default: undefined,
			type: "boolean",
		})
		.option("m", {
			alias: "minify",
			describe: "Optimize client JS when option is present. Takes a bit longer to compile. Default is true in production mode, false otherwise.",
			default: undefined,
			type: "boolean",
		})
		.option("log-level", {
			describe: "Set the severity level for the logs being reported. Values are, in ascending order of severity: 'debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'. Default is 'notice' in production mode, 'debug' otherwise.",
			type: "string",
		})
		.option("compile-only", {
			describe: "Compile the client JavaScript only, and don't start any servers. This is what you want to do if you are building the client JavaScript to be hosted on a CDN. Unless you have a very specific reason, it's almost alway a good idea to only do this in production mode. Defaults to false.",
			default: undefined,
			type: "boolean",
		})
		.option("js-url", {
			describe: "A URL base for the pre-compiled client JavaScript. Setting a value for jsurl means that react-server-cli will not compile the client JavaScript at all, and it will not serve up any JavaScript. Obviously, this means that --jsurl overrides all of the options related to JavaScript compilation: --hot, --minify, and --bundleperroute.",
			type: "string",
		})
		.help('?')
		.alias('?', 'help')
		.demand(0)
		.argv;

	// we remove all the options that have undefined as their value; those are the
	// ones that weren't on the command line, and we don't want them to override
	// defaults or config files.
	return camelize(removeUndefinedValues(parsedArgs));
}

const removeUndefinedValues = (input) => {
	const result = Object.assign({}, input);

	for (let key of Object.keys(input)) {
		if (result[key] === undefined) {
			delete result[key];
		}
	}

	return result;
}

const camelize = (input) => {
	const inputCopy = Object.assign({}, input)

	const replaceFn = (match, character) => { return character.toUpperCase() }
	for (let key in Object.keys(inputCopy)) {
		if (key.indexOf("-") !== -1) {
			const newKey = key.replace(/-(.)/g, replaceFn);
			inputCopy[newKey] = inputCopy[key];
			delete inputCopy[key];
		}
	}

	return inputCopy;
}
