require("babel-core/register");

const cli = require(".");

cli.parseCliArgs().then(args => {
	cli.run(args);
});
