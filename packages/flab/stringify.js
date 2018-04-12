require("get-stdin")().then(src => console.log(
	'module.exports = ' + src
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/^/gm, '"')
		.replace(/$/gm, '\\n"+') +
	'"";'
));
