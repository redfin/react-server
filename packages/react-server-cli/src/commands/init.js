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
	"react@^15.4.1",
	"react-dom@^15.4.1",
	"superagent@1.8.4",
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
		console.log(chalk.yellow("No package.json found.  Running `npm init --yes`"));
		spawnSync("npm", ["init", "--yes"], {stdio: "inherit"});
	}

	Object.keys(CONFIG).forEach(fn => {
		if (fileExists(fn)) {
			throw new ConfigurationError(`Found a pre-existing ${fn}.  Aborting.`);
		}
	});

	console.log(chalk.yellow("Installing dependencies"));

	spawnSync("npm", ["install", "--save", ...DEPENDENCIES], {stdio: "inherit"});

	console.log(chalk.yellow("Installing devDependencies"));

	_.forEach(CONFIG, (config, fn) => {
		console.log(chalk.yellow("Generating " + fn));

		fs.writeFileSync(fn, JSON.stringify(config, null, "  ") + "\n");
	});

	console.log(chalk.green("All set!"));
}
