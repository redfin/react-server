const eslint = require("gulp-eslint");
const gulp = require("gulp");
const path = require("path");

const SRC = ["**/*.js", "!node_modules/**", "!__clientTemp/**"];

gulp.task("travis-ci", ["build"]);

gulp.task("build", ["eslint"]);

gulp.task("eslint", [], () => gulp.src(SRC)
	.pipe(eslint())
	.pipe(eslint.format())
	.pipe(eslint.failAfterError())
);

// There are no tests for this project, currently.
// Just make sure it lints and passes nsp.
gulp.task("test", ["eslint"]);
