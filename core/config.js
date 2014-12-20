
/**
 * Thin wrapper around the environment-specific configuration file
 */

if (SERVER_SIDE) {

(function () {

	if (!process.env.R3S_CONFIGS) {
		throw 'R3S_CONFIGS environment variable required to start server.';
	}

	var fs = require("fs");
	var configFile = fs.readFileSync(process.env.R3S_CONFIGS + "/config.json");
	module.exports = Object.freeze(JSON.parse(configFile));

})();

} else {

(function () {

	var env = module.exports = {

		rehydrate: function (inputEnv) {
			Object.keys(inputEnv).forEach( key => {
				env[key] = inputEnv[key];
			});

			// janky: remove the 'rehydrate' method from
			// the environment module after it's used
			delete env.rehydrate;
		}
	};

})();

}
