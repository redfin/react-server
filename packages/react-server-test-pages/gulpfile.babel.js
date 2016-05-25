const eslint = require("gulp-eslint");
const gulp = require("gulp");
const nsp = require("gulp-nsp");
const path = require("path");

const SRC = ["**/*.js", "!node_modules/**", "!__clientTemp/**"];

gulp.task("travis-ci", ["build"]);

gulp.task("build", ["eslint", "nsp"]);

gulp.task("nsp", cb => nsp({package: path.resolve("package.json")}, cb));

gulp.task("eslint", [], () => gulp.src(SRC)
	.pipe(eslint())
	.pipe(eslint.format())
	.pipe(eslint.failAfterError())
);

// There are no tests for this project, currently.
// Just make sure it lints.
gulp.task("test", ["eslint"]);
