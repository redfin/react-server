require("babel-core/register");

const {start, parseCliArgs} = require(".");

start(parseCliArgs());
