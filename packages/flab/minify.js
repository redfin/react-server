require("get-stdin")().then(src => console.log(
	"\n"+
	"/*! LAB.js (LABjs :: Loading And Blocking JavaScript)\n"+
	"    v2.0.3 (c) Kyle Simpson\n"+
	"    MIT License\n"+
	"*/\n"+
	require("uglify-js").minify(
		src

			// Remove a few hand-annotated debug-related chunks.
			.replace(/\/\*!START_DEBUG(?:.|[\n\r])*?END_DEBUG\*\//g, "")


			// Let Uglify's dead-code elimination handle the rest.
			.replace(/\w+\[_Debug]/g, "false"),

		{fromString: true}
	).code
));
