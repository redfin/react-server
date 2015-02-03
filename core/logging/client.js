/*
 * This is a shim logging module for use in the browser.
 *
 * Our server-side logging library doesn't work client-side.  This just
 * implements the interface with basic output to `console.log`.
 *
 * TODO: For production use we should mimic the interface with NOOPs.
 *
 */

var common = require('./common')
,   stats  = require('./stats')
,	colorForString = require("./colorForString");

// These need to be shared across triton and corvair.
var loggers = (global._TRITON_LOGGERS || (global._TRITON_LOGGERS = {}));

if (!Object.keys(loggers).length)
	for (var group in common.config)
		loggers[group] = {};

var makeLogger = function(group, opts){
	var config = common.config[group]

	var logger = {
		name: opts.name,
		level: config.baseLevel,
		log: function(){
			var args  = [].slice.call(arguments)
			,   level = args.shift()

			if (config.levels[level] < config.levels[this.level])
				return;

			console.log.apply(
				console,
				[
					'%c'+level+'%c: [%c'+opts.name+'%c]',
					'color: '+config.colors[level],
					'color: black',
					'color: '+ colorForString(opts.name).client,
					'color: black',
				].concat(args)
			);
		}
	}

	Object.keys(config.levels).forEach(level => {
		logger[level] = () => logger.log.apply(
			logger, [level].concat([].slice.call(arguments))
		);
	});

	return logger;
}

var getLoggerForConfig = function(group, opts){
	return loggers[group][opts.name] || (
		loggers[group][opts.name] = makeLogger(group, opts)
	);
}

var getLogger = stats.makeGetLogger(getLoggerForConfig);

var setLevel = function(group, level){

	// Update level for any future loggers.
	common.config[group].baseLevel = level;

	// Also need to reconfigure any loggers that are alredy set up.
	for (var logger in loggers[group])
		loggers[group][logger].level = level;
}

module.exports = { getLogger, setLevel };
