var gulp = require("gulp"),
	babel = require("gulp-babel"),
	replace = require("gulp-replace"),
	rename = require("gulp-rename"),
	sourcemaps = require("gulp-sourcemaps"),
	filter = require("gulp-filter"),
	changed = require("gulp-changed"),
	jasmine = require("gulp-jasmine"),
	logging = require("react-server-gulp-module-tagger"),
	istanbul = require('gulp-istanbul'),
	gulpif = require("gulp-if"),
	minimist = require("minimist");

var availableOptions = {
	'boolean': [ 'verbose', 'skipSourcemaps' ],
	'string' : [ 'specs' ],
	'default': {
		'verbose': false,
		'skipSourcemaps': false,
	},
}
var options = minimist(process.argv.slice(2), availableOptions);

function shouldSourcemap () {
	return !options.skipSourcemaps;
}
function isVerbose () {
	return !!options.verbose;
}
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

var src = ["core/**/*.js", "core/**/*.jsx", "core/**/*.json"];

function compile(serverSide) {
	var codeFilter = filter(["**/*.js", "**/*.jsx"], {restore: true});
	var dest = 'target/' + (serverSide ? "server" : "client");
	return gulp.src(src)
		.pipe(codeFilter)
		.pipe(changed(dest, {extension: '.js'}))
		.pipe(logging())
		.pipe(replace("SERVER_SIDE", serverSide ? "true" : "false"))
		.pipe(gulpif(shouldSourcemap(), sourcemaps.init()))
		.pipe(babel({
			rootMode: "upward",
		}))
		.pipe(gulpif(shouldSourcemap(), sourcemaps.write()))
		.pipe(rename(function (path) {
			path.extname = ".js";
		}))
		.pipe(codeFilter.restore)
		.pipe(gulp.dest(dest));
}

gulp.task('compile', ["compileClient", "compileServer"]);

gulp.task("compileClient", function() {
	return compile(false);
});

gulp.task("compileServer", function() {
	return compile(true);
});

gulp.task("build", ["compile"]);

gulp.task('watch', function () {
	gulp.watch(src, ["build"]);
});

gulp.task("test-coverage", ["compileServer", "compileClient"], function(cb) {
	gulp.src(['target/server/**/*.js', "!target/server/test/**/*.js", "!target/server/test-temp/**/*.js"])
		.pipe(istanbul({includeUntested:true})) // Covering files
		.pipe(gulp.dest("target/server-covered")) // copy covered files to a parallel directory
		.on('finish', function () {
			gulp.src("target/server/test/**/*.js")
				.pipe(gulp.dest("target/server-covered/test"))
				.on("finish", function() {
					gulp.src(getSpecGlob('target/server-covered/test/**/')).pipe(jasmine())
						.pipe(istanbul.writeReports({dir: './target/coverage'})) // Creating the reports after tests runned
						.on('end', cb);
				});
		});
});


gulp.task("test", ["jasmine"]);

gulp.task("jasmine", ["compileServer", "compileClient"], function() {

	return gulp.src(getSpecGlob("target/server/**/__tests__/**/"))
		.pipe(jasmine(isVerbose() ? {verbose:true, includeStackTrace: true} : {}));
});
