import _ from "lodash";
import fs from "fs";
import {spawnSync} from "child_process";
import chalk from "chalk";
import fileExists from "../fileExists";
import ConfigurationError from "../ConfigurationError";

const DEPENDENCIES = [
	"react-server",
	"babel-preset-react-server",

	// TODO: Modernize our peer deps and remove versions here.
	"superagent@1.2.0",
	"react@~0.14.2",
	"react-dom@~0.14.2",
]

const DEV_DEPENDENCIES = [

	// TODO: These, too.
	"webpack-dev-server@~1.13.0",
	"webpack@^1.13.1",
]

const CONFIG = {
	"routes.json": {
		middleware: [],
		routes: {},
	},
	".reactserverrc": {
		routesFile: "routes.json",
		port: 3000,
		env: {
			production: {
				port: 80,
			},
		},
	},
	".babelrc": {
		presets: ["react-server"],
	},
}

export default function init(){

	if (!fileExists("package.json")) {
		throw new ConfigurationError("Missing package.json.  Please run `npm init` first.");
	}

	Object.keys(CONFIG).forEach(fn => {
		if (fileExists(fn)) {
			throw new ConfigurationError(`Found a pre-existing ${fn}.  Aborting.`);
		}
	});

	console.log(chalk.yellow("Installing dependencies"));

	spawnSync("npm", ["install", "--save", ...DEPENDENCIES], {stdio: "inherit"});

	console.log(chalk.yellow("Installing devDependencies"));

	spawnSync("npm", ["install", "--save-dev", ...DEV_DEPENDENCIES], {stdio: "inherit"});

	_.forEach(CONFIG, (config, fn) => {
		console.log(chalk.yellow("Generating " + fn));

		fs.writeFileSync(fn, JSON.stringify(config, null, "  ") + "\n");
	});

	console.log(chalk.green("All set!"));
}
