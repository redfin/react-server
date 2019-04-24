require("get-stdin")().then(src => console.log( // eslint-disable-line no-console
	'module.exports = ' + src
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/^/gm, '"')
		.replace(/$/gm, '\\n"+')+
	'"";'
));
