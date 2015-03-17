
/**
 * Thin wrapper around the environment-specific configuration file
 */

 var config = null;

if (SERVER_SIDE) {

module.exports = function () {

	// only read out the config once, and then cache it. -sra.
	if (null === config) {
		if (!process.env.TRITON_CONFIGS) {
			throw new Error('TRITON_CONFIGS environment variable required to start server.');
		}

		var fs = require("fs");
		var configFile = fs.readFileSync(process.env.TRITON_CONFIGS + "/config.json");
		config = Object.freeze(JSON.parse(configFile));
	}

	return config;
};

} else {

	// I'm not entirely clear why this code is here; it seems to just copy all the key & values from inputEnv; 
	// I'm not clear why the client wouldn't just use inputEnv.
	var env = {

		rehydrate: function (inputEnv) {
			Object.keys(inputEnv).forEach( key => {
				env[key] = inputEnv[key];
			});

			// janky: remove the 'rehydrate' method from
			// the environment module after it's used
			delete env.rehydrate;
		}
	};

	module.exports = function () {
		return env;
	};
}
