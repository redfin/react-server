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

// This is just so we have a real function to work with in IE9.
var console_log = Function.prototype.bind.call(console.log, console);

// IE9 also doesn't support color.
var monochrome = typeof console.log == "object";

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

			if (monochrome)
				return console_log.apply(
					console,
					[`${level}: [${opts.name}]`].concat(args)
				);

			console.log.apply(
				console,
				[
					'%c'+level+'%c: [%c'+opts.name+'%c]',
					'color: '+config.colors[level],
					'color: black',
					'color: '+opts.color.client,
					'color: black',
				].concat(args)
			);
		}
	}

	Object.keys(config.levels).forEach(level => {
		// note that this has to be an ES-5 style function and cannot be an arrow function  
		// because arguments doesn't bind to the arrow function's arguments; it would bind 
		// to makeLogger's arguments.
		logger[level] = function(){
			logger.log.apply(logger, [level].concat([].slice.call(arguments)));
		}
	});

	return logger;
}

var getLogger = common.makeGetLogger(makeLogger);

var setLevel = function(group, level){

	// Update level for any future loggers.
	common.config[group].baseLevel = level;

	common.forEachLogger((logger, loggerGroup) => {
		if (loggerGroup == group)
			logger.level = level;
	});
}

module.exports = { getLogger, setLevel };
