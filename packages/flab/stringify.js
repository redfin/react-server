console.log(
	'module.exports = '+
	require("fs").readFileSync("/dev/stdin", "utf-8")
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/^/gm, '"')
		.replace(/$/gm, '\\n"+')+
	'"";'
);
