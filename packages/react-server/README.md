<img src="https://raw.githubusercontent.com/redfin/react-server/master/images/reactserver_logo%402x.png" width="450px"/>

[![Build Status][build-badge-img]][build-url]
[![NPM version][npm-version-img]][npm-url]
[![NPM downloads per month][npm-downloads-img]][npm-url]
[![NPM license][npm-license-img]][npm-url]
[![Powered by Redfin][redfin-img]][redfin-url]

React framework with server render for blazing fast page load and seamless
transitions between pages in the browser.

** **

## What is it?

`react-server` is an [Express](http://expressjs.com/) [middleware](http://expressjs.com/guide/using-middleware.html)
for serving universal (isomorphic) JavaScript applications built with [React](https://facebook.github.io/react/)
based on the [Flux pattern](https://facebook.github.io/flux/docs/overview.html).  
Read more on [our dev blog](https://www.redfin.com/devblog/2015/09/thoughts-on-transitioning-to-universal-javascript.html).

## Getting started
1. Install node.js.	We recommend installing node v4.2.3 with [n](https://github.com/tj/n).
	See their [installation instructions](https://github.com/tj/n#installation) and [usage](https://github.com/tj/n#usage) for more details, or just close your eyes and jump:

		npm install -g n && n 4.2.3

2. Create a new npm project folder with some basic folders:
		mkdir example-react-server && cd example-react-server
		mkdir pages

3. Create a new npm project (follow the helpful npm prompts).
		npm init

4. Install react-server and its related dependencies

		npm install --save react-server express react

5. Create a page object:
		touch pages/HelloWorld.js

	And add the page class:

		"use strict";

		var React = require("react");

		// TODO: jsx support
		module.exports = class HelloWorldPage {
			getElements() {
				return React.createElement("div", null, "Hello, World!");
			}
		}

6. Create the routes:
		touch routes.js

	And add a HelloWorld route:

		"use strict"

		let HelloWorldPage = require("./pages/HelloWorld");

		module.exports = {
			// react-server middleware.  TODO: add a "writing react-server middleware" example.
			middleware: [],

			routes: {
				// This name isn't used for anything, it just needs to be unique.
				Simple: {
					// The relative path that this route responds to; so for an Express
					// instance on 127.0.0.1 port 3000, respond to http://127.0.0.1/
					path: ['/'],
					// The http verb to respond to, e.g. get, put, post, patch, delete.
					// This is optional, and defaults to 'get'.
					method: 'get',
					page: function () {
						// TODO: returning an invalid object here (for instance, returning
						// `(cb) => cb(HelloWorldPage)`) in a page makes it spin indefinitely
						// but never throws an error.
						return {
							// TODO: Allow promises in addition to callbacks.
							// i.e. return { promise: new promise((reject, resolve) => resolve(HelloWorldPage))}
							done: function (cb) {
								cb(HelloWorldPage);
							}
						};
					}
				},
			}
		}

7. Create the server:

		touch server.js

	And add the minimal server logic:

		// "use strict" required to use `class` and `let`, but not strictly required
		// for using react-server.
		"use strict";

		// Require dependencies
		let rs = require("react-server"),
			http = require("http"),
			express = require("express"),
			routes = require("./routes");

		// TODO: Move this into rs.setConfig()
		process.env.REACT_SERVER_CONFIGS = __dirname;

		// By instantiating Express directly, you can use other Express middleware,
		// or even multiple instances of react-server middleware.
		let server = express();

		// Register react-server as an Express middleware.
		rs.middleware(server, routes);

		// Use process.env.PORT if it's been set elsewhere, or 3000 if it hasn't.
		// This allows you to set process.env.PORT to a different value in production
		// without having to set it in development.
		let port = process.env.PORT || 3000;
		console.log("Start server...");

		// Feature: we should go down on ^D as well as ^C
		// Bug: (node) OutgoingMessage.flush is deprecated. Use flushHeaders instead.
		// Start the server and listen on port.
		let httpServer = http.createServer(server).listen(port, function () {
			console.log("Started!");
		});

		console.log('Listening on port ' + port);

8. Start the server:

		node server.js

9. Load the page in your browser, either by opening your favorite browser and
navigating to http://localhost:3000, or by opening it in your default browser from the command line:

		open http://localhost:3000

## Contributing
We welcome contributions to react-server!  To contribute, follow these steps:

[build-badge-img]: https://travis-ci.org/redfin/react-server.svg?branch=master
[build-url]: https://travis-ci.org/redfin/react-server
[npm-url]: https://npmjs.org/package/react-server
[redfin-url]: https://www.redfin.com
[redfin-img]: https://img.shields.io/badge/Powered%20By-Redfin-c82021.svg
[npm-version-img]: https://badge.fury.io/js/react-server.svg
[npm-license-img]: https://img.shields.io/npm/l/react-server.svg
[npm-downloads-img]: https://img.shields.io/npm/dm/react-server.svg
