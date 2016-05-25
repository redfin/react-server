import eslint from "gulp-eslint";
import gulp from "gulp";

gulp.task("eslint", [], () => {
	return gulp.src(["./hello-world/*.js"])
				.pipe(eslint())
				.pipe(eslint.format())
				.pipe(eslint.failAfterError());
});

// there are no tests for this project :(
gulp.task("test", ["eslint"]);
