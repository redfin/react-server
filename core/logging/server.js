var winston = require('winston')
,   common  = require('./common')
,   stats   = require('./stats')

// These need to be shared across triton and corvair.
var loggers = (global._TRITON_LOGGERS || (global._TRITON_LOGGERS = {}));

if (!Object.keys(loggers).length)
	for (var group in common.config)
		loggers[group] = {};

var makeLogger = function(group, opts){
	var config = common.config[group];

	var fileTransport = new (winston.transports.File)({
		name      : 'file',
		level     : config.baseLevel,
		stream    : process.stdout,
		json      : false,
		timestamp : false,  // TODO: Want this in production.
	});

	var logger = loggers[group][opts.name] = new (winston.Logger)({
		transports: [
			fileTransport,
		]
	});

	// Need to be able to refresh this.
	(logger.updateColorize = function(){
		logger.transports.file.label = colorizeName(opts);
		logger.transports.file.colorize = COLORIZE_TRITON_LOG_OUTPUT;
	})();

	logger.setLevels(config.levels);

	winston.addColors(config.colors);

	return logger;
}

var getLoggerForConfig = function(group, opts){
	return loggers[group][opts.name] || (
		loggers[group][opts.name] = makeLogger(group, opts)
	);
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
	for (var logger in loggers[group])
		loggers[group][logger].transports.file.level = level;
}

var setColorize = function(bool){

	global.COLORIZE_TRITON_LOG_OUTPUT = bool;

	Object.keys(common.config).forEach(group => {

		// Update any loggers that are alredy set up.
		for (var logger in loggers[group])
			loggers[group][logger].updateColorize();

	});
}

// Default is only if we're directly attached to a terminal.
// Can be overridden (This `setColorize` function is exported).
setColorize(process.stdout.isTTY);

module.exports = { getLogger, setLevel, setColorize };
