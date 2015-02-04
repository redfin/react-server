var gulp = require("gulp"),
	common = require("triton/buildutils/gulp-common");

var src = ["**/*.js", "!node_modules/**", "!target/**"];
gulp.task("compile", function() {
	gulp.src(src)
		.pipe(common.es6Transform())
		.pipe(gulp.dest('target/'));
});

gulp.task("build", ["compile"]);

gulp.task('watch', function () {
   gulp.watch(src, ["build"]);
});
