import eslint from "gulp-eslint";
import gulp from "gulp";
import babel from "gulp-babel";
import changed from "gulp-changed";
import jasmine from "gulp-jasmine";
import logging from "react-server-gulp-module-tagger";

gulp.task("default", () => {
	var dest = "target";
	return gulp.src("src/**/*.js")
		.pipe(changed(dest))
		.pipe(logging())
		.pipe(babel())
		.pipe(gulp.dest(dest));
});

gulp.task("eslint", [], () => {
	return gulp.src("src/**/*.js")
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

gulp.task("test", ["default", "eslint"], () => {
	return gulp.src("target/__tests__/**/*[Ss]pec.js")
		.pipe(jasmine({}));
});

gulp.task("watch", () => {
	gulp.watch("src/**/*.js", ['default']);
});
