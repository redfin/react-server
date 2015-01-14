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
			alert     : 'red',
			critical  : 'red',
			error     : 'red',
			warning   : 'yellow',
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

// This is global so that we don't wind up with different copies for triton
// and corvair.
//
// The best reference I've found for the `xterm-256color` palette is:
//
//   http://www.pixelbeat.org/docs/terminal_colours/#256
//
global._getTritonLoggingNameColor || (global._getTritonLoggingNameColor = (function(){

	var colors = [];

	var makeColor = SERVER_SIDE
		?(r,g,b) => 16 + r*36 + g*6 + b
		:(r,g,b) => `rgb(${(r*42.5)|0},${(g*42.5)|0},${(b*42.5)|0})`

	for (var r = 1; r < 6; r+=2)
		for (var g = 1; g < 6; g+=2)
			for (var b = 1; b < 6; b+=2)
				if (r != g || g != b)
					colors.push(makeColor(r,g,b));

	var colorMap = {}
	return function(name){
		if (!colorMap[name])
			colors.push(colorMap[name] = colors.shift());
		return colorMap[name];
	}
})());

var getNameColor = _getTritonLoggingNameColor;

module.exports = { config, getNameColor };
