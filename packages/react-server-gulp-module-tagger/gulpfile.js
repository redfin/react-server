const path   = require("path");
const gulp   = require("gulp");
const nsp    = require("gulp-nsp");
const eslint = require("gulp-eslint");

gulp.task("eslint", [], () =>  gulp.src("index.js")
	.pipe(eslint())
	.pipe(eslint.format())
	.pipe(eslint.failAfterError())
);

gulp.task("nsp", (cb) => nsp({package: path.resolve("package.json")}, cb));

gulp.task("test", ["nsp", "eslint"]);
