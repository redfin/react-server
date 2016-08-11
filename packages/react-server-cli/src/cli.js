require("babel-core/register");

const cli = require(".");

cli.run(cli.parseCliArgs());
