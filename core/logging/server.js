var winston = require('winston')
,   common  = require('./common')
,   stats   = require('./stats')

var loggers = {};

for (var group in common.config)
	loggers[group] = new winston.Container({});

var getLoggerForConfig = function(name, group){
	var config   = common.config[group]
	,   colorize = getColorize()

	// The `loggers` collection's `get` method auto-adds on miss, and
	// returns existing on hit.
	var logger = loggers[group].get(name, {
		console: {
			label     : colorize(name),
			level     : config.baseLevel,
			colorize  : process.stdout.isTTY,
			timestamp : false,  // TODO: Want this in production.
		}
		// TODO: Email transport for high-level logs in production.
	});

	logger.setLevels(config.levels);

	winston.addColors(config.colors);

	return logger;
}

var getColorize = (function(){

	// Get a set of visually distinct colors.
	//
	// Sure would be nice, here, to just say...
	//
	//   var colors = _.range(19, 232, 11);
	//
	var colors = [];
	for (var i = 19; i < 232; i+=11)
		colors.push(i);

	// This function returns a function that colorizes text for the
	// terminal.  Each time this function is called it returns a function
	// that produces a new color (from our `colors` list).
	return function(){

		// Only colorize if we're attached to a terminal.
		if (!process.stdout.isTTY)
			return text => text;

		var color = colors.shift();

		// In case we wind up with more than `colors.length` loggers.
		colors.push(color);

		return text => [`\x1B[38;5;${color}m`, text, '\x1B[0m'].join('')
	}
})();

var getLogger = stats.makeGetLogger(getLoggerForConfig);

module.exports = { getLogger };
