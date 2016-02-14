var gulp = require("gulp"),
	babel = require("gulp-babel");

gulp.task("default", () => {
	return gulp.src("src/**/*.js")
		.pipe(babel({presets: ["es2015", "react"], plugins: ["transform-runtime"]}))
		.pipe(gulp.dest("target"));
});
