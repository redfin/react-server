
/**
 * Thin wrapper around the environment-specific configuration file
 */

var config = null;

if (SERVER_SIDE) {

	module.exports = function () {
		// only read out the config once, and then cache it. -sra.
		if (null === config) {
			/*eslint-disable no-process-env */
			if (process.env.REACT_SERVER_CONFIGS) {
				var fs = require("fs");
				/*eslint-disable no-process-env */
				var configFile = fs.readFileSync(process.env.REACT_SERVER_CONFIGS + "/config.json");
				/*eslint-disable no-process-env */
				config = Object.freeze(JSON.parse(configFile));
			} else {
				config = Object.freeze({});
			}
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
		},
	};

	module.exports = function () {
		return env;
	};
}
