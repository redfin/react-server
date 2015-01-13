var DEFAULT_THRESHOLDS = {
	fast: 100,
	fine: 250,
}

var loggers = {};

var wrapLogger = function(mainLogger, statsLogger, requestOptions){

	var opts = {};

	for (var k in DEFAULT_THRESHOLDS)
		opts[k] = (requestOptions||{})[k]||DEFAULT_THRESHOLDS[k];

	var classify = ms => {
		     if (ms <= opts.fast) return 'fast';
		else if (ms <= opts.fine) return 'fine';
		else                      return 'slow';
	}

	mainLogger.time = (token, ms) => statsLogger[classify(ms)](token, {ms});

	return mainLogger;
}

var getCombinedLogger = function(name, options, getLogger){
	return loggers[name] || (loggers[name] = wrapLogger(
		getLogger('main'), getLogger('stats'), options
	));
}

var makeGetLogger = getLogger => (
	(name, options) => getCombinedLogger(
		name, options, group => getLogger(name, group)
	)
);

module.exports = { makeGetLogger };
