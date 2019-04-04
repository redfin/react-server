const gulp = require("gulp");
const babel = require("gulp-babel");
const eslint = require("gulp-eslint");

const SRC = ["src/*.js", "!node_modules/**"];

const DEST = "target/";

gulp.task("eslint", [], () => gulp.src(SRC)
	.pipe(eslint())
	.pipe(eslint.format())
	.pipe(eslint.failAfterError())
);

gulp.task("compile", () => gulp.src(SRC)
	.pipe(babel({
		rootMode: "upward",
	}))
	.pipe(gulp.dest(DEST))
);


gulp.task("build", ["eslint", "compile"]);

gulp.task("travis-ci", ["build"]);
