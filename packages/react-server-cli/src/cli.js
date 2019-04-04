require("babel-core/register");

const cli = require(".");
cli.parseCliArgs().then((options) => {
	const commandResult = cli.run(options);
	return (options.command === "start") ? commandResult.started : commandResult;
}).catch(console.error);
