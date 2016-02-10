/* eslint-disable no-process-env */

const server = require("react-server"),
	http = require("http"),
	express = require("express"),
	routes = require("./routes");

process.env.REACT_SERVER_CONFIGS = __dirname;

const wrapped = express();
server.middleware(wrapped, routes);

const port = process.env.PORT || 3000;
console.log("Start server...");

http.createServer(wrapped).listen(port, function () {
	console.log("Started!");
});

console.log("Listening on port " + port);
