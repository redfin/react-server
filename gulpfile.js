var gulp = require("gulp"),
	es6to5 = require("gulp-6to5"),
	replace = require("gulp-replace"),
	rename = require("gulp-rename"),
	sourcemaps = require("gulp-sourcemaps"),
	common = require("./buildutils/gulp-common"),
	logging = require("./buildutils/gulp-logging");

var src = ["core/**/*.js", "core/**/*.jsx"];

function compile(serverSide) {
	return gulp.src(src)
		.pipe(logging())
		.pipe(replace("SERVER_SIDE", serverSide ? "true" : "false"))
		.pipe(sourcemaps.init())
		.pipe(common.es6Transform())
		.pipe(sourcemaps.write())
		.pipe(rename(function (path) {
			path.extname = ".js";
		}))
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

// todo: where should tests go?

// todo: add clean