const path   = require('path');
const gulp   = require('gulp');
const nsp    = require('gulp-nsp');
const babel  = require('gulp-babel');
const eslint = require('gulp-eslint');
const rename = require('gulp-rename');
const tagger = require('react-server-gulp-module-tagger');

const SRC = "src/**/*.js";

gulp.task('build', ['build-index', 'build-lib']);

gulp.task('build-index', () => gulp.src('main.js')
	.pipe(tagger({trim: 'react-server/packages/'}))
	.pipe(rename('index.js'))
	.pipe(gulp.dest("."))
)

gulp.task('build-lib', () => gulp.src(SRC)
	.pipe(babel())
	.pipe(gulp.dest("./lib"))
);

gulp.task('eslint', [], () =>  gulp.src(SRC)
	.pipe(eslint())
	.pipe(eslint.format())
	.pipe(eslint.failAfterError())
);

gulp.task('nsp', (cb) => nsp({package: path.resolve('package.json')}, cb));

gulp.task('test', ['nsp', 'eslint']);
