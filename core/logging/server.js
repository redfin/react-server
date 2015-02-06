var winston = require('winston')
,   common  = require('./common')
,   stats   = require('./stats')

// These need to be shared across triton and corvair.
var loggers = (global._TRITON_LOGGERS || (global._TRITON_LOGGERS = {}));

if (!Object.keys(loggers).length)
	for (var group in common.config)
		loggers[group] = new winston.Container({});

var getLoggerForConfig = function(group, opts){
	var config = common.config[group];

	// The `loggers` collection's `get` method auto-adds on miss, and
	// returns existing on hit.
	var logger = loggers[group].get(opts.name, {
		console: {
			level     : config.baseLevel,
			timestamp : false,  // TODO: Want this in production.
		}
		// TODO: Email transport for high-level logs in production.
	});

	// Need to be able to refresh this.
	(logger.updateColorize = function(){
		logger.transports.console.label = colorizeName(opts);
		logger.transports.console.colorize = COLORIZE_TRITON_LOG_OUTPUT;
	})();

	logger.setLevels(config.levels);

	winston.addColors(config.colors);

	return logger;
}

var colorizeName = function(opts){

	// Only colorize if we're attached to a terminal.
	if (!COLORIZE_TRITON_LOG_OUTPUT)
		return opts.name;

	return `\x1B[38;5;${opts.color.server}m${opts.name}\x1B[0m`;
}

var getLogger = stats.makeGetLogger(getLoggerForConfig);

var setLevel = function(group, level){

	// Update level for any future loggers.
	common.config[group].baseLevel = level;

	// Also need to reconfigure any loggers that are alredy set up.
	for (var logger in loggers[group].loggers)
		loggers[group].loggers[logger].transports.console.level = level;
}

var setColorize = function(bool){

	global.COLORIZE_TRITON_LOG_OUTPUT = bool;

	Object.keys(common.config).forEach(group => {

		// Update any loggers that are alredy set up.
		for (var logger in loggers[group].loggers)
			loggers[group].loggers[logger].updateColorize();

	});
}

// Default is only if we're directly attached to a terminal.
// Can be overridden (This `setColorize` function is exported).
setColorize(process.stdout.isTTY);

module.exports = { getLogger, setLevel, setColorize };
