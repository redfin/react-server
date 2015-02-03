var winston = require('winston')
,   common  = require('./common')
,   stats   = require('./stats')
,	colorForString = require("./colorForString");

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
			label     : colorizeName(opts.name),
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

// takes in a server color, which is a simple int
var colorizeName = function(name){

	var color = colorForString(name).server;
	// Only colorize if we're attached to a terminal.
	if (!process.stdout.isTTY)
		return name;

	return `\x1B[38;5;${color}m${name}\x1B[0m`;
}

var getLogger = stats.makeGetLogger(getLoggerForConfig);

var setLevel = function(group, level){

	// Update level for any future loggers.
	common.config[group].baseLevel = level;

	// Also need to reconfigure any loggers that are alredy set up.
	for (var logger in loggers[group].loggers)
		loggers[group].loggers[logger].transports.console.level = level;
}

module.exports = { getLogger, setLevel };
