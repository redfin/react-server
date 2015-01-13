// These are the primary log levels.
// Your logger object has a method for each of these.
var LOG_LEVELS = {
	emergency : 7,
	alert     : 6,
	critical  : 5,
	error     : 4,
	warning   : 3,
	notice    : 2,
	info      : 1,
	debug     : 0,
}

var config = {
	main: {
		baseLevel: 'debug',
		levels: LOG_LEVELS,
		colors: {
			emergency : 'red',
			alert     : 'yellow',
			critical  : 'red',
			error     : 'red',
			warning   : 'red',
			notice    : 'yellow',
			info      : 'green',
			debug     : 'blue',
		},
	},

	// This config is for an internal logger used by the `time` method.
	stats: {
		baseLevel: 'fast',
		levels: {
			slow: 2,
			fine: 1,
			fast: 0,
		},
		colors: {
			slow: 'red',
			fine: 'yellow',
			fast: 'green',
		},
	},
};

module.exports = { config };
