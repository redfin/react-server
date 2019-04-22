const gulp   = require('gulp');
const babel  = require('gulp-babel');
const rename = require('gulp-rename');
const tagger = require('react-server-gulp-module-tagger');

const SRC = "src/**/*.js";

gulp.task('build', ['build-index', 'build-lib']);

gulp.task('build-index', () => gulp.src('main.js')
	.pipe(tagger())
	.pipe(rename('index.js'))
	.pipe(gulp.dest("."))
)

gulp.task('build-lib', () => gulp.src(SRC)
	.pipe(babel())
	.pipe(gulp.dest("./lib"))
);
