var winston = require('winston')
,   common  = require('./common')

var makeLogger = function(group, opts){
	var config = common.config[group];

	var fileTransport = new (winston.transports.File)({
		name      : 'file',
		level     : config.baseLevel,
		stream    : process.stdout,
		json      : false,
		timestamp : global.TIMESTAMP_TRITON_LOG_OUTPUT,
	});

	var logger = new (winston.Logger)({
		transports: [
			fileTransport,
		],
	});

	// Need to be able to refresh this.
	(logger.updateColorize = function(){
		logger.transports.file.label = colorizeName(opts);
		logger.transports.file.colorize = global.COLORIZE_TRITON_LOG_OUTPUT;
	})();

	logger.setLevels(config.levels);

	logger.addRewriter(errorInterceptor);

	logger.stack = common.stack;

	winston.addColors(config.colors);

	// For instantiating new transports later.
	logger.opts = opts;

	(config.extraTransports||[])
		.forEach(transport => logger.add(transport, opts));

	return logger;
}

// Error objects are weird.  Let's turn them into normal objects.
function errorInterceptor (level, msg, meta) {
	if (meta instanceof Error) {
		return {
			message : meta.message,
			stack   : meta.stack,
		};
	}

	return meta;
}

var getLogger = common.makeGetLogger(makeLogger);

var colorizeName = function(opts){

	// Only colorize if we're attached to a terminal.
	if (!global.COLORIZE_TRITON_LOG_OUTPUT) return opts.name;

	return `\x1B[38;5;${opts.color.server}m${opts.name}\x1B[0m`;
}

var setLevel = function(group, level){

	// Update level for any future loggers.
	common.config[group].baseLevel = level;

	common.forEachLogger((logger, loggerGroup) => {
		if (loggerGroup === group) logger.transports.file.level = level;
	});
}

var addTransport = function(group, transport){

	if (!common.config[group].extraTransports){
		common.config[group].extraTransports = [];
	}

	common.config[group].extraTransports.push(transport);

	common.forEachLogger((logger, loggerGroup) => {
		if (loggerGroup === group) logger.add(transport, logger.opts);
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

module.exports = {
	addTransport,
	getLogger,
	setColorize,
	setLevel,
	setTimestamp,
};
