import _ from "lodash";
import fs from "fs";
import { join } from "path";
import chalk from "chalk";
import mkdirp from "mkdirp";
import fileExists from "../fileExists";
import ConfigurationError from "../ConfigurationError";

const PAGE_SOURCE = _.template(`
import React from "react";

export default class <%= className %> {
	handleRoute(next) {
		// Kick off data requests here.
		return next();
	}

	getElements() {
		return <div>This is <%= className %>.</div>
	}
}
`);

export default function addPage(options) {
	const { routesFile, routesPath, routes } = options;

	const path = options._[3];
	const className = options._[4];

	if (!path || !className) {
		throw new ConfigurationError("Usage: react-server add-page <urlPath> <ClassName>");
	}

	const page = join("pages", className + ".js");

	if (fileExists(page)) {
		throw new ConfigurationError(`Found a pre-existing ${page}.  Aborting.`);
	}

	mkdirp("pages");

	console.log(chalk.yellow("Generating " + page));

	fs.writeFileSync(page, PAGE_SOURCE({ className }));

	routes.routes[className] = { path, page };

	console.log(chalk.yellow("Updating " + routesFile));

	fs.writeFileSync(routesPath, JSON.stringify(routes, null, "  ") + "\n");

	console.log(chalk.green("All set!"));
}
