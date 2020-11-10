var stats = require('./stats')

var LOG_LEVELS = {
	emergency : 0,
	alert     : 1,
	critical  : 2,
	error     : 3,
	warning   : 4,
	notice    : 5,
	info      : 6,
	debug     : 7,
}

var config = (global._REACT_SERVER_CONFIG || (global._REACT_SERVER_CONFIG = {
	main: {
		baseLevel: 'error',
		levels: LOG_LEVELS,
		colors: {
			emergency : 'red',
			alert     : 'red',
			critical  : 'red',
			error     : 'red',
			warning   : 'yellow',
			notice    : 'yellow',
			info      : 'green',
			debug     : 'blue',
		},
	},

	time: {
		baseLevel: 'none',
		levels: {
			none: 0, 
			slow: 1,
			fine: 2,
			fast: 3,
		},
		colors: {
			slow: 'red',
			fine: 'yellow',
			fast: 'green',
		},
	},

	gauge: {
		baseLevel: 'no',
		levels: {
			no: 0, 
			hi: 1,
			lo: 2,
			ok: 3,
		},
		colors: {
			hi: 'red',
			lo: 'red',
			ok: 'green',
		},
	},
}));

var loggers = (global._REACT_SERVER_LOGGERS || (global._REACT_SERVER_LOGGERS = {}));

if (!Object.keys(loggers).length){
	for (var group in config){
		if (!config.hasOwnProperty(group)) continue;
		loggers[group] = {};
	}
}

var getLoggerForConfig = makeLogger => {
	return function(group, opts){
		return loggers[group][opts.name] || (
			loggers[group][opts.name] = makeLogger(group, opts)
		);
	}
}

var makeGetLogger = makeLogger => (
	opts => stats.getCombinedLogger(getLoggerForConfig(makeLogger), opts)
);

var forEachLogger = callback => Object.keys(config).forEach(group => {
	Object.keys(loggers[group]).forEach(logger => {
		callback(loggers[group][logger], group);
	});
});

function stack(strip=0){
	return (new Error().stack || '').split("\n").slice(2+strip).join("\n")
}

module.exports = { config, loggers, stack, makeGetLogger, forEachLogger };
