// This is a subjective classification of response times into three
// performance buckets: "fast", "fine" and "slow".
//
// If you're timing something for which these default thresholds don't make
// sense, you can override them in your call to `getLogger`.
//
// Example:
//
//   var logger = require('./logging').getLogger(__LOGGING_NAME__, {
//	fast: 25,
//	fine: 100,
//   });
//
var DEFAULT_THRESHOLDS = {
	fast: 100,
	fine: 250,
}

var loggers = {};

// Each logger actually has a second logger attached to it for stats.
// This helper wires them up.
var wrapLogger = function(getLoggerForConfig, name, options){

	var mainLogger  = getLoggerForConfig('main',  name, options)
	,   statsLogger = getLoggerForConfig('stats', name, options)

	// Copy the options we care about into a new object and fill in the
	// defaults where necessary.
	var opts = {};
	for (var k in DEFAULT_THRESHOLDS)
		opts[k] = (options||{})[k]||DEFAULT_THRESHOLDS[k];

	var classify = ms => {
		     if (ms <= opts.fast) return 'fast';
		else if (ms <= opts.fine) return 'fine';
		else                      return 'slow';
	}

	// This is the method that's exposed on the primary logger.
	// It just dispatches to the appropriate log level on the secondary
	// logger.
	mainLogger.time = (token, ms) => statsLogger[classify(ms)](token, {ms});

	return mainLogger;
}

var getCombinedLogger = function(getLoggerForConfig, name, options){
	return loggers[name] || (loggers[name] = wrapLogger(getLoggerForConfig, name, options));
}

// This is a helper function that takes an internal `getLoggerForConfig`
// function and produces a public `getLogger` function.  The produced
// `getLogger` function calls the provided `getLoggerForConfig` function for
// each of our two loggers and then stitches the stats logger onto the main
// logger.
var makeGetLogger = getLoggerForConfig => (
	(name, options) => getCombinedLogger(getLoggerForConfig, name, options)
);

module.exports = { makeGetLogger };
