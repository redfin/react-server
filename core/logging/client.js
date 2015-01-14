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

var makeLogger = function(name, group){
	var config    = common.config[group]
	,   nameColor = getNameColor()

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

var getNameColor = (function(){
	var colors = [
		'#000080', '#008000', '#008080', '#800000', '#800080', '#808000', '#808080',
		'#0000FF', '#00FF00', '#00FFFF', '#FF0000', '#FF00FF', '#FFFF00', '#FFFFFF',
	]
	return function(){
		var color = colors.shift();
		colors.push(color);
		return color;
	}
})();

var getLoggerForConfig = function(name, group){
	return loggers[group][name] || (
		loggers[group][name] = makeLogger(name, group)
	);
}

var getLogger = stats.makeGetLogger(getLoggerForConfig);

module.exports = { getLogger };
