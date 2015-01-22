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
var DEFAULT_TIME_THRESHOLDS = {
	fast: 100,
	fine: 250,
}

// This is a subjective classification of guage values into three
// buckets: "lo", "hi" and "ok".
//
// If you're tracking something for which these default thresholds don't make
// sense, you can override them in your call to `getLogger`.
//
// Example:
//
//   var logger = require('./logging').getLogger(__LOGGER__({
//           guage: { lo: 10000, hi: 100000 }
//   }));
//
var DEFAULT_GUAGE_THRESHOLDS = {
	lo: -1,
	hi: 101,
}

var loggers = {};

// Each logger actually has some secondary loggers attached to it for stats.
// This helper wires them up.
var wrapLogger = function(getLoggerForConfig, opts){

	var mainLogger  = getLoggerForConfig('main',  opts)
	,   timeLogger  = getLoggerForConfig('time',  opts)
	,   guageLogger = getLoggerForConfig('guage', opts)

	// Copy the options we care about into a new object and fill in the
	// defaults where necessary.
	var timeThresholds = {};
	for (var k in DEFAULT_TIME_THRESHOLDS)
		timeThresholds[k] = (opts.timing||{})[k]||DEFAULT_TIME_THRESHOLDS[k];

	var classifyTime = ms => {
		     if (ms <= timeThresholds.fast) return 'fast';
		else if (ms <= timeThresholds.fine) return 'fine';
		else                                return 'slow';
	}

	var guageThresholds = {};
	for (var k in DEFAULT_GUAGE_THRESHOLDS)
		guageThresholds[k] = (opts.guage||{})[k]||DEFAULT_GUAGE_THRESHOLDS[k];

	var classifyGuage = val=> {
		     if (val <= guageThresholds.lo) return 'lo';
		else if (val >= guageThresholds.hi) return 'hi';
		else                                return 'ok';
	}

	// These are methods that are exposed on the primary logger.
	// They just dispatch to appropriate log levels on secondary loggers.
	mainLogger.time  = (token, ms ) => timeLogger [classifyTime (ms )](token, {ms });
	mainLogger.guage = (token, val) => guageLogger[classifyGuage(val)](token, {val});

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
