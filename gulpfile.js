

var gulp = require("gulp"),
	es6to5 = require("gulp-6to5"),
	replace = require("gulp-replace"),
//   jasmine = require("gulp-jasmine"),
	forEach = require("gulp-foreach"),
	rename = require("gulp-rename");

require('gulp-foreach')
function transpile(serverSide) {
	return gulp.src(["core/**/*.js", "core/**/*.jsx"])
		.pipe(forEach(function(stream, file){
			return stream
				.pipe(replace(/__LOGGER__(?:\(\s*(\{[\s\S]*?\})\s*\))?/g, function (match, optionString) {
					optionString = optionString || "";
					// The slash replacement here is so we don't choke on example
					// loggers in comments. We can't just use eval because the first line of the match generally
					// does not have a // before it, so it's not valid JS.
					optionString = optionString.replace(/^\/\//mg,'');

					// optionString now represents an expression that should be run to make an options object.
					var options = optionString ? new Function("return "+optionString)() : {};

					// we use dots instead of slashes because statsd likes dots as separators. we also attempt to 
					// strip the last segment, assuming it's a file extension.
					if (!options.name) options.name = "triton." + file.relative.replace("/", ".").replace(/\.[^\.]*$/, "") + (options.label ? "." + options.label : "");

					return JSON.stringify(options);
			}));
		}))
		.pipe(replace("SERVER_SIDE", serverSide ? "true" : "false"))
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

// todo: add clean