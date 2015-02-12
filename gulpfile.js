var gulp = require("gulp"),
	es6to5 = require("gulp-6to5"),
	replace = require("gulp-replace"),
	rename = require("gulp-rename"),
	sourcemaps = require("gulp-sourcemaps"),
	filter = require("gulp-filter"),
	jasmine = require("gulp-jasmine"),
	common = require("./buildutils/gulp-common"),
	logging = require("./buildutils/logger-loader");

var src = ["core/**/*", "core/**/*"];

function compile(serverSide) {
	var codeFilter = filter(["**/*.js", "**/*.jsx"]);
	return gulp.src(src)
		.pipe(logging())
		.pipe(replace("SERVER_SIDE", serverSide ? "true" : "false"))
		.pipe(codeFilter)
			.pipe(sourcemaps.init())
			.pipe(common.es6Transform())
			.pipe(sourcemaps.write())
			.pipe(rename(function (path) {
				path.extname = ".js";
			}))
		.pipe(codeFilter.restore({end:true}))
		.pipe(gulp.dest('target/' + (serverSide ? "server" : "client") ));
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

gulp.task("test", ["compileServer", "compileClient"], function() {
	return gulp.src("target/server/spec/**/*[Ss]pec.js")
		.pipe(jasmine());
});

// todo: where should tests go?

// todo: add clean