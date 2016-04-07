const eslint = require("gulp-eslint");
const gulp = require("gulp");
const babel = require("gulp-babel");
const logging = require("react-server-gulp-module-tagger");

gulp.task("travis-ci", ["build", "eslint"]);

gulp.task("build", () => gulp.src("src/**/*.js")
	.pipe(logging())
	.pipe(babel())
	.pipe(gulp.dest("lib/"))
);

gulp.task("eslint", [], () => gulp.src("src/*.js")
	.pipe(eslint())
	.pipe(eslint.format())
	.pipe(eslint.failAfterError())
);

// There are no tests for this project, currently.
// Just make sure it builds.
gulp.task("test", ["build"]);
