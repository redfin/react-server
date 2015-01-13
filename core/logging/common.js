var config = {
	main: {
		baseLevel: 'debug',
		levels: {
			emergency : 7,
			alert     : 6,
			critical  : 5,
			error     : 4,
			warning   : 3,
			notice    : 2,
			info      : 1,
			debug     : 0,
		},
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
