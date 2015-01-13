var winston = require('winston')
,   common  = require('./common')
,   stats   = require('./stats')

var loggers = {};

for (var group in common.config)
	loggers[group] = new winston.Container({});

var getLoggerForConfig = function(name, group){
	var config = common.config[group];

	// The `loggers` collection's `get` method auto-adds on miss, and
	// returns existing on hit.
	var logger = loggers[group].get(name, {
		console: {
			label     : name,
			level     : config.baseLevel,
			colorize  : true,   // TODO: Only if isatty.
			timestamp : false,  // TODO: Want this in production.
		}
		// TODO: Email transport for high-level logs in production.
	});

	logger.setLevels(config.levels);

	winston.addColors(config.colors);

	return logger;
}

var getLogger = stats.makeGetLogger(getLoggerForConfig);

module.exports = { getLogger };
