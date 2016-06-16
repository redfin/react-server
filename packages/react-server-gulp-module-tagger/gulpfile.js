const path   = require('path');
const gulp   = require('gulp');
const ava    = require('gulp-ava');
const nsp    = require('gulp-nsp');
const eslint = require('gulp-eslint');

gulp.task('ava', () =>
	gulp.src('test/test.js')
		.pipe(ava())
);

gulp.task('eslint', [], () =>  gulp.src("index.js")
	.pipe(eslint())
	.pipe(eslint.format())
	.pipe(eslint.failAfterError())
);

gulp.task('nsp', (cb) => nsp({package: path.resolve('package.json')}, cb));

gulp.task('test', ['ava', 'nsp', 'eslint']);
