require("get-stdin")().then(src => console.log(
	"\n"+
	"/*! LAB.js (LABjs :: Loading And Blocking JavaScript)\n"+
	"    v2.0.3 (c) Kyle Simpson\n"+
	"    MIT License\n"+
	"*/\n"+
	require("uglify-js").minify(
		src.replace(/\/\*!START_DEBUG(?:.|[\n\r])*?END_DEBUG\*\//g, ""),
		{fromString: true}
	).code
));
