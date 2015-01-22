// This is a subjective classification of response times into three
// performance buckets: "fast", "fine" and "slow".
//
// If you're timing something for which these default thresholds don't make
// sense, you can override them in your call to `getLogger`.
//
// Example:
//
//   var logger = require('./logging').getLogger(__LOGGER__({
//           timing: { fast: 25, fine: 100 }
//   }));
//
var DEFAULT_THRESHOLDS = {
	fast: 100,
	fine: 250,
}

var loggers = {};

// Each logger actually has a second logger attached to it for stats.
// This helper wires them up.
var wrapLogger = function(getLoggerForConfig, opts){

	var mainLogger  = getLoggerForConfig('main',  opts)
	,   statsLogger = getLoggerForConfig('stats', opts)

	// Copy the options we care about into a new object and fill in the
	// defaults where necessary.
	var thresholds = {};
	for (var k in DEFAULT_THRESHOLDS)
		thresholds[k] = (opts.timing||{})[k]||DEFAULT_THRESHOLDS[k];

	var classify = ms => {
		     if (ms <= thresholds.fast) return 'fast';
		else if (ms <= thresholds.fine) return 'fine';
		else                            return 'slow';
	}

	// This is the method that's exposed on the primary logger.
	// It just dispatches to the appropriate log level on the secondary
	// logger.
	mainLogger.time = (token, ms) => statsLogger[classify(ms)](token, {ms});

	return mainLogger;
}

var getCombinedLogger = function(getLoggerForConfig, opts){
	return loggers[opts.name] || (loggers[opts.name] = wrapLogger(getLoggerForConfig, opts));
}

// This is a helper function that takes an internal `getLoggerForConfig`
// function and produces a public `getLogger` function.  The produced
// `getLogger` function calls the provided `getLoggerForConfig` function for
// each of our two loggers and then stitches the stats logger onto the main
// logger.
var makeGetLogger = getLoggerForConfig => (
	(opts) => getCombinedLogger(getLoggerForConfig, opts)
);

module.exports = { makeGetLogger };
