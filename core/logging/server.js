var winston = require('winston')
,   common  = require('./common')

var makeLogger = function(group, opts){
	var config = common.config[group];

	var fileTransport = new (winston.transports.File)({
		name      : 'file',
		level     : config.baseLevel,
		stream    : process.stdout,
		json      : false,
		timestamp : TIMESTAMP_TRITON_LOG_OUTPUT,
	});

	var logger = new (winston.Logger)({
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

var getLogger = common.makeGetLogger(makeLogger);

var colorizeName = function(opts){

	// Only colorize if we're attached to a terminal.
	if (!COLORIZE_TRITON_LOG_OUTPUT)
		return opts.name;

	return `\x1B[38;5;${opts.color.server}m${opts.name}\x1B[0m`;
}

var setLevel = function(group, level){

	// Update level for any future loggers.
	common.config[group].baseLevel = level;

	common.forEachLogger((logger, loggerGroup) => {
		if (loggerGroup == group)
			logger.transports.file.level = level;
	});
}

var setTimestamp = function(bool){

	global.TIMESTAMP_TRITON_LOG_OUTPUT = bool;

	// Update any loggers that are alredy set up.
	common.forEachLogger(logger => logger.transports.file.timestamp = bool);
}

var setColorize = function(bool){

	global.COLORIZE_TRITON_LOG_OUTPUT = bool;

	// Update any loggers that are alredy set up.
	common.forEachLogger(logger => logger.updateColorize());
}

// Default is only if we're directly attached to a terminal.
// Can be overridden (This `setColorize` function is exported).
setColorize(process.stdout.isTTY);

// Just the default.
setTimestamp(true);

module.exports = { getLogger, setLevel, setColorize, setTimestamp };
