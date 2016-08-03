require("babel-core/register");

const {run, parseCliArgs} = require(".");

run(parseCliArgs());
