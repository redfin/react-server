# react-server [![NPM version][npm-badge-img]][npm-url]

react-server is an [Express](http://expressjs.com/) [middleware](http://expressjs.com/guide/using-middleware.html)
for serving universal (isomorphic) JavaScript applications built with [React](https://facebook.github.io/react/)
based on the [Flux pattern](https://facebook.github.io/flux/docs/overview.html).  
react-server is closest in its implementation to [reflux](https://github.com/reflux/refluxjs)
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
					// The http verb to respond to, e.g. get, put, post, patch, delete
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
		process.env.TRITON_CONFIGS = __dirname;

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

1. Check out the code.  You'll want to [fork the repository](https://help.github.com/articles/fork-a-repo/),
 and then clone it locally.

2. Make your changes!

3. Write some tests. See [the testing guide](/core/test/README.md).

4. Make sure _all_ the tests pass!
		gulp test

5. Make sure you've followed our style guide.  The style guide is codified as eslint
 rules in [package.json](package.json).  You can read more about what those rules
 do on the [eslint rules page](http://eslint.org/docs/rules/), or with a combination
 of matching the style of the rest of the project and trial and error.
		gulp eslint

6. Create a [pull request](https://help.github.com/articles/using-pull-requests/)

7. Repeat zero or more times: Get some feedback from [another contributor](https://github.com/redfin/react-server/graphs/contributors),
 resolve it, update your pull request.

8. Your pull request gets merged!  Congratulations, you're officially a react-server contributor.
 Have a 🍺to celebrate; your check is in the mail, we swear 😉.

// TODO: Concepts
// TODO: routing guide
// TODO: page guide
// TODO: generator 

## What is "triton"? Why do I see that in code comments?

Back when we started this project, we came up with a great name -- `triton` -- and we started using it internally. And then it took us forever to get around to making the source code public. And then [Joyent](https://www.joyent.com) released a product called `triton` and stole our thunder, so we had to go with `react-server` instead (a terrible, terrible tragedy, we know). It has always seemed like a preeeety big coincidence to us that they were first to market with a product named `triton`, and they are also one floor above our San Francisco engineering office...

[npm-badge-img]: https://badge.fury.io/js/react-server.png
[npm-url]: https://npmjs.org/package/react-server
