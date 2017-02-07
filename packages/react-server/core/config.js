/**
 * Thin wrapper around the environment-specific configuration file
 */

var config = null;

if (SERVER_SIDE) {

	module.exports = function () {
		// only read out the config once, and then cache it. -sra.
		if (null === config) {

			//eslint-disable-next-line no-process-env
			if (process.env.REACT_SERVER_CONFIGS) {
				var path = require('path');
				//eslint-disable-next-line no-process-env
				var configFilePath = process.env.REACT_SERVER_CONFIGS;

				// Node.js tries to load `config.js` file first. If `config.js` doesn't exist, Node.js
				// then try to load `config.json`.
				var configFilePath = path.join(process.cwd(), configFilePath + "/config");
				config = require(configFilePath);
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
