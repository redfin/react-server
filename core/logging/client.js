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

// IE9 doesn't even _define_ console unless the dev tools are open.
var _console = (typeof console === 'undefined')
	?{log:()=>{}}
	:console;

// This is just so we have a real function to work with in IE9.
var console_log = Function.prototype.bind.call(_console.log, _console);

// IE9 also doesn't support color.
var monochrome = typeof _console.log == "object";

// We don't chain our transports in the same way as winston client-side, but
// we'll conform more-or-less to winston's interface for the `log` method for
// consistency's sake.  This means passing a function as the fourth argument.
// We'll use a noop.
var noop = () => {};

var makeLogger = function(group, opts){
	var config = common.config[group]

	var logger = {
		opts,
		name: opts.name,
		level: config.baseLevel,
		log: function(level, msg, meta){

			// We want an array of arguments to apply to
			// `console.log` so we don't trail an `undefined` when
			// `meta` isn't passed.
			var args = [msg];
			if (meta !== void 0) args.push(meta);

			this.transports.forEach(transport => {
				if (config.levels[level] < config.levels[transport.level]) return;
				setTimeout(transport.log.bind(transport, level, msg, meta, noop), 0);
			});

			if (config.levels[level] < config.levels[this.level]) return;

			console_log.apply(
				_console,
				(monochrome?[`${level}: [${opts.name}]`]:[
					'%c'+level+'%c: [%c'+opts.name+'%c]',
					'color: '+config.colors[level],
					'color: black',
					'color: '+opts.color.client,
					'color: black',
				]).concat(args)
			);
		},
		transports: [],
		add: function(transport, opts){
			this.transports.push(new transport(opts));
		},
		stack: common.stack,
	}

	Object.keys(config.levels).forEach(level => {
		// note that this has to be an ES-5 style function and cannot be an arrow function
		// because arguments doesn't bind to the arrow function's arguments; it would bind
		// to makeLogger's arguments.
		logger[level] = function(){
			logger.log.apply(logger, [level].concat([].slice.call(arguments)));
		}
	});

	(config.extraTransports||[])
		.forEach(transport => logger.add(transport, opts));

	return logger;
}

var getLogger = common.makeGetLogger(makeLogger);

var setLevel = function(group, level){

	// Update level for any future loggers.
	common.config[group].baseLevel = level;

	common.forEachLogger((logger, loggerGroup) => {
		if (loggerGroup === group) logger.level = level;
	});
}

var addTransport = function(group, transport){

	if (!common.config[group].extraTransports){
		common.config[group].extraTransports = [];
	}

	common.config[group].extraTransports.push(transport);

	common.forEachLogger((logger, loggerGroup) => {
		if (loggerGroup === group) logger.add(transport, logger.opts);
	});
}

var addRewriter = function(rewriter){
	common.forEachLogger(logger => logger.addRewriter(rewriter));
}

module.exports = { getLogger, setLevel, addTransport, addRewriter };
