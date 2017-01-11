import eslint from "gulp-eslint";
import gulp from "gulp";

gulp.task("eslint", [], () => {
	return gulp.src(["./**/*.js", '!node_modules/**'])
        // eslint() attaches the lint output to the eslint property
        // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failOnError last.
        .pipe(eslint.failAfterError());
});

// there are no tests for this project :(
gulp.task("test", ["eslint"]);
