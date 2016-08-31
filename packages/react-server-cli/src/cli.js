require("babel-core/register");

const cli = require(".");
cli.parseCliArgs().then(cli.run);
