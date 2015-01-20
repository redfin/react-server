var winston = require('winston')
,   common  = require('./common')
,   stats   = require('./stats')

var loggers = {};

for (var group in common.config)
	loggers[group] = new winston.Container({});

var getLoggerForConfig = function(group, opts){
	var config = common.config[group];

	// The `loggers` collection's `get` method auto-adds on miss, and
	// returns existing on hit.
	var logger = loggers[group].get(opts.name, {
		console: {
			label     : colorizeName(opts),
			level     : config.baseLevel,
			colorize  : process.stdout.isTTY,
			timestamp : false,  // TODO: Want this in production.
		}
		// TODO: Email transport for high-level logs in production.
	});

	logger.setLevels(config.levels);

	winston.addColors(config.colors);

	return logger;
}

var colorizeName = function(opts){

	// Only colorize if we're attached to a terminal.
	if (!process.stdout.isTTY)
		return opts.name;

	return `\x1B[38;5;${opts.color.server}m${opts.name}\x1B[0m`;
}

var getLogger = stats.makeGetLogger(getLoggerForConfig);

module.exports = { getLogger };
