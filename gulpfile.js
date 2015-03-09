var gulp = require("gulp"),
	es6to5 = require("gulp-6to5"),
	replace = require("gulp-replace"),
	rename = require("gulp-rename"),
	sourcemaps = require("gulp-sourcemaps"),
	filter = require("gulp-filter"),
	changed = require("gulp-changed"),
	jasmine = require("gulp-jasmine"),
	common = require("./buildutils/gulp-common"),
	logging = require("./buildutils/logger-loader"),
	istanbul = require('gulp-istanbul');

var src = ["core/**/*", "core/**/*"];

function compile(serverSide) {
	var codeFilter = filter(["**/*.js", "**/*.jsx"]);
	var dest = 'target/' + (serverSide ? "server" : "client");
	return gulp.src(src)
		.pipe(codeFilter)
			.pipe(changed(dest, {extension: '.js'}))
			.pipe(logging())
			.pipe(replace("SERVER_SIDE", serverSide ? "true" : "false"))
			.pipe(sourcemaps.init())
			.pipe(common.es6Transform())
			.pipe(sourcemaps.write())
			.pipe(rename(function (path) {
				path.extname = ".js";
			}))
		.pipe(codeFilter.restore())
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
	gulp.src(['target/server/**/*.js', "!target/server/spec/**/*.js", "!target/server/test-temp/**/*.js"])
		.pipe(istanbul({includeUntested:true})) // Covering files
		.pipe(gulp.dest("target/server-covered")) // copy covered files to a parallel directory
		.on('finish', function () {
			gulp.src("target/server/spec/**/*.js")
				.pipe(gulp.dest("target/server-covered/spec"))
				.on("finish", function() {
					gulp.src(['target/server-covered/spec/**/*[Ss]pec.js'])
						.pipe(jasmine())
						.pipe(istanbul.writeReports()) // Creating the reports after tests runned
						.on('end', cb);
    			});
    	});
});

gulp.task("test", ["compileServer", "compileClient"], function() {
	return gulp.src("target/server/spec/**/*[Ss]pec.js")
		.pipe(jasmine());
});

// todo: where should tests go?

// todo: add clean