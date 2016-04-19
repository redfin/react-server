const path   = require('path');
const gulp   = require('gulp');
const nsp    = require('gulp-nsp');
const babel  = require('gulp-babel');
const eslint = require('gulp-eslint');

const SRC = "src/**/*.js";

gulp.task('build', () => gulp.src(SRC)
	.pipe(babel())
	.pipe(gulp.dest("./lib"))
);

gulp.task('eslint', [], () =>  gulp.src(SRC)
	.pipe(eslint())
	.pipe(eslint.format())
	.pipe(eslint.failAfterError())
);

gulp.task('nsp', (cb) => nsp({package: path.resolve('package.json')}, cb));

gulp.task('test', ['nsp']);
