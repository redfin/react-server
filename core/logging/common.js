var stats = require('./stats')

// These are the primary log levels.
// Your logger object has a method for each of these.
var LOG_LEVELS = {
	emergency : 7,
	alert     : 6,
	critical  : 5,
	error     : 4,
	warning   : 3,
	notice    : 2,
	info      : 1,
	debug     : 0,
}

// Need these to be shared across triton and corvair (can actually be modified
// by the logging modules).
var config = (global._TRITON_CONFIG || (global._TRITON_CONFIG = {
	main: {
		baseLevel: 'error',
		levels: LOG_LEVELS,
		colors: {
			emergency : 'red',
			alert     : 'red',
			critical  : 'red',
			error     : 'red',
			warning   : 'yellow',
			notice    : 'yellow',
			info      : 'green',
			debug     : 'blue',
		},
	},

	// This config is for an internal logger used by the `time` method.
	time: {
		// TODO: Some day, when slow times are rare, we should set
		// this to 'slow' in production to surface performance issues.
		baseLevel: 'none',
		levels: {
			none: 3, // Not used.  Disables in production.
			slow: 2,
			fine: 1,
			fast: 0,
		},
		colors: {
			slow: 'red',
			fine: 'yellow',
			fast: 'green',
		},
	},

	// This config is for an internal logger used by the `gauge` method.
	gauge: {
		// TODO: Some day, when abnormal values are rare, we should
		// set this to 'lo' in production to surface issues.
		baseLevel: 'no',
		levels: {
			no: 3, // Not used.  Disables in production.
			hi: 2,
			lo: 1,
			ok: 0,
		},
		colors: {
			hi: 'red',
			lo: 'red',
			ok: 'green',
		},
	},
}));

// These need to be shared across triton and corvair, too.
var loggers = (global._TRITON_LOGGERS || (global._TRITON_LOGGERS = {}));

// We may have loggers with the same name in different groups, so we'll give
// each group its own container.
if (!Object.keys(loggers).length)
	for (var group in config)
		loggers[group] = {};

// This is just a cache.
// Don't want to instantiate a given logger more than once.
var getLoggerForConfig = makeLogger => {
	return function(group, opts){
		return loggers[group][opts.name] || (
			loggers[group][opts.name] = makeLogger(group, opts)
		);
	}
}

// This is a helper function that takes an internal `makeLogger`
// function and produces a public `getLogger` function.  The produced
// `getLogger` function calls the provided `makeLogger` function for
// each of our two loggers and then stitches the stats logger onto the main
// logger.
var makeGetLogger = makeLogger => (
	(opts) => stats.getCombinedLogger(getLoggerForConfig(makeLogger), opts)
);

// Just a handy helper for iteration.
var forEachLogger = callback => Object.keys(config).forEach(group => {
	Object.keys(loggers[group]).forEach(logger => {
		callback(loggers[group][logger], group);
	});
});

module.exports = { config, loggers, makeGetLogger, forEachLogger };
