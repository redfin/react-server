var winston = require('winston')
,   common  = require('./common')
,   stats   = require('./stats')

var loggers = {};

for (var group in common.config)
	loggers[group] = new winston.Container({});

var getLoggerForConfig = function(group, spec, options){
	var config = common.config[group];

	// The `loggers` collection's `get` method auto-adds on miss, and
	// returns existing on hit.
	var logger = loggers[group].get(spec.name, {
		console: {
			label     : colorizeName(spec),
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

var colorizeName = function(spec){

	// Only colorize if we're attached to a terminal.
	if (!process.stdout.isTTY)
		return spec.name;

	return `\x1B[38;5;${spec.color.server}m${spec.name}\x1B[0m`;
}

var getLogger = stats.makeGetLogger(getLoggerForConfig);

module.exports = { getLogger };
