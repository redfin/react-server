const fs = require("fs");
const path = require("path");
const cli = require(".");

cli.parseCliArgs().then(args => {
	const babelrcPath = path.join(args.configPath, ".babelrc");
	const config = args.configPath && fs.existsSync(babelrcPath) ?
		JSON.parse(fs.readFileSync(babelrcPath)) :
		{};
	require("babel-core/register")(config);
	cli.run(args);
}).catch(console.error);
