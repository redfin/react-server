var winston = require('winston')
,   common  = require('./common')

var loggers = new winston.Container({});

var getLogger = function(name){

	// The `loggers` collection's `get` method auto-adds on miss, and
	// returns existing on hit.
	return loggers.get(name, {
		console: {
			label     : name,
			level     : 'info', // TODO: Base on configuration.
			colorize  : true,   // TODO: Only if isatty.
			timestamp : false,  // TODO: Want this in production.
			levels    : common.levels,
			colors    : common.colors,
		}
		// TODO: Email transport for high-level logs in production.
	});
}

module.exports = { getLogger };
