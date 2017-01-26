console.log(
	"\n"+
	"/*! LAB.js (LABjs :: Loading And Blocking JavaScript)\n"+
	"    v2.0.3 (c) Kyle Simpson\n"+
	"    MIT License\n"+
	"*/\n"+
	require("uglify-js").minify(
		require("fs").readFileSync("/dev/stdin", "utf-8")
			.replace(/\/\*!START_DEBUG(?:.|[\n\r])*?END_DEBUG\*\//g, ""),
		{fromString: true}
	).code
);
