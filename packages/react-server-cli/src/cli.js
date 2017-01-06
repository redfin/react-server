const fs = require("fs");
const path = require("path");
const cli = require(".");

cli.parseCliArgs().then(args => {
	const config = args.configPath ? JSON.parse(fs.readFileSync(path.join(args.configPath, ".babelrc"))) : {};
	require("babel-core/register")(config);
	cli.run(args);
}).catch(console.error);
