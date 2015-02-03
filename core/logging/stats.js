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

// This is a subjective classification of gauge values into three
// buckets: "lo", "hi" and "ok".
//
// If you're tracking something for which these default thresholds don't make
// sense, you can override them in your call to `getLogger`.
//
// Example:
//
//   var logger = require('./logging').getLogger(__LOGGER__({
//           gauge: { lo: 10000, hi: 100000 }
//   }));
//
var DEFAULT_GAUGE_THRESHOLDS = {
	lo: -1,
	hi: 101,
}

var loggers = {};

// Each logger actually has some secondary loggers attached to it for stats.
// This helper wires them up.
var wrapLogger = function(getLoggerForConfig, opts){

	var mainLogger    = getLoggerForConfig('main',  opts)
	,   timeLogger    = getLoggerForConfig('time',  opts)
	,   gaugeLogger   = getLoggerForConfig('gauge', opts)
	,   classifyTime  = makeTimeClassifier(opts)
	,   classifyGauge = makeGaugeClassifier(opts)

	// These are methods that are exposed on the primary logger.
	// They just dispatch to appropriate log levels on secondary loggers.
	mainLogger.time  = (token, ms,  opts) => timeLogger [classifyTime (ms,  opts)](token, {ms });
	mainLogger.gauge = (token, val, opts) => gaugeLogger[classifyGauge(val, opts)](token, {val});

	// This is just a convenience wrapper around the `time` method.
	mainLogger.timer = (token, opts) => {

		var t0 = new Date // For use by `timer.stop`.
		,   tt = t0       // For use by `timer.tick`.
		,   nt = 0        // Number of times `tick` has been called.

		return {

			// The `stop` method logs the total elapsed time since
			// timer creation.
			stop: () => mainLogger.time(token, new Date - t0, opts),

			// The `tick` method logs the time elapsed since the
			// last call to `tick` (or since timer creation).  A
			// tick may be named.  If a name is not passed in the
			// number of times `tick` has been called on this
			// timer will be used.  Don't mix named and un-named
			// ticks.
			tick: (name) => {
				var now = new Date

				name || (name = `tick_${nt++}`);

				mainLogger.time(`${token}.${name}`, now-tt, opts);

				tt = now;
			},
		};
	}

	return mainLogger;
}

// This is used for classifying `time` and `gauge` values.
var makeThresholdsSieve = (options, defaults) => {
	return (key, overrides) => {
		// Sure would be nice to have Array.prototype.find here.
		if ((overrides||{})[key] !== void 0) return overrides[key];
		if ((options  ||{})[key] !== void 0) return options  [key];
		return defaults[key];
	}
}

var makeTimeClassifier = opts => {
	var thresholds = makeThresholdsSieve(opts.timing, DEFAULT_TIME_THRESHOLDS);
	return (ms, o) => {
		     if (ms <= thresholds('fast', o)) return 'fast';
		else if (ms <= thresholds('fine', o)) return 'fine';
		else                                  return 'slow';
	}
}

var makeGaugeClassifier = opts => {
	var thresholds = makeThresholdsSieve(opts.gauge, DEFAULT_GAUGE_THRESHOLDS);
	return (val, o) => {
		     if (val <= thresholds('lo', o)) return 'lo';
		else if (val >= thresholds('hi', o)) return 'hi';
		else                                 return 'ok';
	}

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
