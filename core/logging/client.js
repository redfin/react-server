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

var loggers = {};

for (var group in common.config)
	loggers[group] = {};

var makeLogger = function(group, name, options){
	var config    = common.config[group]
	,   nameColor = common.getNameColor(name)

	var logger = {
		name,
		log: function(){
			var args  = [].slice.call(arguments)
			,   level = args.shift()

			console.log.apply(
				console,
				[
					'%c'+level+'%c: [%c'+name+'%c]',
					'color: '+config.colors[level],
					'color: black',
					'color: '+nameColor,
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

var getLoggerForConfig = function(group, name, options){
	return loggers[group][name] || (
		loggers[group][name] = makeLogger(group, name, options)
	);
}

var getLogger = stats.makeGetLogger(getLoggerForConfig);

module.exports = { getLogger };
