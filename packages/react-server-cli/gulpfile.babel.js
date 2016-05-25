import eslint from "gulp-eslint";
import gulp from "gulp";
import babel from "gulp-babel";
import logging from "react-server-gulp-module-tagger";
import gutil from "gulp-util";

gulp.task("default", () => {
	return gulp.src("src/**/*.js")
		.pipe(logging({trim: "react-server/packages/"}))
		.pipe(babel())
		.pipe(gulp.dest("target"))
		.on("error", gutil.log);
});

gulp.task("eslint", [], () => {
	return gulp.src("src/*.js")
				.pipe(eslint())
				.pipe(eslint.format())
				.pipe(eslint.failAfterError());
});

// there are no tests for this project :(
gulp.task("test", ["eslint"]);
