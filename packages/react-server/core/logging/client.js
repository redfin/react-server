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

var _console = ['log','error','warn','debug','info'].reduce((m,v) => {
	// IE9 doesn't even _define_ console unless the dev tools are open.
	// IE9 also needs a real function for `apply` to work.
	m[v] = (typeof console === 'undefined')
		?() => {}
		:Function.prototype.bind.call(console[v]||console.log, console)
	return m;
}, {});

var lvl_map = {
	emergency : 'error',
	alert     : 'error',
	critical  : 'error',
	error     : 'error',
	warning   : 'warn',
	notice    : 'warn',
	debug     : 'debug',
	info      : 'info',
};
var clog = lvl => _console[lvl_map[lvl] || 'log'];

// IE9 also doesn't support color.
var monochrome = typeof _console.log == "object";

// We don't chain our transports in the same way as winston client-side, but
// we'll conform more-or-less to winston's interface for the `log` method for
// consistency's sake.  This means passing a function as the fourth argument.
// We'll use a noop.
var noop = () => {};

var transportQueue = [];

var transportTimer;

function runTransports() {
	var batch = transportQueue;
	transportQueue = [];
	transportTimer = null;
	for (var i = 0; i < batch.length; i++) {
		const [transport, level, msg, meta] = batch[i];
		transport.log(level, msg, meta, noop);
	}
}

function scheduleTransport(tuple) {
	transportQueue.push(tuple);
	if (!transportTimer) {
		transportTimer = setTimeout(runTransports, 0);
	}
}

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

			if (this.transports.length) {
				this.transports.forEach(transport => {
					if (config.levels[level] > config.levels[transport.level]) return;
					scheduleTransport([transport, level, msg, meta]);
				});
			}

			if (config.levels[level] > config.levels[this.level]) return;

			clog(level).apply(
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
		logger[level] = function(a, b, c){
			logger.log(level, a, b, c);
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

module.exports = { getLogger, setLevel, addTransport };
