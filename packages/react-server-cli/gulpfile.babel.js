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
		.pipe(babel({
			rootMode: "upward",
		}))
		.pipe(gulp.dest(dest));
});

gulp.task("test", ["default"], () => {
	return gulp.src("target/__tests__/**/*[Ss]pec.js")
		.pipe(jasmine({}));
});

gulp.task("watch", () => {
	gulp.watch("src/**/*.js", ['default']);
});
