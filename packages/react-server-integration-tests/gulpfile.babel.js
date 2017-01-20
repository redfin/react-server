import babel from "gulp-babel"
import filter from "gulp-filter"
import gulp from "gulp"
import jasmine from "gulp-jasmine"
import minimist from "minimist"

function isVerbose () {
	return !!options.verbose;
}
var availableOptions = {
	'boolean': [ 'verbose', 'skipSourcemaps' ],
	'string' : [ 'specs' ],
	'default': {
		'verbose': process.env.DEBUG || false,
		'skipSourcemaps': false,
	},
}
var options = minimist(process.argv.slice(2), availableOptions);

function getSpecGlob (prefix) {
	// add a wildcard onto the end if no file extension or wildcard
	// currently present
	var specGlob = options.specs || "*[Ss]pec.js";
	if (!specGlob.endsWith(".js") && !specGlob.endsWith("*")) {
		specGlob += "*";
	}

	var specs = prefix + specGlob;

	if (isVerbose()) {
		console.log("Running specs: ", specs);
	}

	return specs;
}
gulp.task("compile", () => {
	const jsFilter = filter("**/*.js", {restore:true});

	return gulp.src("src/**")
		.pipe(jsFilter)
			.pipe(babel())
		.pipe(jsFilter.restore)
		.pipe(gulp.dest("target"));
});

gulp.task("test", ["compile"], function() {

	return gulp.src(getSpecGlob("target/**/__tests__/**/"))
		.pipe(jasmine(isVerbose() ? {verbose:true, includeStackTrace: true} : {}));
});

gulp.task("eslint", [], function() {
	// we don't care as much about linting tests.
});
