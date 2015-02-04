var gulp = require("gulp"),
	common = require("triton/buildutils/gulp-common");

gulp.task("compile", function() {
	gulp.src(["**/*.js", "!node_modules/**"])
		.pipe(common.es6Transform())
		.pipe(gulp.dest('target/'));
});

gulp.task("build", ["compile"]);