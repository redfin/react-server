var winston = require('winston')
,   common  = require('./common')
,   stats   = require('./stats')

var loggers = {};

for (var group in common.config)
	loggers[group] = new winston.Container({});

var getLoggerForConfig = function(name, group){
	var config   = common.config[group]
	,   colorize = getColorize(name)

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

	// This function returns a function that colorizes text for the
	// terminal.  Each time this function is called it returns a function
	// that produces a new color (from our `colors` list).
	return function(name){

		// Only colorize if we're attached to a terminal.
		if (!process.stdout.isTTY)
			return text => text;

		var color = common.getNameColor(name)

		return text => [`\x1B[38;5;${color}m`, text, '\x1B[0m'].join('')
	}
})();

var getLogger = stats.makeGetLogger(getLoggerForConfig);

module.exports = { getLogger };
