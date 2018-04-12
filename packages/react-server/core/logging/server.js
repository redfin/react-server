var winston = require('winston')
	, common = require('./common')
	, _ = {
		mapValues: require("lodash/mapValues"),
		pickBy: require("lodash/pickBy"),
		isPlainObject: require("lodash/isPlainObject"),
		isEmpty: require("lodash/isEmpty"),
		trimStart: require("lodash/trimStart"),
		truncate: require("lodash/truncate"),
	}
	, responseTransport = require('./response');

var makeLogger = function (group, opts) {
	var config = common.config[group];
	var fileTransport = new (winston.transports.File)({
		name: 'file',
		level: config.baseLevel,
		stream: process.stdout,
		json: false,
		timestamp: global.TIMESTAMP_REACT_SERVER_LOG_OUTPUT,
	});

	var logger = new (winston.Logger)({
		transports: [
			fileTransport,
			responseTransport.getTransportForGroup(group, opts),
		],
	});

	// Need to be able to refresh this.
	(logger.updateColorize = function () {
		logger.transports.file.label = colorizeName(opts);
		logger.transports.file.colorize = global.COLORIZE_REACT_SERVER_LOG_OUTPUT;
	})();

	logger.setLevels(config.levels);

	// Only need to look for errors in the main logger's meta.
	if (group === "main") {
		logger.rewriters.push(errorInterceptor);
	}

	logger.stack = common.stack;

	winston.addColors(config.colors);

	// For instantiating new transports later.
	logger.opts = opts;

	(config.extraTransports || [])
		.forEach(transport => logger.add(transport, opts));

	return logger;
}

// Error objects are weird.  Let's turn them into normal objects.
function errorInterceptor(level, msg, meta) {

	if (meta instanceof Error) {
		meta = { error: meta };
	} else if (meta && meta.status && meta.response) {
		meta = { error: meta };
	}

	if (_.isPlainObject(meta)) {
		// allow {error: <someError>} as a valid `meta`
		meta = _.mapValues(meta, normalizeError);
	}
	return meta;
}

// massage the error into a format suitable for logging
function normalizeError(err) {
	if (err instanceof Error) {
		return _.pickBy({
			message: err.message,
			stack: err.stack,
		}, val => !_.isEmpty(val));
	}

	if (err && err.status && err.response) {
		// this is probably a superagent error response. we definitely don't
		// want to log the whole thing
		return {
			response: {
				status: err.status,
				responseText: _.truncate(_.trimStart(err.response ? err.response.text : "<no response body>"), 200),
			},
		}
	}

	return err;
}


var getLogger = common.makeGetLogger(makeLogger);

function colorizeName(opts) {

	// Only colorize if we're attached to a terminal.
	if (!global.COLORIZE_REACT_SERVER_LOG_OUTPUT) return opts.name;

	return `\x1B[38;5;${opts.color.server}m${opts.name}\x1B[0m`;
}

function setLevel(group, level) {

	// Update level for any future loggers.
	common.config[group].baseLevel = level;

	common.forEachLogger((logger, loggerGroup) => {
		if (loggerGroup === group) logger.transports.file.level = level;
	});
}

function addTransport(group, transport) {

	if (!common.config[group].extraTransports) {
		common.config[group].extraTransports = [];
	}

	common.config[group].extraTransports.push(transport);

	common.forEachLogger((logger, loggerGroup) => {
		if (loggerGroup === group) logger.add(transport, logger.opts);
	});
}

function addRewriter(group, rewriter) {
	common.forEachLogger((logger, loggerGroup) => {
		if (loggerGroup === group) logger.rewriters.push(rewriter);
	});
}

function setTimestamp(bool) {

	global.TIMESTAMP_REACT_SERVER_LOG_OUTPUT = bool;

	// Update any loggers that are alredy set up.
	common.forEachLogger(logger => {
		if (logger.transports.file) {
			logger.transports.file.timestamp = bool;
		}
	});
}

function setColorize(bool) {

	global.COLORIZE_REACT_SERVER_LOG_OUTPUT = bool;

	// Update any loggers that are alredy set up.
	common.forEachLogger(logger => {
		if (logger.updateColorize) {
			logger.updateColorize();
		}
	});
}

// Default is only if we're directly attached to a terminal.
// Can be overridden (This `setColorize` function is exported).
setColorize(process.stdout.isTTY);

// Just the default.
setTimestamp(true);

module.exports = {
	addTransport,
	addRewriter,
	getLogger,
	setColorize,
	setLevel,
	setTimestamp,
};
