import babel from "gulp-babel"
import gulp from "gulp"
import jasmine from "gulp-jasmine"
import minimist from "minimist"
import WebdriverManager from "webdriver-manager"

function isVerbose () {
	return !!options.verbose;
}
var availableOptions = {
	'boolean': [ 'verbose', 'skipSourcemaps' ],
	'string' : [ 'specs' ],
	'default': {
		'verbose': false,
		'skipSourcemaps': false,
	},
}
var options = minimist(process.argv.slice(2), availableOptions);

function getSpecGlob (prefix) {
	// add a wildcard onto the end if no file extension or wildcard
	// currently present
	var specGlob = options.specs || "*Selenium[Ss]pec.js";
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
	return gulp.src("src/**/*.js")
		.pipe(babel())
		.pipe(gulp.dest("target"));
});

var webdriverManager = null;

gulp.task("startSeleniumServer", ["compile"], (cb) => {
	webdriverManager = new WebdriverManager(null, null, true);
	console.log('Starting the Selenium server.');
	webdriverManager.start({}, cb);
})

gulp.task("runTests", ["startSeleniumServer"], function() {
	const stopSeleniumServer = () => {
		console.log('Stopping the Selenium server.');
		gulp.run("stopSeleniumServer");
	};

	return gulp.src(getSpecGlob("target/**/__tests__/**/"))
		.pipe(jasmine(isVerbose() ? {verbose:true, includeStackTrace: true} : {}))
		.on("end", stopSeleniumServer)
		.on("error", stopSeleniumServer);
});

gulp.task("stopSeleniumServer", () => {
	webdriverManager.stop();
});

gulp.task("test", ["runTests"]);

gulp.task("eslint", [], function() {
	// we don't care as much about linting tests.
});
