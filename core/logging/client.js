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

var loggers = {};

var makeLogger = function(name){
	var logger = {
		name,
		log: function(){
			var args  = [].slice.call(arguments)
			,   level = args.shift()

			console.log.apply(
				console,
				[
					'%c '+level+':',
					'color: '+common.colors[level],
					'['+name+']'
				].concat(args)
			);
		}
	}

	Object.keys(common.levels).forEach(level => {
		logger[level] = () => logger.log.apply(
			logger, [level].concat([].slice.call(arguments))
		);
	});

	return logger;
}

var getLogger = function(name){
	return loggers[name] || (loggers[name] = makeLogger(name));
}

module.exports = { getLogger };
