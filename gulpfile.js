

var gulp = require("gulp"),
   es6to5 = require("gulp-6to5"),
   replace = require("gulp-replace"),
//   jasmine = require("gulp-jasmine"),
   rename = require("gulp-rename");


function transpile(serverSide) {
	return gulp.src(["core/**/*.js", "core/**/*.jsx"])
		.pipe(replace("SERVER_SIDE", serverSide ? "true" : "false"))
		.pipe(replace(/__LOGGER__(?:\([^)]*\))?/g, "{name:'foo', color:{server:61,client:'rgb(42,42,127)'}}"))
		.pipe(es6to5())
		.pipe(rename(function (path) {
			path.extname = ".js";
		}))
		.pipe(gulp.dest('build/' + (serverSide ? "server" : "client") ));
}

gulp.task('transpile', ["transpileClient", "transpileServer"]);

gulp.task("transpileClient", function() {
	return transpile(false);
});

gulp.task("transpileServer", function() {
	return transpile(true);
});

gulp.task("copyTestExtras", function() {
	return gulp.src("core/**/jasmine.json")
		.pipe(gulp.dest("build/server"))
		.pipe(gulp.dest("build/client"));
});

gulp.task("test", ["build"], function() {
	return gulp.src("build/server/spec/**/*Spec.js")
		.pipe(jasmine({verbose: true, includeStackTrace: true}));
})


gulp.task("build", ["transpile", "copyTestExtras"]);

gulp.task('watch', function () {
   gulp.watch(["core/**/*.js", "core/**/*.jsx"], ['transpile']);
});

// todo: how to watch?

// todo: where should tests go?

// todo: fix logger

// todo: what to do about root JS files